import secrets
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.services.user_service import UserService
from app.config.session import get_db
from app.schemas.user import LoginRequest, Token
from app.config.logger import security_logger
from app.utils.device_tracker import DeviceTracker
from app.services.audit_log_service import AuditLogService
from pydantic import BaseModel, EmailStr
from app.models.user import User
from app.utils.email import send_password_reset_email
from app.config.security import get_password_hash, create_access_token, create_refresh_token, get_current_user
from app.services.refresh_token_service import RefreshTokenService
from app.utils.rate_limiter import check_rate_limit

_LOGIN_RATE_LIMIT = 5  # max attempts
_LOGIN_RATE_WINDOW = 60  # per 60 seconds

_RESET_RATE_LIMIT = 3  # max attempts per window
_RESET_RATE_WINDOW = 300  # per 5 minutes


def _check_login_rate_limit(request: Request) -> None:
    client_ip = DeviceTracker.get_client_ip(request)
    if not check_rate_limit(client_ip, _LOGIN_RATE_LIMIT, _LOGIN_RATE_WINDOW):
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Try again in {_LOGIN_RATE_WINDOW} seconds.",
        )


def _check_reset_rate_limit(request: Request) -> None:
    client_ip = DeviceTracker.get_client_ip(request)
    if not check_rate_limit(client_ip, _RESET_RATE_LIMIT, _RESET_RATE_WINDOW):
        raise HTTPException(
            status_code=429,
            detail=f"Too many password reset attempts. Try again in {_RESET_RATE_WINDOW} seconds.",
        )

load_dotenv()

# JWT configuration is centralized in app.config.security

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
    try:
        user = UserService.login(db, data)
    except HTTPException as exc:
        if exc.status_code == 400:
            raise HTTPException(status_code=401, detail="Invalid email or password") from exc
        raise
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

    access_token = create_access_token(subject=str(user.id))
    refresh_token, _ = create_refresh_token(subject=str(user.id))
    RefreshTokenService.create_token_record(
        db=db,
        user=user,
        refresh_token=refresh_token,
        user_agent=f"{info.get('os', '')} {info.get('browser', '')}".strip() or None,
        ip_address=client_ip,
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
    Exchange a valid refresh token for a new access/refresh token pair.
    Rotates the refresh token and invalidates the previous one.
    """
    return RefreshTokenService.rotate(db, payload.refresh_token)


# ── Logout ────────────────────────────────────────────────────────────────────

@auth_router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Revoke all refresh tokens for the user on logout.
    Client must still discard the access token.
    """
    RefreshTokenService.revoke_all_for_user(db, str(current_user.id))
    client_ip = DeviceTracker.get_client_ip(request)
    security_logger.info(f"User {current_user.email} logged out from IP {client_ip}")
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
async def forgot_password(
    payload: ForgotPasswordPayload,
    request: Request,
    db: Session = Depends(get_db),
):
    _check_reset_rate_limit(request)
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
    user.hashed_password = get_password_hash(payload.password)
    user.reset_code = None
    user.reset_code_expires_at = None
    db.commit()
    
    return {"message": "Password has been reset successfully"}