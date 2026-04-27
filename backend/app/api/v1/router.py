"""Top-level v1 router - mounts all sub-routers."""
from fastapi import APIRouter

from app.api.v1 import (
    auth,
    categories,
    inventory,
    menu,
    orders,
    products,
    reports,
    suppliers,
    users,
    warehouses,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(warehouses.router, prefix="/warehouses", tags=["warehouses"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(menu.router, prefix="/menu-items", tags=["menu"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
