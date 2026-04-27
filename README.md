# Stok — Gelişmiş Envanter & Stok Yönetim Sistemi

Çoklu depo, rol tabanlı erişim ve akıllı stok hareket defteri ile çalışan açık kaynak bir
envanter yönetim platformu. **FastAPI + SQLAlchemy 2 + React/TypeScript + Tailwind**.

## Öne Çıkan Özellikler

| Alan | Detay |
| --- | --- |
| Kimlik Doğrulama | JWT access + refresh token, OAuth2 password flow |
| Yetkilendirme | RBAC: `admin`, `manager`, `staff`, `viewer` (rütbe-bazlı) |
| Katalog | Ürün, kategori (hiyerarşik), tedarikçi, çoklu depo |
| Stok | Append-only ledger; IN/OUT/TRANSFER/ADJUSTMENT hareketleri |
| Sipariş | Satınalma & satış siparişleri; onay/teslim akışları stoğu otomatik günceller |
| Raporlama | Pano metrikleri, çok satanlar, stok değerlemesi |
| Denetim | Hassas işlemler için `audit_logs` tablosu |
| Geliştirme | Pytest, in-memory test DB, GitHub Actions CI, Docker |

## Hızlı Başlangıç

### Docker (önerilen)
```bash
docker compose up --build
# Frontend: http://localhost:8080
# API docs: http://localhost:8000/docs
# Varsayılan giriş: admin@stok.local / admin12345  (üretimde mutlaka değiştirin!)
```

### Manuel kurulum

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Mimari

```
┌──────────────┐    JSON / JWT    ┌──────────────────────────────┐
│ React Vite   │ ───────────────► │ FastAPI                      │
│ TypeScript   │ ◄─────────────── │  ├ api/v1 (auth, products..) │
│ Tailwind     │                  │  ├ services (inventory)      │
└──────────────┘                  │  └ models (SQLAlchemy 2)     │
                                  └──────────────┬───────────────┘
                                                 │
                                          ┌──────▼──────┐
                                          │ SQLite/PG   │
                                          └─────────────┘
```

### Stok hesaplama
`stock_movements` tablosu append-only bir defterdir. Eldeki miktar her zaman
`SUM(quantity)` (signed) ile (ürün, depo) bazında hesaplanır. Bu sayede:
- Geçmiş hiçbir zaman güncellenmez (audit-friendly)
- Düzeltmeler kayıt olarak görünür kalır
- Çoklu depo transferleri iki kayıtla atomik olarak yapılır

## API Yol Haritası

`/api/v1/...`
- `auth/` — login, refresh, me
- `users/` — admin yönetimi
- `categories/`, `suppliers/`, `warehouses/` — temel kataloglar
- `products/` — arama, düşük stok filtresi, eldeki miktarlı detay
- `inventory/movements`, `inventory/transfer`, `inventory/adjust`, `inventory/levels`
- `orders/purchase`, `orders/sales` — `/{id}/receive`, `/{id}/ship`, `/{id}/cancel`
- `reports/dashboard`, `reports/top-products`, `reports/valuation`

Tam OpenAPI: çalışan API'da `/docs`.

## Test

```bash
cd backend
pytest -q          # 17 test, in-memory DB
```

## Önerilen Sonraki Adımlar

Bu repo sağlam bir temel sunar; aşağıdaki yönlerde genişletilebilir:

1. **Postgres + Alembic migrasyonları** — üretim için.
2. **Toplu içe aktarma** — Excel/CSV ürün ve hareket toplu yüklemesi.
3. **Barkod yazıcı entegrasyonu** — `/products/{id}/label` PDF endpoint'i.
4. **Webhook & e-posta** — Düşük stok / sipariş olaylarında bildirim.
5. **Çok renkli/parti takibi** — Aynı SKU altında varyant ve lot/serial numarası.
6. **WebSocket canlı güncelleme** — Pano ve hareket sayfası anlık.
7. **2FA + cihaz oturumları** — Admin hesapları için TOTP.
8. **PWA / mobil tarayıcı** — Sayım ekranı için kamera ile barkod okuma.
9. **Çoklu kiracılık (multi-tenant)** — `tenant_id` kolonu + row-level filtre.
10. **İş zekası** — Tahminleme (ABC analizi, sipariş noktası).

## Lisans

MIT.
