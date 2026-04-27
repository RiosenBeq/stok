"""Sales (POS cart) service.

Checkout is the single source of truth for "selling N menu items at once":
1. Validate every recipe line across every cart line — if any ingredient is
   short, raise *before* writing anything.
2. Append the OUT stock movements through the inventory service.
3. Persist the Sale + SaleItem rows referencing those movements.
The caller commits/rolls back; this function flushes but does not commit.
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.menu import MenuItem
from app.models.sale import Sale, SaleItem
from app.models.stock import MovementType, StockMovement
from app.services import inventory as inv


def _generate_code() -> str:
    """Sale code: SALE-YYYYMMDD-<4-hex>."""
    return f"SALE-{datetime.utcnow().strftime('%Y%m%d')}-{uuid4().hex[:4].upper()}"


def checkout(
    db: Session,
    *,
    warehouse_id: int,
    cart: list[tuple[MenuItem, int]],
    user_id: int | None = None,
    note: str | None = None,
) -> Sale:
    if not cart:
        raise ValueError("Sepet boş")

    # Aggregate ingredient demand across the cart so we validate the worst-case
    # combined need in one pass instead of line-by-line.
    demand: dict[int, float] = {}
    for menu_item, qty in cart:
        if not menu_item.is_active:
            raise ValueError(f"'{menu_item.name}' pasif")
        if not menu_item.recipe:
            raise ValueError(f"'{menu_item.name}' için reçete tanımlı değil")
        if qty <= 0:
            raise ValueError("Miktar > 0 olmalı")
        for line in menu_item.recipe:
            demand[line.product_id] = demand.get(line.product_id, 0.0) + float(line.quantity) * qty

    have = inv.on_hand_bulk(db, list(demand.keys()), warehouse_id)
    for pid, needed in demand.items():
        if have.get(pid, 0) < needed:
            raise inv.InsufficientStockError(
                f"Malzeme #{pid} yetersiz: gerek {needed:g}, mevcut {have.get(pid, 0)}"
            )

    code = _generate_code()
    total = 0.0
    cost_total = 0.0
    sale_items: list[SaleItem] = []
    movements: list[StockMovement] = []

    for menu_item, qty in cart:
        unit_price = float(menu_item.price)
        line_total = unit_price * qty
        total += line_total
        line_cost = (
            sum(float(line.quantity) * float(line.product.cost_price) for line in menu_item.recipe)
            * qty
        )
        cost_total += line_cost

        sale_items.append(
            SaleItem(
                menu_item_id=menu_item.id,
                quantity=qty,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

        for line in menu_item.recipe:
            units = int(round(float(line.quantity) * qty))
            if units <= 0:
                continue
            movements.append(
                inv.record_movement(
                    db,
                    product_id=line.product_id,
                    warehouse_id=warehouse_id,
                    movement_type=MovementType.OUT,
                    quantity=units,
                    reference=f"SALE:{code}",
                    note=f"{menu_item.name} ×{qty}",
                    user_id=user_id,
                )
            )

    sale = Sale(
        code=code,
        warehouse_id=warehouse_id,
        user_id=user_id,
        total=round(total, 2),
        cost=round(cost_total, 2),
        note=note,
        items=sale_items,
    )
    db.add(sale)
    db.flush()
    return sale
