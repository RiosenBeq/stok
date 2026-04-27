"""POS sales: cart checkout + history."""
from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_min_role
from app.models.menu import MenuItem
from app.models.sale import Sale, SaleItem
from app.models.stock import StockMovement
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse
from app.schemas.sales import (
    CartCheckoutIn,
    DailySnapshot,
    SaleItemOut,
    SaleOut,
    TrendPoint,
)
from app.services import inventory as inv
from app.services import sales as sales_service

router = APIRouter()


def _serialize(sale: Sale) -> SaleOut:
    return SaleOut(
        id=sale.id,
        code=sale.code,
        warehouse_id=sale.warehouse_id,
        user_id=sale.user_id,
        total=float(sale.total),
        cost=float(sale.cost),
        note=sale.note,
        created_at=sale.created_at,
        warehouse_code=sale.warehouse.code if sale.warehouse else None,
        items=[
            SaleItemOut(
                id=it.id,
                menu_item_id=it.menu_item_id,
                quantity=it.quantity,
                unit_price=float(it.unit_price),
                line_total=float(it.line_total),
                menu_item_name=it.menu_item.name if it.menu_item else None,
                menu_item_sku=it.menu_item.sku if it.menu_item else None,
            )
            for it in sale.items
        ],
    )


@router.post("/checkout", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CartCheckoutIn,
    db: Session = Depends(get_db),
    actor: User = Depends(require_min_role(UserRole.STAFF)),
) -> SaleOut:
    # Resolve menu items in one query so we can fail fast on bad IDs.
    ids = [line.menu_item_id for line in payload.items]
    rows = list(db.execute(select(MenuItem).where(MenuItem.id.in_(ids))).scalars())
    by_id = {mi.id: mi for mi in rows}
    cart: list[tuple[MenuItem, int]] = []
    for line in payload.items:
        mi = by_id.get(line.menu_item_id)
        if not mi:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Menü kalemi {line.menu_item_id} yok")
        cart.append((mi, line.quantity))

    try:
        sale = sales_service.checkout(
            db,
            warehouse_id=payload.warehouse_id,
            cart=cart,
            user_id=actor.id,
            note=payload.note,
        )
        db.commit()
        db.refresh(sale)
        return _serialize(sale)
    except inv.InsufficientStockError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.get("/", response_model=list[SaleOut])
def list_sales(
    warehouse_id: int | None = None,
    since: date | None = None,
    until: date | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[SaleOut]:
    stmt = select(Sale).order_by(Sale.id.desc())
    if warehouse_id is not None:
        stmt = stmt.where(Sale.warehouse_id == warehouse_id)
    if since:
        stmt = stmt.where(Sale.created_at >= datetime.combine(since, datetime.min.time()))
    if until:
        stmt = stmt.where(Sale.created_at <= datetime.combine(until, datetime.max.time()))
    stmt = stmt.limit(limit).offset(offset)
    return [_serialize(s) for s in db.execute(stmt).scalars()]


@router.get("/daily", response_model=list[DailySnapshot])
def daily_snapshot(
    on: date | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[DailySnapshot]:
    """Today's KPIs per branch (revenue, cost, units, waste)."""
    target = on or datetime.now(UTC).date()
    start = datetime.combine(target, datetime.min.time())
    end = datetime.combine(target, datetime.max.time())

    sales_stmt = (
        select(
            Sale.warehouse_id,
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.total), 0),
            func.coalesce(func.sum(Sale.cost), 0),
        )
        .where(Sale.created_at.between(start, end))
        .group_by(Sale.warehouse_id)
    )
    sales_by_wh = {
        row[0]: (int(row[1]), float(row[2]), float(row[3]))
        for row in db.execute(sales_stmt)
    }

    units_stmt = (
        select(Sale.warehouse_id, func.coalesce(func.sum(SaleItem.quantity), 0))
        .join(SaleItem, SaleItem.sale_id == Sale.id)
        .where(Sale.created_at.between(start, end))
        .group_by(Sale.warehouse_id)
    )
    units_by_wh = {row[0]: int(row[1]) for row in db.execute(units_stmt)}

    # Waste totals: OUT movements with reference WASTE today, multiplied by product cost.
    from app.models.product import Product

    waste_stmt = (
        select(
            StockMovement.warehouse_id,
            func.coalesce(func.sum(func.abs(StockMovement.quantity)), 0),
            func.coalesce(
                func.sum(func.abs(StockMovement.quantity) * Product.cost_price), 0
            ),
        )
        .join(Product, Product.id == StockMovement.product_id)
        .where(StockMovement.reference == "WASTE")
        .where(StockMovement.created_at.between(start, end))
        .group_by(StockMovement.warehouse_id)
    )
    waste_by_wh = {
        row[0]: (int(row[1]), float(row[2])) for row in db.execute(waste_stmt)
    }

    warehouses = list(db.execute(select(Warehouse)).scalars())
    out: list[DailySnapshot] = []
    for wh in warehouses:
        sc, rev, cost = sales_by_wh.get(wh.id, (0, 0.0, 0.0))
        wu, wv = waste_by_wh.get(wh.id, (0, 0.0))
        out.append(
            DailySnapshot(
                warehouse_id=wh.id,
                warehouse_code=wh.code,
                sales_count=sc,
                units_sold=units_by_wh.get(wh.id, 0),
                revenue=round(rev, 2),
                cost=round(cost, 2),
                margin=round(rev - cost, 2),
                waste_units=wu,
                waste_value=round(wv, 2),
            )
        )
    return out


@router.get("/trend", response_model=list[TrendPoint])
def revenue_trend(
    days: int = Query(default=30, ge=1, le=120),
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[TrendPoint]:
    """Daily revenue + sales count for the last N days. Includes zero-buckets."""
    end_date = datetime.now(UTC).date()
    start_date = end_date - timedelta(days=days - 1)
    start = datetime.combine(start_date, datetime.min.time())

    rows = db.execute(
        select(
            func.date(Sale.created_at).label("d"),
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.total), 0),
        )
        .where(Sale.created_at >= start)
        .group_by(func.date(Sale.created_at))
    ).all()
    by_date = {str(r[0]): (int(r[1]), float(r[2])) for r in rows}

    out: list[TrendPoint] = []
    for i in range(days):
        d = (start_date + timedelta(days=i)).isoformat()
        sc, rev = by_date.get(d, (0, 0.0))
        out.append(TrendPoint(date=d, revenue=round(rev, 2), sales=sc))
    return out
