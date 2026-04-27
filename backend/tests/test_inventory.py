from fastapi.testclient import TestClient


def _new_product(client: TestClient, headers: dict, sku="P-1") -> int:
    r = client.post(
        "/api/v1/products/",
        json={"sku": sku, "name": f"Ürün {sku}", "low_stock_threshold": 3},
        headers=headers,
    )
    assert r.status_code == 201
    return r.json()["id"]


def _new_warehouse(client: TestClient, headers: dict, code: str) -> int:
    r = client.post(
        "/api/v1/warehouses/",
        json={"code": code, "name": f"Depo {code}"},
        headers=headers,
    )
    assert r.status_code == 201
    return r.json()["id"]


def test_stock_in_increases_on_hand(client: TestClient, auth_headers: dict):
    pid = _new_product(client, auth_headers)
    # MAIN warehouse seeded by conftest
    main = client.get("/api/v1/warehouses/", headers=auth_headers).json()[0]["id"]

    r = client.post(
        "/api/v1/inventory/movements",
        json={"product_id": pid, "warehouse_id": main, "type": "in", "quantity": 25},
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text

    r = client.get(f"/api/v1/products/{pid}", headers=auth_headers)
    assert r.json()["on_hand"] == 25
    assert r.json()["is_low_stock"] is False


def test_stock_out_blocked_when_insufficient(client: TestClient, auth_headers: dict):
    pid = _new_product(client, auth_headers)
    main = client.get("/api/v1/warehouses/", headers=auth_headers).json()[0]["id"]
    r = client.post(
        "/api/v1/inventory/movements",
        json={"product_id": pid, "warehouse_id": main, "type": "out", "quantity": 1},
        headers=auth_headers,
    )
    assert r.status_code == 409


def test_transfer_moves_stock(client: TestClient, auth_headers: dict):
    pid = _new_product(client, auth_headers)
    main = client.get("/api/v1/warehouses/", headers=auth_headers).json()[0]["id"]
    other = _new_warehouse(client, auth_headers, "B2")

    client.post(
        "/api/v1/inventory/movements",
        json={"product_id": pid, "warehouse_id": main, "type": "in", "quantity": 10},
        headers=auth_headers,
    )

    r = client.post(
        "/api/v1/inventory/transfer",
        json={
            "product_id": pid,
            "from_warehouse_id": main,
            "to_warehouse_id": other,
            "quantity": 4,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201, r.text

    main_qty = client.get(
        f"/api/v1/products/{pid}?warehouse_id={main}", headers=auth_headers
    ).json()["on_hand"]
    other_qty = client.get(
        f"/api/v1/products/{pid}?warehouse_id={other}", headers=auth_headers
    ).json()["on_hand"]
    assert main_qty == 6
    assert other_qty == 4


def test_adjustment_sets_absolute_quantity(client: TestClient, auth_headers: dict):
    pid = _new_product(client, auth_headers)
    main = client.get("/api/v1/warehouses/", headers=auth_headers).json()[0]["id"]

    client.post(
        "/api/v1/inventory/movements",
        json={"product_id": pid, "warehouse_id": main, "type": "in", "quantity": 100},
        headers=auth_headers,
    )

    r = client.post(
        "/api/v1/inventory/adjust",
        json={"product_id": pid, "warehouse_id": main, "new_quantity": 80},
        headers=auth_headers,
    )
    assert r.status_code == 200

    on_hand = client.get(f"/api/v1/products/{pid}", headers=auth_headers).json()["on_hand"]
    assert on_hand == 80


def test_dashboard_stats(client: TestClient, auth_headers: dict):
    pid = _new_product(client, auth_headers)
    main = client.get("/api/v1/warehouses/", headers=auth_headers).json()[0]["id"]
    client.post(
        "/api/v1/inventory/movements",
        json={"product_id": pid, "warehouse_id": main, "type": "in", "quantity": 50},
        headers=auth_headers,
    )

    r = client.get("/api/v1/reports/dashboard", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total_products"] == 1
    assert body["total_units_on_hand"] == 50
