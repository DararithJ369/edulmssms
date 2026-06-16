"""Tests for app.utils.argon2 — password hashing & verification."""

from app.utils.argon2 import hash_password, verify_password


class TestHashPassword:
    def test_returns_string(self):
        result = hash_password("my-secret")
        assert isinstance(result, str)

    def test_hash_is_not_plaintext(self):
        plain = "my-secret"
        hashed = hash_password(plain)
        assert hashed != plain

    def test_different_calls_produce_different_hashes(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # argon2 uses a random salt each time


class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        hashed = hash_password("correct-horse")
        assert verify_password(hashed, "correct-horse") is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("correct-horse")
        assert verify_password(hashed, "wrong-horse") is False

    def test_invalid_hash_returns_false(self):
        assert verify_password("not-a-real-hash", "anything") is False

    def test_empty_password_hashes_and_verifies(self):
        hashed = hash_password("")
        assert verify_password(hashed, "") is True
        assert verify_password(hashed, "non-empty") is False
