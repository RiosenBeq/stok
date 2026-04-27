"""POS sale schemas."""
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class CartLineIn(BaseModel):
    menu_item_id: int
    quantity: int = Field(gt=0)


class CartCheckoutIn(BaseModel):
    warehouse_id: int
    items: list[CartLineIn] = Field(min_length=1)
    note: str | None = Field(default=None, max_length=500)


class SaleItemOut(ORMModel):
    id: int
    menu_item_id: int
    quantity: int
    unit_price: float
    line_total: float
    menu_item_name: str | None = None
    menu_item_sku: str | None = None


class SaleOut(ORMModel):
    id: int
    code: str
    warehouse_id: int
    user_id: int | None
    total: float
    cost: float
    note: str | None
    created_at: datetime
    items: list[SaleItemOut]
    warehouse_code: str | None = None


class DailySnapshot(BaseModel):
    """Per-branch (or aggregate) snapshot of today's activity."""
    warehouse_id: int | None
    warehouse_code: str | None
    sales_count: int
    units_sold: int
    revenue: float
    cost: float
    margin: float
    waste_units: int
    waste_value: float


class TrendPoint(BaseModel):
    date: str  # YYYY-MM-DD
    revenue: float
    sales: int
