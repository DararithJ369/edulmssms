import uuid

from fastapi.testclient import TestClient

from app.models.role import Role
from app.models.user import User
from app.config.security import get_password_hash, verify_password


def test_password_hashing_roundtrip():
    hashed = get_password_hash("securepassword123")
    assert verify_password("securepassword123", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_login_success(client: TestClient, db, admin_role):
    user = User(
        id=str(uuid.uuid4()),
        email="teacher@example.com",
        username="teacher_test",
        hashed_password=get_password_hash("password123"),
        role_id=admin_role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/login",
        json={"email": user.email, "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_failure(client: TestClient, db, admin_role):
    user = User(
        id=str(uuid.uuid4()),
        email="student@example.com",
        username="student_test",
        hashed_password=get_password_hash("password123"),
        role_id=admin_role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/login",
        json={"email": user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_refresh_token_rotation(client: TestClient, db, admin_role):
    user = User(
        id=str(uuid.uuid4()),
        email="rotate@example.com",
        username="rotate_test",
        hashed_password=get_password_hash("password123"),
        role_id=admin_role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()

    login = client.post(
        "/api/v1/login",
        json={"email": user.email, "password": "password123"},
    ).json()
    refresh_token = login["refresh_token"]

    # First refresh should work and return a new refresh token
    refresh1 = client.post("/api/v1/refresh", json={"refresh_token": refresh_token}).json()
    assert "access_token" in refresh1
    assert "refresh_token" in refresh1
    new_refresh_token = refresh1["refresh_token"]
    assert new_refresh_token != refresh_token

    # Reusing the old refresh token should be rejected
    reuse = client.post("/api/v1/refresh", json={"refresh_token": refresh_token})
    assert reuse.status_code == 401

    # Reusing the old token revokes the entire family; the new token is also invalid
    refresh2 = client.post("/api/v1/refresh", json={"refresh_token": new_refresh_token})
    assert refresh2.status_code == 401


def test_health(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_health_db(client: TestClient):
    response = client.get("/health/db")
    assert response.status_code == 200
    assert response.json()["database"] == "connected"


def test_protected_endpoint_requires_auth(client: TestClient):
    response = client.get("/api/v1/courses")
    assert response.status_code == 401
