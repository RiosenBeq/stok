from fastapi.testclient import TestClient


def _seed(client: TestClient, h: dict) -> tuple[int, int, int]:
    pid = client.post(
        "/api/v1/products/",
        json={"sku": "X", "name": "X", "cost_price": 5, "sale_price": 8},
        headers=h,
    ).json()["id"]
    sid = client.post(
        "/api/v1/suppliers/", json={"name": "Acme"}, headers=h
    ).json()["id"]
    wid = client.get("/api/v1/warehouses/", headers=h).json()[0]["id"]
    return pid, sid, wid


def test_purchase_order_receive_increases_stock(client: TestClient, auth_headers: dict):
    pid, sid, wid = _seed(client, auth_headers)
    r = client.post(
        "/api/v1/orders/purchase",
        json={
            "code": "PO-1",
            "supplier_id": sid,
            "warehouse_id": wid,
            "items": [{"product_id": pid, "quantity": 20, "unit_cost": 5.0}],
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    order_id = r.json()["id"]

    r = client.post(f"/api/v1/orders/purchase/{order_id}/receive", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "received"

    on_hand = client.get(f"/api/v1/products/{pid}", headers=auth_headers).json()["on_hand"]
    assert on_hand == 20


def test_sales_order_ship_blocked_without_stock(client: TestClient, auth_headers: dict):
    pid, _, wid = _seed(client, auth_headers)
    r = client.post(
        "/api/v1/orders/sales",
        json={
            "code": "SO-1",
            "customer_name": "Müşteri",
            "warehouse_id": wid,
            "items": [{"product_id": pid, "quantity": 1, "unit_price": 10.0}],
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    order_id = r.json()["id"]

    r = client.post(f"/api/v1/orders/sales/{order_id}/ship", headers=auth_headers)
    assert r.status_code == 409
