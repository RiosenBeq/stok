from fastapi.testclient import TestClient


def test_login_success(client: TestClient):
    r = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.example.com", "password": "adminpass123"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient):
    r = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.example.com", "password": "WRONG"},
    )
    assert r.status_code == 401


def test_me_requires_token(client: TestClient):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_me_with_token(client: TestClient, admin_token: str):
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "admin@test.example.com"


def test_refresh_flow(client: TestClient):
    r = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.example.com", "password": "adminpass123"},
    )
    refresh = r.json()["refresh_token"]
    r2 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r2.status_code == 200
    assert r2.json()["access_token"]


def test_refresh_rejects_access_token(client: TestClient, admin_token: str):
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": admin_token})
    assert r.status_code == 401
