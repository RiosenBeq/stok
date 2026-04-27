"""Menu-item & recipe schemas."""
from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class RecipeItemIn(BaseModel):
    product_id: int
    quantity: float = Field(gt=0, description="Bir adet menü için tüketilen miktar")


class RecipeItemOut(ORMModel):
    id: int
    product_id: int
    quantity: float
    # Optional convenience fields populated when product is joined
    product_sku: str | None = None
    product_name: str | None = None


class MenuItemBase(BaseModel):
    sku: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: float = Field(default=0, ge=0)
    is_active: bool = True


class MenuItemCreate(MenuItemBase):
    recipe: list[RecipeItemIn] = Field(default_factory=list)


class MenuItemUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: float | None = Field(default=None, ge=0)
    is_active: bool | None = None
    recipe: list[RecipeItemIn] | None = None


class MenuItemOut(ORMModel, MenuItemBase):
    id: int
    recipe: list[RecipeItemOut] = []


class SellRequest(BaseModel):
    warehouse_id: int
    quantity: int = Field(gt=0, default=1, description="Kaç adet menü satıldı")
    note: str | None = None


class FoodCostRow(BaseModel):
    menu_item_id: int
    sku: str
    name: str
    price: float
    cost: float
    margin: float
    food_cost_pct: float
