"""Core inventory math: deriving on-hand levels from the movement ledger."""
from collections.abc import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock import MovementType, StockMovement
from app.models.warehouse import Warehouse


class InsufficientStockError(ValueError):
    """Raised when an OUT/TRANSFER would drive on-hand negative."""


def on_hand(db: Session, product_id: int, warehouse_id: int | None = None) -> int:
    stmt = select(func.coalesce(func.sum(StockMovement.quantity), 0)).where(
        StockMovement.product_id == product_id
    )
    if warehouse_id is not None:
        stmt = stmt.where(StockMovement.warehouse_id == warehouse_id)
    return int(db.execute(stmt).scalar_one())


def on_hand_bulk(
    db: Session, product_ids: Iterable[int], warehouse_id: int | None = None
) -> dict[int, int]:
    ids = list(product_ids)
    if not ids:
        return {}
    stmt = (
        select(StockMovement.product_id, func.coalesce(func.sum(StockMovement.quantity), 0))
        .where(StockMovement.product_id.in_(ids))
        .group_by(StockMovement.product_id)
    )
    if warehouse_id is not None:
        stmt = stmt.where(StockMovement.warehouse_id == warehouse_id)
    result = {pid: 0 for pid in ids}
    for pid, qty in db.execute(stmt):
        result[pid] = int(qty)
    return result


def record_movement(
    db: Session,
    *,
    product_id: int,
    warehouse_id: int,
    movement_type: MovementType,
    quantity: int,
    unit_cost: float | None = None,
    reference: str | None = None,
    note: str | None = None,
    user_id: int | None = None,
    allow_negative: bool = False,
) -> StockMovement:
    """Append a movement to the ledger.

    `quantity` is always provided positive by the caller; the ledger entry's sign
    is derived from `movement_type`. ADJUSTMENT preserves the caller's sign by
    accepting it through `quantity` (callers wanting a decrease pass a negative
    via `record_signed_movement` instead).
    """
    if quantity <= 0:
        raise ValueError("quantity must be positive; sign is derived from type")

    if movement_type == MovementType.IN:
        signed = quantity
    elif movement_type == MovementType.OUT:
        signed = -quantity
    else:  # TRANSFER / ADJUSTMENT - callers should use the dedicated helpers
        raise ValueError(f"Use the dedicated helper for {movement_type}")

    return _append(
        db,
        product_id=product_id,
        warehouse_id=warehouse_id,
        movement_type=movement_type,
        signed_quantity=signed,
        unit_cost=unit_cost,
        reference=reference,
        note=note,
        user_id=user_id,
        allow_negative=allow_negative,
    )


def transfer(
    db: Session,
    *,
    product_id: int,
    from_warehouse_id: int,
    to_warehouse_id: int,
    quantity: int,
    user_id: int | None = None,
    note: str | None = None,
) -> tuple[StockMovement, StockMovement]:
    if from_warehouse_id == to_warehouse_id:
        raise ValueError("Source and destination warehouses must differ")
    if quantity <= 0:
        raise ValueError("quantity must be positive")

    out_mv = _append(
        db,
        product_id=product_id,
        warehouse_id=from_warehouse_id,
        movement_type=MovementType.TRANSFER,
        signed_quantity=-quantity,
        reference=f"TRANSFER->{to_warehouse_id}",
        note=note,
        user_id=user_id,
        allow_negative=False,
    )
    in_mv = _append(
        db,
        product_id=product_id,
        warehouse_id=to_warehouse_id,
        movement_type=MovementType.TRANSFER,
        signed_quantity=quantity,
        reference=f"TRANSFER<-{from_warehouse_id}",
        note=note,
        user_id=user_id,
        allow_negative=True,
    )
    return out_mv, in_mv


def adjust_to(
    db: Session,
    *,
    product_id: int,
    warehouse_id: int,
    new_quantity: int,
    user_id: int | None = None,
    note: str | None = None,
) -> StockMovement | None:
    """Set on-hand to `new_quantity` by writing a signed delta. No-op if already matching."""
    if new_quantity < 0:
        raise ValueError("new_quantity must be >= 0")
    current = on_hand(db, product_id, warehouse_id)
    delta = new_quantity - current
    if delta == 0:
        return None
    return _append(
        db,
        product_id=product_id,
        warehouse_id=warehouse_id,
        movement_type=MovementType.ADJUSTMENT,
        signed_quantity=delta,
        reference="ADJUST",
        note=note,
        user_id=user_id,
        allow_negative=True,
    )


def low_stock_products(db: Session, warehouse_id: int | None = None) -> list[tuple[Product, int]]:
    products = db.execute(select(Product).where(Product.is_active.is_(True))).scalars().all()
    levels = on_hand_bulk(db, [p.id for p in products], warehouse_id)
    return [(p, levels[p.id]) for p in products if levels[p.id] <= p.low_stock_threshold]


def _append(
    db: Session,
    *,
    product_id: int,
    warehouse_id: int,
    movement_type: MovementType,
    signed_quantity: int,
    unit_cost: float | None = None,
    reference: str | None = None,
    note: str | None = None,
    user_id: int | None = None,
    allow_negative: bool,
) -> StockMovement:
    if not allow_negative and signed_quantity < 0:
        current = on_hand(db, product_id, warehouse_id)
        if current + signed_quantity < 0:
            raise InsufficientStockError(
                f"Insufficient stock: have {current}, need {-signed_quantity}"
            )
    # Ensure warehouse exists - cheap guard against orphan rows in SQLite
    if not db.get(Warehouse, warehouse_id):
        raise ValueError(f"Warehouse {warehouse_id} does not exist")
    if not db.get(Product, product_id):
        raise ValueError(f"Product {product_id} does not exist")

    mv = StockMovement(
        product_id=product_id,
        warehouse_id=warehouse_id,
        type=movement_type,
        quantity=signed_quantity,
        unit_cost=unit_cost,
        reference=reference,
        note=note,
        user_id=user_id,
    )
    db.add(mv)
    db.flush()
    return mv
