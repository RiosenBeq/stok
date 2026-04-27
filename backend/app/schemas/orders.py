"""Order schemas."""
from pydantic import BaseModel, Field

from app.models.order import OrderStatus
from app.schemas.common import ORMModel


class POItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_cost: float = Field(ge=0)


class POItemOut(ORMModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: float


class PurchaseOrderCreate(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    supplier_id: int
    warehouse_id: int
    note: str | None = None
    items: list[POItemIn] = Field(min_length=1)


class PurchaseOrderOut(ORMModel):
    id: int
    code: str
    supplier_id: int
    warehouse_id: int
    status: OrderStatus
    note: str | None
    items: list[POItemOut]


class SOItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)


class SOItemOut(ORMModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float


class SalesOrderCreate(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    customer_name: str = Field(min_length=1, max_length=200)
    warehouse_id: int
    note: str | None = None
    items: list[SOItemIn] = Field(min_length=1)


class SalesOrderOut(ORMModel):
    id: int
    code: str
    customer_name: str
    warehouse_id: int
    status: OrderStatus
    note: str | None
    items: list[SOItemOut]
