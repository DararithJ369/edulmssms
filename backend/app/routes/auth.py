import os
import time
import secrets
from collections import defaultdict
from datetime import timedelta, datetime, timezone
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
from pydantic import BaseModel, EmailStr
from app.models.user import User
from app.utils.email import send_password_reset_email
from app.utils.argon2 import hash_password

# Simple in-memory rate limiter for login endpoint
_login_attempts: dict[str, list[float]] = defaultdict(list)
_LOGIN_RATE_LIMIT = 5  # max attempts
_LOGIN_RATE_WINDOW = 60  # per 60 seconds
_login_count = 0


def _check_login_rate_limit(request: Request) -> None:
    global _login_count
    client_ip = DeviceTracker.get_client_ip(request)
    now = time.time()
    
    attempts = _login_attempts.get(client_ip, [])
    active_attempts = [t for t in attempts if now - t < _LOGIN_RATE_WINDOW]
    
    if len(active_attempts) >= _LOGIN_RATE_LIMIT:
        _login_attempts[client_ip] = active_attempts
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Try again in {_LOGIN_RATE_WINDOW} seconds.",
        )
        
    active_attempts.append(now)
    _login_attempts[client_ip] = active_attempts
    
    _login_count += 1
    if _login_count % 100 == 0:
        expired_ips = []
        for ip, ts_list in list(_login_attempts.items()):
            valid_ts = [t for t in ts_list if now - t < _LOGIN_RATE_WINDOW]
            if not valid_ts:
                expired_ips.append(ip)
            else:
                _login_attempts[ip] = valid_ts
        for ip in expired_ips:
            if ip in _login_attempts:
                del _login_attempts[ip]

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
    _check_login_rate_limit(request)
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


# ── Password Reset Flow ───────────────────────────────────────────────────────

class ForgotPasswordPayload(BaseModel):
    email: EmailStr

class VerifyResetCodePayload(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordPayload(BaseModel):
    email: EmailStr
    code: str
    password: str

@auth_router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    # Generate 6-digit secure code
    otp = "".join(secrets.choice("0123456789") for _ in range(6))
    
    # Set reset code and expiration (15 minutes from now)
    user.reset_code = otp
    user.reset_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()
    
    try:
        await send_password_reset_email(user.email, otp)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send password reset email: {str(e)}"
        )
        
    return {"message": "Password reset code sent to email"}

@auth_router.post("/verify-reset-code")
def verify_reset_code(payload: VerifyResetCodePayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.reset_code or user.reset_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
        
    if not user.reset_code_expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired")
        
    # Ensure timezone aware comparison
    expires_at = user.reset_code_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired")
        
    return {"message": "Reset code verified successfully"}

@auth_router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.reset_code or user.reset_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
        
    if not user.reset_code_expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired")
        
    expires_at = user.reset_code_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired")
        
    # Invalidate code and update password
    user.hashed_password = hash_password(payload.password)
    user.reset_code = None
    user.reset_code_expires_at = None
    db.commit()
    
    return {"message": "Password has been reset successfully"}