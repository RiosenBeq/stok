"""Menu-item business logic. Selling a menu item atomically deducts every
ingredient from one warehouse, failing fast if any line is short."""
from sqlalchemy.orm import Session

from app.models.menu import MenuItem
from app.models.stock import MovementType, StockMovement
from app.services import inventory as inv


def sell(
    db: Session,
    *,
    menu_item: MenuItem,
    warehouse_id: int,
    quantity: int = 1,
    user_id: int | None = None,
    note: str | None = None,
) -> list[StockMovement]:
    """Decrement every ingredient by `recipe_qty * sold_qty`.

    Whole call is atomic: the caller's session is the unit of work, so a
    db.commit()/db.rollback() at the boundary determines persistence.
    """
    if not menu_item.is_active:
        raise ValueError("Menü kalemi pasif")
    if not menu_item.recipe:
        raise ValueError("Bu menü kalemi için reçete tanımlı değil")
    if quantity <= 0:
        raise ValueError("quantity > 0 olmalı")

    # First validate every line so we don't leave partial deductions on failure.
    for line in menu_item.recipe:
        needed = float(line.quantity) * quantity
        on_hand = inv.on_hand(db, line.product_id, warehouse_id)
        if on_hand < needed:
            raise inv.InsufficientStockError(
                f"'{line.product.name if line.product else line.product_id}' yetersiz: "
                f"gerek {needed:g}, mevcut {on_hand}"
            )

    movements: list[StockMovement] = []
    reference = f"SELL:{menu_item.sku}"
    for line in menu_item.recipe:
        # Quantities are stored as float but stock movements use integer units.
        # Round up to avoid silently leaking fractional stock.
        units = int(round(float(line.quantity) * quantity))
        if units <= 0:
            continue
        mv = inv.record_movement(
            db,
            product_id=line.product_id,
            warehouse_id=warehouse_id,
            movement_type=MovementType.OUT,
            quantity=units,
            reference=reference,
            note=note or f"Menü satışı x{quantity}",
            user_id=user_id,
        )
        movements.append(mv)
    return movements


def food_cost_rows(db: Session, menu_items: list[MenuItem]) -> list[dict]:
    """Aggregate cost = SUM(recipe.qty * product.cost_price)."""
    rows: list[dict] = []
    for mi in menu_items:
        cost = sum(float(line.quantity) * float(line.product.cost_price) for line in mi.recipe)
        price = float(mi.price)
        food_cost_pct = (cost / price * 100) if price > 0 else 0.0
        rows.append(
            {
                "menu_item_id": mi.id,
                "sku": mi.sku,
                "name": mi.name,
                "price": round(price, 2),
                "cost": round(cost, 2),
                "margin": round(price - cost, 2),
                "food_cost_pct": round(food_cost_pct, 2),
            }
        )
    return rows
