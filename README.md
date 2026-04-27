# Stok — Gelişmiş Envanter & Stok Yönetim Sistemi

Çoklu depo, rol tabanlı erişim ve akıllı stok hareket defteri ile çalışan açık kaynak bir
envanter yönetim platformu. **Next.js 14 (App Router) + FastAPI + SQLAlchemy 2 + Tailwind**.
Vercel'e tek tıkla deploy.

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

### Lokal kurulum

**Backend** (terminal 1):
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload    # http://localhost:8000
```

**Frontend** (terminal 2):
```bash
npm install
npm run dev                       # http://localhost:3000
# Next.js, /api/* isteklerini lokalde uvicorn'a proxy eder.
# Varsayılan giriş: admin@stok.local / admin12345
```

### Sadece backend'i Docker'da
```bash
docker compose up --build         # backend :8000
```

## Mimari

```
┌────────────────────┐    JSON / JWT    ┌──────────────────────────────┐
│ Next.js 14         │ ───────────────► │ FastAPI                      │
│ App Router · TS    │ ◄─────────────── │  ├ api/v1 (auth, products..) │
│ Tailwind · Zustand │                  │  ├ services (inventory)      │
└────────────────────┘                  │  └ models (SQLAlchemy 2)     │
                                        └──────────────┬───────────────┘
                                                       │
                                                ┌──────▼──────┐
                                                │ SQLite/PG   │
                                                └─────────────┘
```

Vercel'de Next.js statik build + `api/[...path].py` Python serverless function
(FastAPI ASGI) tek deployment olarak çalışır.

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

## Vercel Deploy

Repo, Vercel monorepo desteğine uyumlu yapılandırılmıştır:

- `vercel.json` → frontend build (`frontend/dist`) + serverless function
- `api/[...path].py` → FastAPI ASGI app'ini Vercel Python runtime'a expose eder
- `api/requirements.txt` → backend Python bağımlılıkları
- `/_/backend/api/v1/*` → Vercel rewrite ile `/api/v1/*`'a yönlendirilir, catch-all serverless function'a düşer
- Vercel'de SQLite `/tmp/stok.db`'ye düşer (tek yazılabilir alan)

### Vercel proje ayarları
1. Root Directory = `./` (vercel.json kökte)
2. Framework Preset = Other
3. Build/Install/Output komutları otomatik vercel.json'dan okunur

### Production env değişkenleri
| Anahtar | Açıklama |
|---|---|
| `SECRET_KEY` | 32+ karakter random; JWT imzası |
| `DATABASE_URL` | Postgres URL (Neon, Supabase). SQLite serverless'da kalıcı değil. |
| `FIRST_SUPERUSER_PASSWORD` | İlk admin şifresi |
| `CORS_ORIGINS` | `["https://your-domain"]` JSON listesi |

> ⚠️ **Serverless uyarısı**: SQLite Vercel'in `/tmp` dizinine yazar — fonksiyon
> instance'ları ölünce veri kaybolur. Production'da `DATABASE_URL` ile yönetilen
> bir Postgres bağlayın. Neon/Supabase'in ücretsiz katmanı yeterlidir.

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
