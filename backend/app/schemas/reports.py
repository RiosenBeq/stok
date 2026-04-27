"""Reporting schemas."""
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_products: int
    active_products: int
    total_warehouses: int
    total_suppliers: int
    low_stock_count: int
    total_stock_value: float
    total_units_on_hand: int


class TopProduct(BaseModel):
    product_id: int
    sku: str
    name: str
    units_moved: int


class ValuationRow(BaseModel):
    product_id: int
    sku: str
    name: str
    on_hand: int
    cost_price: float
    value: float
