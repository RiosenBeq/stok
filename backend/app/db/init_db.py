"""Database bootstrap: create tables and seed the first superuser/warehouse."""
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse

# Import all model modules so the metadata is fully populated
from app import models  # noqa: F401

logger = logging.getLogger(__name__)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        _seed_superuser(db)
        _seed_default_warehouse(db)
        db.commit()


def _seed_superuser(db: Session) -> None:
    existing = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    if existing:
        return
    user = User(
        email=settings.FIRST_SUPERUSER_EMAIL,
        full_name=settings.FIRST_SUPERUSER_FULL_NAME,
        hashed_password=hash_password(settings.FIRST_SUPERUSER_PASSWORD),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    logger.info("Seeded superuser %s", settings.FIRST_SUPERUSER_EMAIL)


def _seed_default_warehouse(db: Session) -> None:
    if db.query(Warehouse).first():
        return
    db.add(
        Warehouse(
            code="MAIN",
            name="Ana Depo",
            location="Merkez",
            is_active=True,
        )
    )
    logger.info("Seeded default warehouse MAIN")
