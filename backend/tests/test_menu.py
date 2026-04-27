from fastapi.testclient import TestClient


def _seed(client: TestClient, h: dict) -> tuple[int, int, int, int]:
    """Create two ingredient products + main warehouse, return (bun, patty, wh, _)."""
    bun = client.post(
        "/api/v1/products/",
        json={"sku": "BUN", "name": "Hamburger Ekmeği", "cost_price": 2, "sale_price": 0},
        headers=h,
    ).json()["id"]
    patty = client.post(
        "/api/v1/products/",
        json={"sku": "PATTY", "name": "Köfte 150g", "cost_price": 18, "sale_price": 0},
        headers=h,
    ).json()["id"]
    wh = client.get("/api/v1/warehouses/", headers=h).json()[0]["id"]
    # Stock the warehouse with 5 buns and 5 patties
    for pid in (bun, patty):
        client.post(
            "/api/v1/inventory/movements",
            json={"product_id": pid, "warehouse_id": wh, "type": "in", "quantity": 5},
            headers=h,
        )
    return bun, patty, wh, 0


def _create_menu_item(client: TestClient, h: dict, bun: int, patty: int) -> dict:
    r = client.post(
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
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_create_menu_item_with_recipe(client: TestClient, auth_headers: dict):
    bun, patty, _, _ = _seed(client, auth_headers)
    mi = _create_menu_item(client, auth_headers, bun, patty)
    assert mi["sku"] == "BURGER"
    assert len(mi["recipe"]) == 2


def test_sell_decrements_all_ingredients(client: TestClient, auth_headers: dict):
    bun, patty, wh, _ = _seed(client, auth_headers)
    mi = _create_menu_item(client, auth_headers, bun, patty)

    r = client.post(
        f"/api/v1/menu-items/{mi['id']}/sell",
        json={"warehouse_id": wh, "quantity": 3},
        headers=auth_headers,
    )
    assert r.status_code == 200, r.text
    assert len(r.json()) == 2

    bun_qty = client.get(f"/api/v1/products/{bun}", headers=auth_headers).json()["on_hand"]
    patty_qty = client.get(f"/api/v1/products/{patty}", headers=auth_headers).json()["on_hand"]
    assert bun_qty == 2  # 5 - 3
    assert patty_qty == 2


def test_sell_blocks_when_short(client: TestClient, auth_headers: dict):
    bun, patty, wh, _ = _seed(client, auth_headers)
    mi = _create_menu_item(client, auth_headers, bun, patty)

    r = client.post(
        f"/api/v1/menu-items/{mi['id']}/sell",
        json={"warehouse_id": wh, "quantity": 10},
        headers=auth_headers,
    )
    assert r.status_code == 409
    # Stocks must remain intact (atomic failure).
    bun_qty = client.get(f"/api/v1/products/{bun}", headers=auth_headers).json()["on_hand"]
    assert bun_qty == 5


def test_food_cost_report(client: TestClient, auth_headers: dict):
    bun, patty, _, _ = _seed(client, auth_headers)
    _create_menu_item(client, auth_headers, bun, patty)

    r = client.get("/api/v1/menu-items/-/food-cost", headers=auth_headers)
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 1
    # cost = 1*2 + 1*18 = 20; price = 90; pct = 22.22
    assert rows[0]["cost"] == 20.0
    assert rows[0]["margin"] == 70.0
    assert abs(rows[0]["food_cost_pct"] - 22.22) < 0.01


def test_waste_endpoint_decrements_stock(client: TestClient, auth_headers: dict):
    bun, _, wh, _ = _seed(client, auth_headers)
    r = client.post(
        "/api/v1/inventory/waste",
        json={"product_id": bun, "warehouse_id": wh, "type": "out", "quantity": 2,
              "note": "Tarihi geçti"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert r.json()["reference"] == "WASTE"
    bun_qty = client.get(f"/api/v1/products/{bun}", headers=auth_headers).json()["on_hand"]
    assert bun_qty == 3
