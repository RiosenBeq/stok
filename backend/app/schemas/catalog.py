"""Schemas for category, supplier, warehouse and product."""
from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


# --- Category ---------------------------------------------------------------
class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    parent_id: int | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    parent_id: int | None = None


class CategoryOut(ORMModel, CategoryBase):
    id: int


# --- Supplier ---------------------------------------------------------------
class SupplierBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    contact_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    tax_number: str | None = None
    is_active: bool = True


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    contact_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    tax_number: str | None = None
    is_active: bool | None = None


class SupplierOut(ORMModel, SupplierBase):
    id: int


# --- Warehouse --------------------------------------------------------------
class WarehouseBase(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=200)
    location: str | None = None
    is_active: bool = True


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=20)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    location: str | None = None
    is_active: bool | None = None


class WarehouseOut(ORMModel, WarehouseBase):
    id: int


# --- Product ----------------------------------------------------------------
class ProductBase(BaseModel):
    sku: str = Field(min_length=1, max_length=64)
    barcode: str | None = Field(default=None, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    unit: str = Field(default="adet", max_length=20)

    cost_price: float = Field(default=0, ge=0)
    sale_price: float = Field(default=0, ge=0)
    tax_rate: float = Field(default=18, ge=0, le=100)

    low_stock_threshold: int = Field(default=10, ge=0)
    is_active: bool = True

    category_id: int | None = None
    supplier_id: int | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1, max_length=64)
    barcode: str | None = Field(default=None, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    unit: str | None = None
    cost_price: float | None = Field(default=None, ge=0)
    sale_price: float | None = Field(default=None, ge=0)
    tax_rate: float | None = Field(default=None, ge=0, le=100)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    category_id: int | None = None
    supplier_id: int | None = None


class ProductOut(ORMModel, ProductBase):
    id: int


class ProductWithStock(ProductOut):
    on_hand: int = 0
    is_low_stock: bool = False
