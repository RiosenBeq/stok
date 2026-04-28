from app.db.init_db import _seed_demo_data
from app.models.menu import MenuItem
from app.models.product import Product
from app.models.stock import StockMovement


def test_seed_demo_data_populates_catalog_and_stock(db_session):
    # conftest already seeds users + MAIN warehouse, but no products/menu.
    _seed_demo_data(db_session)
    db_session.commit()

    assert db_session.query(Product).count() >= 2
    assert db_session.query(MenuItem).count() >= 1
    assert db_session.query(StockMovement).count() >= 2


def test_seed_demo_data_idempotent_when_products_exist(db_session):
    _seed_demo_data(db_session)
    db_session.commit()
    first_count = db_session.query(Product).count()

    _seed_demo_data(db_session)
    db_session.commit()
    second_count = db_session.query(Product).count()

    assert first_count == second_count
