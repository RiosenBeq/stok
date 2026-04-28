"""Database bootstrap: create tables and seed the first superuser/warehouse."""
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.db.session import Base, SessionLocal, engine
from app.models.category import Category
from app.models.menu import MenuItem, RecipeItem
from app.models.product import Product
from app.models.stock import MovementType, StockMovement
from app.models.supplier import Supplier
from app.models.user import User, UserRole
from app.models.warehouse import Warehouse

# Import all model modules so the metadata is fully populated
from app import models  # noqa: F401

logger = logging.getLogger(__name__)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        _seed_superuser(db)
        _seed_default_warehouse(db)
        _seed_demo_data(db)
        db.commit()


def _seed_superuser(db: Session) -> None:
    existing = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    if existing:
        # Development convenience: keep seeded credentials in sync with config.
        # This prevents stale local DB passwords from causing "wrong password"
        # errors after changing FIRST_SUPERUSER_PASSWORD.
        if (
            settings.ENVIRONMENT == "development"
            and not verify_password(settings.FIRST_SUPERUSER_PASSWORD, existing.hashed_password)
        ):
            existing.hashed_password = hash_password(settings.FIRST_SUPERUSER_PASSWORD)
            logger.info("Updated seeded superuser password for %s", settings.FIRST_SUPERUSER_EMAIL)
        return
    user = User(
        email=settings.FIRST_SUPERUSER_EMAIL,
        full_name=settings.FIRST_SUPERUSER_FULL_NAME,
        hashed_password=hash_password(settings.FIRST_SUPERUSER_PASSWORD),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    logger.info("Seeded superuser %s", settings.FIRST_SUPERUSER_EMAIL)


def _seed_default_warehouse(db: Session) -> None:
    if db.query(Warehouse).first():
        return
    db.add(
        Warehouse(
            code="MAIN",
            name="Ana Depo",
            location="Merkez",
            is_active=True,
        )
    )
    logger.info("Seeded default warehouse MAIN")


def _seed_demo_data(db: Session) -> None:
    if settings.ENVIRONMENT != "development":
        return
    if db.query(Product).first():
        return

    category = Category(name="Et & Protein", description="Burger köftesi vb.")
    supplier = Supplier(
        name="Demo Tedarik A.Ş.",
        contact_name="Demo Satış",
        email="satis@demo.tedarik",
        phone="+90 212 000 00 00",
        is_active=True,
    )
    db.add_all([category, supplier])
    db.flush()

    patty = Product(
        sku="PRD-PATTY-150",
        name="Dana Köfte 150g",
        unit="adet",
        cost_price=42.50,
        sale_price=0,
        low_stock_threshold=20,
        category_id=category.id,
        supplier_id=supplier.id,
        is_active=True,
    )
    bun = Product(
        sku="PRD-BUN-001",
        name="Burger Ekmeği",
        unit="adet",
        cost_price=6.00,
        sale_price=0,
        low_stock_threshold=30,
        category_id=category.id,
        supplier_id=supplier.id,
        is_active=True,
    )
    db.add_all([patty, bun])
    db.flush()

    menu_item = MenuItem(
        sku="MENU-KLASIK-001",
        name="Klasik Burger",
        description="Demo menü ürünü",
        price=195,
        is_active=True,
    )
    db.add(menu_item)
    db.flush()
    db.add_all(
        [
            RecipeItem(menu_item_id=menu_item.id, product_id=patty.id, quantity=1),
            RecipeItem(menu_item_id=menu_item.id, product_id=bun.id, quantity=1),
        ]
    )

    main_warehouse = db.query(Warehouse).filter(Warehouse.code == "MAIN").first()
    if main_warehouse:
        db.add_all(
            [
                StockMovement(
                    product_id=patty.id,
                    warehouse_id=main_warehouse.id,
                    type=MovementType.IN,
                    quantity=100,
                    unit_cost=42.50,
                    reference="DEMO-SEED",
                    note="Demo başlangıç stoğu",
                ),
                StockMovement(
                    product_id=bun.id,
                    warehouse_id=main_warehouse.id,
                    type=MovementType.IN,
                    quantity=150,
                    unit_cost=6.00,
                    reference="DEMO-SEED",
                    note="Demo başlangıç stoğu",
                ),
            ]
        )
    logger.info("Seeded demo catalog, menu item and opening stock")
