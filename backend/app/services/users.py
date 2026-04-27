"""User authentication helpers."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserUpdate


def get_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_by_email(db, email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create(db: Session, payload: UserCreate) -> User:
    if get_by_email(db, payload.email):
        raise ValueError("E-posta zaten kullanılıyor")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def update(db: Session, user: User, payload: UserUpdate) -> User:
    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        user.hashed_password = hash_password(data.pop("password"))
    else:
        data.pop("password", None)
    for field, value in data.items():
        setattr(user, field, value)
    db.flush()
    return user


def ensure_can_promote(actor: User, target_role: UserRole) -> None:
    if actor.role != UserRole.ADMIN and target_role.rank >= actor.role.rank:
        raise PermissionError("Yetersiz yetki")
