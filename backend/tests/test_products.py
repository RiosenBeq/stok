from fastapi.testclient import TestClient


def _create_product(client: TestClient, headers: dict, **overrides) -> dict:
    payload = {
        "sku": "SKU-1",
        "name": "Demo Ürün",
        "unit": "adet",
        "cost_price": 10.0,
        "sale_price": 15.0,
        "low_stock_threshold": 5,
        **overrides,
    }
    r = client.post("/api/v1/products/", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_create_and_list_products(client: TestClient, auth_headers: dict):
    p = _create_product(client, auth_headers)
    assert p["sku"] == "SKU-1"

    r = client.get("/api/v1/products/", headers=auth_headers)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["on_hand"] == 0
    assert items[0]["is_low_stock"] is True


def test_duplicate_sku_rejected(client: TestClient, auth_headers: dict):
    _create_product(client, auth_headers, sku="DUP")
    r = client.post(
        "/api/v1/products/",
        json={"sku": "DUP", "name": "Other"},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_search_filter(client: TestClient, auth_headers: dict):
    _create_product(client, auth_headers, sku="A", name="Kalem")
    _create_product(client, auth_headers, sku="B", name="Defter")

    r = client.get("/api/v1/products/?q=kalem", headers=auth_headers)
    assert r.status_code == 200
    assert {p["sku"] for p in r.json()} == {"A"}


def test_staff_cannot_create_product(client: TestClient, staff_token: str):
    r = client.post(
        "/api/v1/products/",
        json={"sku": "X", "name": "Y"},
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert r.status_code == 403
