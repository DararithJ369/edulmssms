import hashlib
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from app.config.config import settings
from app.config.security import create_refresh_token, create_access_token
from app.models.refresh_token import RefreshToken
from app.models.user import User


class RefreshTokenService:
    """Production-grade refresh token rotation with reuse detection."""

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def _decode_unsafe(token: str) -> dict:
        """Decode a refresh token without verifying the signature/existence.

        Used only to read the jti before the token is validated against storage.
        """
        try:
            return jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False},
            )
        except jwt.JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            ) from e

    @staticmethod
    def create_token_record(
        db: Session,
        user: User,
        refresh_token: str,
        family_id: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> RefreshToken:
        """Persist a newly issued refresh token."""
        payload = RefreshTokenService._decode_unsafe(refresh_token)
        jti = payload.get("jti")
        if not jti:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Refresh token missing jti",
            )

        token_hash = RefreshTokenService._hash_token(refresh_token)
        expires_at = datetime.utcfromtimestamp(payload["exp"]).replace(tzinfo=timezone.utc)
        family_id = family_id or str(uuid4())

        record = RefreshToken(
            user_id=str(user.id),
            token_hash=token_hash,
            jti=jti,
            family_id=family_id,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def rotate(
        db: Session,
        old_refresh_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> dict:
        """Rotate a refresh token and return new access + refresh tokens.

        If the token has been revoked, reused, or does not exist, the entire
        token family is revoked and the request is rejected.
        """
        # Validate the incoming token cryptographically first
        try:
            payload = jwt.decode(
                old_refresh_token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except jwt.JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            ) from e

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        jti = payload.get("jti")
        if not jti:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed refresh token",
            )

        old_hash = RefreshTokenService._hash_token(old_refresh_token)
        old_record = (
            db.query(RefreshToken)
            .filter(RefreshToken.jti == jti, RefreshToken.token_hash == old_hash)
            .first()
        )

        if not old_record:
            # Reuse detection: a token was presented that we never issued or already replaced.
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not recognized",
            )

        if old_record.revoked or old_record.is_expired:
            # Potential reuse — revoke the whole family.
            RefreshTokenService._revoke_family(db, old_record.family_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked. Please log in again.",
            )

        # Issue new tokens
        user_id = payload.get("sub")
        access_token = create_access_token(subject=user_id)
        new_refresh_token, _ = create_refresh_token(subject=user_id)

        new_record = RefreshTokenService.create_token_record(
            db=db,
            user=User(id=user_id),
            refresh_token=new_refresh_token,
            family_id=old_record.family_id,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        # Mark old token as revoked and link it to the replacement
        old_record.revoked = True
        old_record.replaced_by = new_record.jti
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    def _revoke_family(db: Session, family_id: str) -> None:
        db.query(RefreshToken).filter(
            RefreshToken.family_id == family_id
        ).update({RefreshToken.revoked: True}, synchronize_session=False)
        db.commit()

    @staticmethod
    def revoke_all_for_user(db: Session, user_id: str) -> None:
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).update({RefreshToken.revoked: True}, synchronize_session=False)
        db.commit()

    @staticmethod
    def cleanup_expired(db: Session) -> int:
        now = datetime.now(timezone.utc)
        result = (
            db.query(RefreshToken)
            .filter(RefreshToken.expires_at < now)
            .delete(synchronize_session=False)
        )
        db.commit()
        return result
