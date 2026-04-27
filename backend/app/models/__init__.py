"""ORM models. Importing this package registers all tables with the metadata."""
from app.models.audit import AuditLog
from app.models.category import Category
from app.models.menu import MenuItem, RecipeItem
from app.models.order import PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.stock import StockMovement
from app.models.supplier import Supplier
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse

__all__ = [
    "AuditLog",
    "Category",
    "MenuItem",
    "Product",
    "PurchaseOrder",
    "PurchaseOrderItem",
    "RecipeItem",
    "Sale",
    "SaleItem",
    "SalesOrder",
    "SalesOrderItem",
    "StockMovement",
    "Supplier",
    "User",
    "UserRole",
    "Warehouse",
]
