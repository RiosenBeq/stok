from fastapi.testclient import TestClient


def _seed(client: TestClient, h: dict) -> tuple[int, int, int, int]:
    bun = client.post(
        "/api/v1/products/",
        json={"sku": "BUN", "name": "Ekmek", "cost_price": 2, "sale_price": 0},
        headers=h,
    ).json()["id"]
    patty = client.post(
        "/api/v1/products/",
        json={"sku": "PATTY", "name": "Köfte", "cost_price": 18, "sale_price": 0},
        headers=h,
    ).json()["id"]
    wh = client.get("/api/v1/warehouses/", headers=h).json()[0]["id"]
    for pid in (bun, patty):
        client.post(
            "/api/v1/inventory/movements",
            json={"product_id": pid, "warehouse_id": wh, "type": "in", "quantity": 10},
            headers=h,
        )
    burger = client.post(
        "/api/v1/menu-items/",
        json={
            "sku": "BURGER",
            "name": "Klasik Burger",
            "price": 90,
            "recipe": [
                {"product_id": bun, "quantity": 1},
                {"product_id": patty, "quantity": 1},
            ],
        },
        headers=h,
    ).json()["id"]
    return bun, patty, wh, burger


def test_cart_checkout_records_sale_and_decrements_stock(client: TestClient, auth_headers: dict):
    bun, patty, wh, burger = _seed(client, auth_headers)
    r = client.post(
        "/api/v1/sales/checkout",
        json={
            "warehouse_id": wh,
            "items": [{"menu_item_id": burger, "quantity": 3}],
        },
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text
    sale = r.json()
    assert sale["total"] == 270.0  # 90 * 3
    assert sale["cost"] == 60.0    # (2+18)*3
    assert len(sale["items"]) == 1

    bun_qty = client.get(f"/api/v1/products/{bun}", headers=auth_headers).json()["on_hand"]
    patty_qty = client.get(f"/api/v1/products/{patty}", headers=auth_headers).json()["on_hand"]
    assert bun_qty == 7
    assert patty_qty == 7


def test_cart_checkout_atomic_on_shortage(client: TestClient, auth_headers: dict):
    bun, _, wh, burger = _seed(client, auth_headers)
    # Ask for 20 burgers — bun only has 10, so the whole cart must abort.
    r = client.post(
        "/api/v1/sales/checkout",
        json={
            "warehouse_id": wh,
            "items": [{"menu_item_id": burger, "quantity": 20}],
        },
        headers=auth_headers,
    )
    assert r.status_code == 409
    bun_qty = client.get(f"/api/v1/products/{bun}", headers=auth_headers).json()["on_hand"]
    assert bun_qty == 10  # untouched


def test_sales_history_returns_recent_first(client: TestClient, auth_headers: dict):
    _, _, wh, burger = _seed(client, auth_headers)
    for _ in range(3):
        client.post(
            "/api/v1/sales/checkout",
            json={"warehouse_id": wh, "items": [{"menu_item_id": burger, "quantity": 1}]},
            headers=auth_headers,
        )
    r = client.get("/api/v1/sales/", headers=auth_headers)
    assert r.status_code == 200
    sales = r.json()
    assert len(sales) == 3
    assert sales[0]["id"] > sales[1]["id"] > sales[2]["id"]


def test_daily_snapshot_aggregates_today(client: TestClient, auth_headers: dict):
    _, _, wh, burger = _seed(client, auth_headers)
    client.post(
        "/api/v1/sales/checkout",
        json={"warehouse_id": wh, "items": [{"menu_item_id": burger, "quantity": 2}]},
        headers=auth_headers,
    )
    r = client.get("/api/v1/sales/daily", headers=auth_headers)
    assert r.status_code == 200
    rows = r.json()
    branch_row = next(r for r in rows if r["warehouse_id"] == wh)
    assert branch_row["sales_count"] == 1
    assert branch_row["units_sold"] == 2
    assert branch_row["revenue"] == 180.0


def test_change_my_password_rejects_wrong_current(client: TestClient, auth_headers: dict):
    r = client.patch(
        "/api/v1/users/me/password",
        json={"current_password": "wrong", "new_password": "newvalidpass123"},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_change_my_password_works(client: TestClient, auth_headers: dict):
    r = client.patch(
        "/api/v1/users/me/password",
        json={"current_password": "adminpass123", "new_password": "newadminpass456"},
        headers=auth_headers,
    )
    assert r.status_code == 204

    # Old password rejected
    r = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.example.com", "password": "adminpass123"},
    )
    assert r.status_code == 401
    # New password works
    r = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.example.com", "password": "newadminpass456"},
    )
    assert r.status_code == 200
