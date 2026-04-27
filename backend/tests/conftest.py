"""Pytest fixtures: in-memory DB and authenticated TestClient."""
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.security import hash_password
from app.db.session import Base
from app.main import app
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse


@pytest.fixture()
def db_session() -> Generator:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db = SessionLocal()

    # Seed an admin and a warehouse so tests don't repeat boilerplate
    admin = User(
        email="admin@test.example.com",
        full_name="Admin",
        hashed_password=hash_password("adminpass123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    staff = User(
        email="staff@test.example.com",
        full_name="Staff",
        hashed_password=hash_password("staffpass123"),
        role=UserRole.STAFF,
        is_active=True,
    )
    db.add_all([admin, staff, Warehouse(code="MAIN", name="Ana Depo")])
    db.commit()

    yield db
    db.close()
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session) -> Generator[TestClient, None, None]:
    def _override_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_db
    # No `with` - we don't want the production lifespan (which seeds the file DB)
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_token(client: TestClient) -> str:
    r = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.example.com", "password": "adminpass123"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture()
def staff_token(client: TestClient) -> str:
    r = client.post(
        "/api/v1/auth/login",
        data={"username": "staff@test.example.com", "password": "staffpass123"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture()
def auth_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}
