"""Stock movements: in, out, transfer, adjustment + level views."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_min_role
from app.models.product import Product
from app.models.stock import MovementType, StockMovement
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse
from app.schemas.inventory import (
    AdjustmentCreate,
    StockLevel,
    StockMovementCreate,
    StockMovementOut,
    StockTransfer,
)
from app.services import inventory as inv

router = APIRouter()


@router.get("/movements", response_model=list[StockMovementOut])
def list_movements(
    product_id: int | None = None,
    warehouse_id: int | None = None,
    type: MovementType | None = None,  # noqa: A002 - matches API surface
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[StockMovement]:
    stmt = select(StockMovement)
    if product_id is not None:
        stmt = stmt.where(StockMovement.product_id == product_id)
    if warehouse_id is not None:
        stmt = stmt.where(StockMovement.warehouse_id == warehouse_id)
    if type is not None:
        stmt = stmt.where(StockMovement.type == type)
    stmt = stmt.order_by(StockMovement.id.desc()).limit(limit).offset(offset)
    return list(db.execute(stmt).scalars())


@router.post("/movements", response_model=StockMovementOut, status_code=status.HTTP_201_CREATED)
def create_movement(
    payload: StockMovementCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_min_role(UserRole.STAFF)),
) -> StockMovement:
    if payload.type not in (MovementType.IN, MovementType.OUT):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Transfer/adjustment için ilgili özel uçları kullanın",
        )
    try:
        mv = inv.record_movement(
            db,
            product_id=payload.product_id,
            warehouse_id=payload.warehouse_id,
            movement_type=payload.type,
            quantity=payload.quantity,
            unit_cost=payload.unit_cost,
            reference=payload.reference,
            note=payload.note,
            user_id=actor.id,
        )
        db.commit()
        return mv
    except inv.InsufficientStockError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.post("/transfer", response_model=list[StockMovementOut], status_code=status.HTTP_201_CREATED)
def transfer(
    payload: StockTransfer,
    db: Session = Depends(get_db),
    actor: User = Depends(require_min_role(UserRole.STAFF)),
) -> list[StockMovement]:
    try:
        out_mv, in_mv = inv.transfer(
            db,
            product_id=payload.product_id,
            from_warehouse_id=payload.from_warehouse_id,
            to_warehouse_id=payload.to_warehouse_id,
            quantity=payload.quantity,
            user_id=actor.id,
            note=payload.note,
        )
        db.commit()
        return [out_mv, in_mv]
    except inv.InsufficientStockError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.post("/adjust", response_model=StockMovementOut | None)
def adjust(
    payload: AdjustmentCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_min_role(UserRole.MANAGER)),
) -> StockMovement | None:
    try:
        mv = inv.adjust_to(
            db,
            product_id=payload.product_id,
            warehouse_id=payload.warehouse_id,
            new_quantity=payload.new_quantity,
            user_id=actor.id,
            note=payload.note,
        )
        db.commit()
        return mv
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.get("/levels", response_model=list[StockLevel])
def levels(
    warehouse_id: int | None = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[StockLevel]:
    products = db.execute(select(Product).where(Product.is_active.is_(True))).scalars().all()
    warehouses = {w.id: w for w in db.execute(select(Warehouse)).scalars()}

    levels_by_product = inv.on_hand_bulk(db, [p.id for p in products], warehouse_id)
    out: list[StockLevel] = []
    for p in products:
        if warehouse_id is not None:
            wh = warehouses.get(warehouse_id)
            if not wh:
                continue
            on_hand = levels_by_product.get(p.id, 0)
            if low_stock_only and on_hand > p.low_stock_threshold:
                continue
            out.append(
                StockLevel(
                    product_id=p.id,
                    product_name=p.name,
                    sku=p.sku,
                    warehouse_id=wh.id,
                    warehouse_code=wh.code,
                    on_hand=on_hand,
                    low_stock_threshold=p.low_stock_threshold,
                    is_low_stock=on_hand <= p.low_stock_threshold,
                )
            )
        else:
            on_hand = levels_by_product.get(p.id, 0)
            if low_stock_only and on_hand > p.low_stock_threshold:
                continue
            out.append(
                StockLevel(
                    product_id=p.id,
                    product_name=p.name,
                    sku=p.sku,
                    warehouse_id=0,
                    warehouse_code="ALL",
                    on_hand=on_hand,
                    low_stock_threshold=p.low_stock_threshold,
                    is_low_stock=on_hand <= p.low_stock_threshold,
                )
            )
    return out
