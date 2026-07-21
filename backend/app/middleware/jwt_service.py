"""
Deprecated JWTService wrapper.

All JWT logic is now centralized in app.config.security. This module remains
only for backward compatibility with any external imports and delegates every
call to the canonical implementation.
"""
import warnings
from datetime import timedelta

from app.config.security import (
    create_access_token as _create_access_token,
    create_refresh_token as _create_refresh_token,
    decode_token as _decode_token,
)


class JWTService:
    """Deprecated. Use app.config.security functions directly."""

    @staticmethod
    def create_access_token(
        data: dict,
        secret_key: str,  # noqa: ARG001
        algorithm: str,  # noqa: ARG001
        expires_delta: timedelta,
    ) -> str:
        warnings.warn(
            "JWTService is deprecated. Use app.config.security.create_access_token.",
            DeprecationWarning,
            stacklevel=2,
        )
        return _create_access_token(data.get("sub", ""), expires_delta=expires_delta)

    @staticmethod
    def create_refresh_token(
        data: dict,
        secret_key: str,  # noqa: ARG001
        algorithm: str,  # noqa: ARG001
        expires_delta: timedelta,
    ) -> str:
        warnings.warn(
            "JWTService is deprecated. Use app.config.security.create_refresh_token.",
            DeprecationWarning,
            stacklevel=2,
        )
        return _create_refresh_token(data.get("sub", ""))

    @staticmethod
    def decode_token(token: str, secret_key: str, algorithms: list) -> dict:  # noqa: ARG001
        warnings.warn(
            "JWTService is deprecated. Use app.config.security.decode_token.",
            DeprecationWarning,
            stacklevel=2,
        )
        return _decode_token(token)

    @staticmethod
    def verify_token(token: str, secret_key: str, algorithms: list):  # noqa: ARG001
        warnings.warn(
            "JWTService is deprecated. Use app.config.security.decode_token.",
            DeprecationWarning,
            stacklevel=2,
        )
        return _decode_token(token)