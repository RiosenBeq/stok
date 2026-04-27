"""Audit log helper - never blocks the calling request on failure."""
import logging

from sqlalchemy.orm import Session

from app.models.audit import AuditLog

logger = logging.getLogger(__name__)


def record(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    entity: str,
    entity_id: str | int | None = None,
    detail: str | None = None,
    ip_address: str | None = None,
) -> None:
    try:
        db.add(
            AuditLog(
                user_id=user_id,
                action=action,
                entity=entity,
                entity_id=str(entity_id) if entity_id is not None else None,
                detail=detail,
                ip_address=ip_address,
            )
        )
        db.flush()
    except Exception:  # pragma: no cover - audit must never break a request
        logger.exception("Failed to write audit log")
