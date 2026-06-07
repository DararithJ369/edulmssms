"""Tests for app.schemas.user — User-related Pydantic schemas."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.user import (
    DeviceInfo,
    LoginRequest,
    Token,
    UserBase,
    UserCreate,
    UserLogInResponse,
    UserSignup,
    UserUpdate,
)


class TestUserBase:
    def test_valid(self):
        obj = UserBase(email="a@b.com", username="alice", role_id=1)
        assert obj.is_active is True

    def test_invalid_email_raises(self):
        with pytest.raises(ValidationError):
            UserBase(email="not-an-email", username="x", role_id=1)

    def test_missing_username_raises(self):
        with pytest.raises(ValidationError):
            UserBase(email="a@b.com", role_id=1)  # type: ignore[call-arg]


class TestUserCreate:
    def test_includes_password(self):
        obj = UserCreate(email="a@b.com", username="bob", role_id=2, password="pw")
        assert obj.password == "pw"

    def test_missing_password_raises(self):
        with pytest.raises(ValidationError):
            UserCreate(email="a@b.com", username="bob", role_id=2)  # type: ignore[call-arg]


class TestUserSignup:
    def test_valid(self):
        obj = UserSignup(email="test@example.com", username="tester", password="pass123")
        assert obj.email == "test@example.com"

    def test_missing_email_raises(self):
        with pytest.raises(ValidationError):
            UserSignup(username="x", password="p")  # type: ignore[call-arg]


class TestUserUpdate:
    def test_all_optional(self):
        obj = UserUpdate()
        assert obj.email is None
        assert obj.username is None
        assert obj.password is None

    def test_partial(self):
        obj = UserUpdate(username="new_name")
        assert obj.username == "new_name"
        assert obj.email is None


class TestLoginRequest:
    def test_valid(self):
        obj = LoginRequest(email="a@b.com", password="secret")
        assert obj.password == "secret"

    def test_invalid_email_raises(self):
        with pytest.raises(ValidationError):
            LoginRequest(email="bad", password="pw")


class TestToken:
    def test_defaults(self):
        obj = Token(access_token="abc123")
        assert obj.token_type == "bearer"


class TestDeviceInfo:
    def test_all_optional(self):
        obj = DeviceInfo()
        assert obj.device is None

    def test_with_values(self):
        obj = DeviceInfo(device="iPhone", os="iOS", browser="Safari")
        assert obj.device == "iPhone"


class TestUserLogInResponse:
    def test_valid(self):
        obj = UserLogInResponse(
            access_token="tok",
            info=DeviceInfo(device="PC"),
        )
        assert obj.token_type == "bearer"
        assert obj.info.device == "PC"
