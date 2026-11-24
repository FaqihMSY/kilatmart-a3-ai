# Mock KirimCepat

REST kecil tanpa dependency (stdlib Python), port 8000. Dipakai pipeline sebagai resource shipments.

## Kontrak

| Hal | Isi |
|---|---|
| Endpoint | `GET /shipments`, mengembalikan list JSON berisi 3 shipments |
| Auth | header `X-API-Key`, nilai dari env `KIRIMCEPAT_API_KEY` (default `kirimcepat-dev-key`). Tanpa atau salah: 401 |
| Health | `GET /health`, 200 tanpa key |
| Primary key | `shipment_id` |

Field sengaja beda dari tabel `orders`:

| Field | Tipe | Contoh |
|---|---|---|
| `shipment_id` | text | `KC-0001` |
| `order_ref` | text, berisi `orders.id` | `2` |
| `courier` | text | `JNE` |
| `status` | text: `dispatched`, `in_transit`, `delivered` | `delivered` |
| `dispatched_at` | timestamp ISO 8601 UTC | `2026-11-20T16:00:00Z` |

## Potongan untuk docker-compose.yml (Platform yang memegang filenya)

```yaml
  mock-kirimecepat:
    build: ./mock-kirimecepat
    environment:
      KIRIMCEPAT_API_KEY: kirimcepat-dev-key
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 5s
      retries: 10
```

Pipeline memanggil `http://mock-kirimecepat:8000/shipments`, bukan `localhost`.
