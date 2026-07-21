from datetime import datetime, timedelta
from typing import Any, Optional, Tuple, Union
from uuid import uuid4

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from passlib.context import CryptContext
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from sqlalchemy.orm import Session

from app.config.session import get_db
from app.config.config import settings
from app.models.user import User

# Legacy bcrypt context for backward compatibility with old hashes
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Argon2id hasher for all new hashes
argon2_hasher = PasswordHasher()

bearer_scheme = HTTPBearer(auto_error=False)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any]) -> Tuple[str, str]:
    """Create JWT refresh token with a unique jti and return (token, jti)."""
    jti = str(uuid4())
    expire = datetime.utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt, jti


def create_refresh_token_str(subject: Union[str, Any]) -> str:
    """Convenience helper that returns only the refresh token string."""
    token, _ = create_refresh_token(subject)
    return token

def decode_token(token: str, verify_type: Optional[str] = None) -> dict:
    """Decode a JWT token and optionally verify its type claim.

    Args:
        token: The JWT string to decode.
        verify_type: If provided, raise an error if the token's "type" claim
                     does not match (e.g., "refresh").

    Returns:
        The decoded token payload.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature or expired validation timeframe",
        ) from e

    if verify_type and payload.get("type") != verify_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token type: expected {verify_type}",
        )

    return payload

def get_password_hash(password: str) -> str:
    """Hash password using Argon2id."""
    return argon2_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash.

    Supports Argon2id (new) and bcrypt (legacy) hashes.
    """
    if not hashed_password:
        return False

    # Argon2id hashes start with "$argon2"
    if hashed_password.startswith("$argon2"):
        try:
            argon2_hasher.verify(hashed_password, plain_password)
            return True
        except (VerifyMismatchError, InvalidHashError):
            return False

    # Legacy bcrypt hashes start with "$2"
    if hashed_password.startswith("$2"):
        try:
            return bcrypt_context.verify(plain_password, hashed_password)
        except Exception:
            return False

    return False

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> User:
    """Decode JWT token and return the authenticated user."""
    token_str = None

    # Standard FastAPI Bearer scheme extraction
    if token:
        token_str = token.credentials
        
    # Manual backup verification of the Authorization Header
    if not token_str:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ")[1]

    # Read from URL query params fallback (?token=...)
    if not token_str:
        token_str = request.query_params.get("token")

    # Read directly from server-sent browser cookies
    if not token_str:
        token_str = request.cookies.get("access_token") or request.cookies.get("token")

    # If the token remains unlocated across all safe avenues, block right here
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated"
        )

    try:
        payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        
        # Only validate token type if the field exists within the payload claims matrix
        token_type = payload.get("type")
        if token_type and token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token type"
            )

        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token: missing user reference identity"
            )

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="User not found"
            )

        return user
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid token signature or expired validation timeframe"
        )