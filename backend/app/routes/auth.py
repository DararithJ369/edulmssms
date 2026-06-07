import os
from datetime import timedelta
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.middleware.jwt_service import JWTService
from app.services.user_service import UserService
from app.config.session import get_db
from app.schemas.user import LoginRequest, Token
from app.config.logger import security_logger
from app.utils.device_tracker import DeviceTracker
from app.services.audit_log_service import AuditLogService
from pydantic import BaseModel

load_dotenv()

SECRET_KEY                  = os.getenv("SECRET_KEY")
ALGORITHM                   = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_DAYS   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

bearer_scheme = HTTPBearer()

# No prefix — mounts directly at /api/v1/
# POST /api/v1/login
# POST /api/v1/logout
# POST /api/v1/refresh
auth_router = APIRouter(tags=["Auth"])


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Login ─────────────────────────────────────────────────────────────────────

@auth_router.post("/login", response_model=Token)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    user = UserService.login(db, data)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    info      = DeviceTracker.get_device_info(request)
    client_ip = DeviceTracker.get_client_ip(request)
    security_logger.info(
        f"User {user.email} logged in from IP {client_ip} — {info}"
    )

    AuditLogService.create_log(
        db=db,
        user_id=str(user.id),
        action="LOGIN",
        message=f"User {user.username} ({user.email}) logged in successfully.",
        ip_address=client_ip,
        user_agent=f"{info.get('os', '')} {info.get('browser', '')}".strip() or None
    )

    token_data = {"sub": str(user.id), "role": user.role_id}

    access_token = JWTService.create_access_token(
        data=token_data,
        secret_key=SECRET_KEY,
        algorithm=ALGORITHM,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    refresh_token = JWTService.create_refresh_token(
        data=token_data,
        secret_key=SECRET_KEY,
        algorithm=ALGORITHM,
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "info":          info,
    }


# ── Refresh ───────────────────────────────────────────────────────────────────

@auth_router.post("/refresh")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access token.
    The refresh token itself is NOT rotated — extend this if you want
    refresh token rotation (recommended for high-security apps).
    """
    try:
        token_data = JWTService.decode_token(
            token=payload.refresh_token,
            secret_key=SECRET_KEY,
            algorithm=ALGORITHM,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = token_data.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token payload")

    # Validate user still exists and is active
    user = UserService.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access_token = JWTService.create_access_token(
        data={"sub": str(user.id), "role": user.role_id},
        secret_key=SECRET_KEY,
        algorithm=ALGORITHM,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": new_access_token,
        "token_type":   "bearer",
    }


# ── Logout ────────────────────────────────────────────────────────────────────

@auth_router.post("/logout")
def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """
    Stateless logout — client must discard both tokens.
    To invalidate server-side, add the token to a Redis blocklist here:

        redis_client.setex(credentials.credentials, ACCESS_TOKEN_EXPIRE_MINUTES * 60, "blacklisted")
    """
    client_ip = DeviceTracker.get_client_ip(request)
    security_logger.info(f"User logged out from IP {client_ip}")
    return {"detail": "Logged out successfully"}