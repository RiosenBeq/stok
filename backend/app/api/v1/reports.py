"""Reporting & analytics endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_min_role
from app.models.product import Product
from app.models.stock import MovementType, StockMovement
from app.models.supplier import Supplier
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse
from app.schemas.reports import DashboardStats, TopProduct, ValuationRow
from app.services import inventory as inv

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> DashboardStats:
    products = list(db.execute(select(Product)).scalars())
    levels = inv.on_hand_bulk(db, [p.id for p in products])

    total_units = sum(levels.values())
    total_value = sum(float(p.cost_price) * levels.get(p.id, 0) for p in products)
    low_stock = sum(1 for p in products if levels.get(p.id, 0) <= p.low_stock_threshold and p.is_active)

    return DashboardStats(
        total_products=len(products),
        active_products=sum(1 for p in products if p.is_active),
        total_warehouses=db.execute(select(func.count()).select_from(Warehouse)).scalar_one(),
        total_suppliers=db.execute(select(func.count()).select_from(Supplier)).scalar_one(),
        low_stock_count=low_stock,
        total_stock_value=round(total_value, 2),
        total_units_on_hand=total_units,
    )


@router.get("/top-products", response_model=list[TopProduct])
def top_products(
    movement: MovementType = Query(default=MovementType.OUT),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[TopProduct]:
    """Highest-volume products by movement type. OUT = best sellers."""
    qty_expr = func.abs(func.sum(StockMovement.quantity))
    stmt = (
        select(Product.id, Product.sku, Product.name, qty_expr.label("units"))
        .join(StockMovement, StockMovement.product_id == Product.id)
        .where(StockMovement.type == movement)
        .group_by(Product.id, Product.sku, Product.name)
        .order_by(qty_expr.desc())
        .limit(limit)
    )
    return [
        TopProduct(product_id=pid, sku=sku, name=name, units_moved=int(units or 0))
        for pid, sku, name, units in db.execute(stmt)
    ]


@router.get("/valuation", response_model=list[ValuationRow])
def valuation(
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> list[ValuationRow]:
    products = list(db.execute(select(Product).where(Product.is_active.is_(True))).scalars())
    levels = inv.on_hand_bulk(db, [p.id for p in products])
    return [
        ValuationRow(
            product_id=p.id,
            sku=p.sku,
            name=p.name,
            on_hand=levels.get(p.id, 0),
            cost_price=float(p.cost_price),
            value=round(float(p.cost_price) * levels.get(p.id, 0), 2),
        )
        for p in products
    ]
