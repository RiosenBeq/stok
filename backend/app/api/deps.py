"""Shared FastAPI dependencies: DB session, current user, role guards."""
from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import SessionLocal
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token, expected_type="access")
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload")

    user = db.get(User, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User inactive or missing")
    return user


def require_role(*allowed: UserRole):
    """Dependency factory: ensure the current user holds at least one of the roles."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Bu işlem için {[r.value for r in allowed]} yetkisi gerekli",
            )
        return user

    return checker


def require_min_role(min_role: UserRole):
    """Allow this user if their rank >= min_role's rank."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role.rank < min_role.rank:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"En az {min_role.value} yetkisi gerekli",
            )
        return user

    return checker
