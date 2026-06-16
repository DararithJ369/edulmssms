"""Tests for app.middleware.jwt_service — JWTService."""

from datetime import timedelta

import pytest
from jose import JWTError

from app.middleware.jwt_service import JWTService

SECRET = "test-jwt-secret"
ALG = "HS256"


class TestCreateAccessToken:
    def test_returns_string(self):
        token = JWTService.create_access_token(
            data={"sub": "user-1"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(minutes=30),
        )
        assert isinstance(token, str)

    def test_token_contains_subject(self):
        token = JWTService.create_access_token(
            data={"sub": "user-42"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(minutes=30),
        )
        payload = JWTService.decode_token(token, SECRET, [ALG])
        assert payload["sub"] == "user-42"

    def test_token_has_expiry(self):
        token = JWTService.create_access_token(
            data={"sub": "u"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(minutes=5),
        )
        payload = JWTService.decode_token(token, SECRET, [ALG])
        assert "exp" in payload


class TestCreateRefreshToken:
    def test_returns_string(self):
        token = JWTService.create_refresh_token(
            data={"sub": "user-1"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(days=7),
        )
        assert isinstance(token, str)

    def test_token_round_trips(self):
        token = JWTService.create_refresh_token(
            data={"sub": "user-99", "role": "admin"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(days=7),
        )
        payload = JWTService.decode_token(token, SECRET, [ALG])
        assert payload["sub"] == "user-99"
        assert payload["role"] == "admin"


class TestDecodeToken:
    def test_valid_token_decodes(self):
        token = JWTService.create_access_token(
            data={"sub": "1"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(minutes=10),
        )
        payload = JWTService.decode_token(token, SECRET, [ALG])
        assert payload["sub"] == "1"

    def test_wrong_secret_raises(self):
        token = JWTService.create_access_token(
            data={"sub": "1"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(minutes=10),
        )
        with pytest.raises(JWTError):
            JWTService.decode_token(token, "wrong-secret", [ALG])

    def test_expired_token_raises(self):
        token = JWTService.create_access_token(
            data={"sub": "1"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(seconds=-1),
        )
        with pytest.raises(JWTError):
            JWTService.decode_token(token, SECRET, [ALG])

    def test_garbage_token_raises(self):
        with pytest.raises(JWTError):
            JWTService.decode_token("not.a.token", SECRET, [ALG])


class TestVerifyToken:
    def test_delegates_to_decode(self):
        token = JWTService.create_access_token(
            data={"sub": "x"},
            secret_key=SECRET,
            algorithm=ALG,
            expires_delta=timedelta(minutes=5),
        )
        payload = JWTService.verify_token(token, SECRET, [ALG])
        assert payload["sub"] == "x"
