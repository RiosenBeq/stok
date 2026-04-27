"""Inventory and stock-movement schemas."""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.stock import MovementType
from app.schemas.common import ORMModel


class StockMovementCreate(BaseModel):
    """User-friendly movement input. Quantity is always positive; sign comes from `type`."""
    product_id: int
    warehouse_id: int
    type: MovementType
    quantity: int = Field(gt=0)
    unit_cost: float | None = Field(default=None, ge=0)
    reference: str | None = Field(default=None, max_length=120)
    note: str | None = Field(default=None, max_length=500)


class StockMovementOut(ORMModel):
    id: int
    product_id: int
    warehouse_id: int
    type: MovementType
    quantity: int
    unit_cost: float | None
    reference: str | None
    note: str | None
    user_id: int | None
    created_at: datetime


class StockTransfer(BaseModel):
    product_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: int = Field(gt=0)
    note: str | None = Field(default=None, max_length=500)


class AdjustmentCreate(BaseModel):
    product_id: int
    warehouse_id: int
    new_quantity: int = Field(ge=0)
    note: str | None = Field(default=None, max_length=500)


class StockLevel(BaseModel):
    product_id: int
    product_name: str
    sku: str
    warehouse_id: int
    warehouse_code: str
    on_hand: int
    low_stock_threshold: int
    is_low_stock: bool
