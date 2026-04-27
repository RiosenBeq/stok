"""Menu items + recipe + quick-sell endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_min_role
from app.models.menu import MenuItem, RecipeItem
from app.models.stock import StockMovement
from app.models.user import User, UserRole
from app.schemas.inventory import StockMovementOut
from app.schemas.menu import (
    FoodCostRow,
    MenuItemCreate,
    MenuItemOut,
    MenuItemUpdate,
    RecipeItemOut,
    SellRequest,
)
from app.services import inventory as inv
from app.services import menu as menu_service

router = APIRouter()


def _serialize(mi: MenuItem) -> MenuItemOut:
    """Build the response model with recipe lines enriched by product info."""
    return MenuItemOut(
        id=mi.id,
        sku=mi.sku,
        name=mi.name,
        description=mi.description,
        price=float(mi.price),
        is_active=mi.is_active,
        recipe=[
            RecipeItemOut(
                id=line.id,
                product_id=line.product_id,
                quantity=float(line.quantity),
                product_sku=line.product.sku if line.product else None,
                product_name=line.product.name if line.product else None,
            )
            for line in mi.recipe
        ],
    )


@router.get("/", response_model=list[MenuItemOut])
def list_menu_items(
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> list[MenuItemOut]:
    items = list(db.execute(select(MenuItem).order_by(MenuItem.name)).scalars())
    return [_serialize(mi) for mi in items]


@router.post("/", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> MenuItemOut:
    if db.execute(select(MenuItem).where(MenuItem.sku == payload.sku)).scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "SKU zaten kullanımda")
    mi = MenuItem(
        sku=payload.sku,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        is_active=payload.is_active,
        recipe=[RecipeItem(**line.model_dump()) for line in payload.recipe],
    )
    db.add(mi)
    db.commit()
    db.refresh(mi)
    return _serialize(mi)


@router.get("/{menu_item_id}", response_model=MenuItemOut)
def get_menu_item(
    menu_item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.VIEWER)),
) -> MenuItemOut:
    mi = db.get(MenuItem, menu_item_id)
    if not mi:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menü kalemi bulunamadı")
    return _serialize(mi)


@router.patch("/{menu_item_id}", response_model=MenuItemOut)
def update_menu_item(
    menu_item_id: int,
    payload: MenuItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> MenuItemOut:
    mi = db.get(MenuItem, menu_item_id)
    if not mi:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menü kalemi bulunamadı")
    data = payload.model_dump(exclude_unset=True)
    new_recipe = data.pop("recipe", None)
    for field, value in data.items():
        setattr(mi, field, value)
    if new_recipe is not None:
        mi.recipe.clear()
        db.flush()
        for line in new_recipe:
            mi.recipe.append(RecipeItem(**line))
    db.commit()
    db.refresh(mi)
    return _serialize(mi)


@router.delete("/{menu_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    menu_item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> None:
    mi = db.get(MenuItem, menu_item_id)
    if not mi:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menü kalemi bulunamadı")
    mi.is_active = False
    db.commit()


@router.post("/{menu_item_id}/sell", response_model=list[StockMovementOut])
def sell_menu_item(
    menu_item_id: int,
    payload: SellRequest,
    db: Session = Depends(get_db),
    actor: User = Depends(require_min_role(UserRole.STAFF)),
) -> list[StockMovement]:
    mi = db.get(MenuItem, menu_item_id)
    if not mi:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menü kalemi bulunamadı")
    try:
        movements = menu_service.sell(
            db,
            menu_item=mi,
            warehouse_id=payload.warehouse_id,
            quantity=payload.quantity,
            user_id=actor.id,
            note=payload.note,
        )
        db.commit()
        return movements
    except inv.InsufficientStockError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.get("/-/food-cost", response_model=list[FoodCostRow])
def food_cost(
    db: Session = Depends(get_db),
    _: User = Depends(require_min_role(UserRole.MANAGER)),
) -> list[dict]:
    items = list(
        db.execute(select(MenuItem).where(MenuItem.is_active.is_(True))).scalars()
    )
    return menu_service.food_cost_rows(db, items)
