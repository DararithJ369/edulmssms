"""Tests for app.config.security — token creation and password hashing."""

from datetime import timedelta

from jose import jwt

from app.config.config import settings
from app.config.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)


class TestCreateAccessToken:
    def test_returns_jwt_string(self):
        token = create_access_token(subject="user-1")
        assert isinstance(token, str)
        parts = token.split(".")
        assert len(parts) == 3  # header.payload.signature

    def test_payload_contains_subject(self):
        token = create_access_token(subject="user-42")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert payload["sub"] == "user-42"

    def test_payload_type_is_access(self):
        token = create_access_token(subject="u")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert payload["type"] == "access"

    def test_custom_expiry_delta(self):
        token = create_access_token(subject="u", expires_delta=timedelta(minutes=1))
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert "exp" in payload

    def test_default_expiry(self):
        token = create_access_token(subject="u")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert "exp" in payload


class TestCreateRefreshToken:
    def test_returns_jwt_string(self):
        token = create_refresh_token(subject="user-1")
        assert isinstance(token, str)

    def test_payload_type_is_refresh(self):
        token = create_refresh_token(subject="u")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert payload["type"] == "refresh"

    def test_payload_contains_subject(self):
        token = create_refresh_token(subject="u-99")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert payload["sub"] == "u-99"


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        hashed = get_password_hash("secret")
        assert hashed != "secret"

    def test_verify_correct_password(self):
        hashed = get_password_hash("my-password")
        assert verify_password("my-password", hashed) is True

    def test_verify_wrong_password(self):
        hashed = get_password_hash("my-password")
        assert verify_password("wrong", hashed) is False

    def test_different_hashes_for_same_input(self):
        h1 = get_password_hash("same")
        h2 = get_password_hash("same")
        assert h1 != h2  # bcrypt uses random salt
