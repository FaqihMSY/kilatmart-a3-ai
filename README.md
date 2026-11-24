# KilatMart A3: ELT dengan dlt dan DuckDB

Orders dari PostgreSQL dan shipments dari mock KirimCepat masuk ke DuckDB (`data/analytics.duckdb`, dataset `raw`), lalu `pipeline/transform.sql` membuat `raw.sales_per_day`.

## Jalankan

Butuh Docker Desktop menyala dan memori sekitar 4 GB. Port host 5433 (Postgres) dan 8001 (mock) harus kosong.

```
docker compose up -d --build
docker compose logs pipeline
```

Pipeline jalan sekali lalu berhenti (`restart: "no"`). Log yang dicek ada dua baris: `ROWS_THIS_RUN` (baris yang ditarik run itu) dan `TOTAL_ROWS` (isi tabel). Exit code bukan bukti.

Hasil full load: `orders` 5, `shipments` 3, `sales_per_day` 3.

## Incremental

```
docker compose exec db psql -U kilatmart -d kilatmart -c "insert into orders (customer, item, qty, price, status) values ('Budi', 'Kopi', 2, 50000, 'paid')"
docker compose run --rm pipeline
```

Hasil: `ROWS_THIS_RUN` berisi `orders: 1`, `TOTAL_ROWS` `orders: 6`. `shipments` ikut ditarik penuh (3) di setiap run karena mock tidak punya cursor, tapi totalnya tetap 3 (`merge` dengan `primary_key`).

## Lihat hasil

```
docker compose run --rm pipeline python -c "import duckdb; print(duckdb.connect('/data/analytics.duckdb', read_only=True).sql('select * from raw.sales_per_day').fetchall())"
```

## Ulang dari nol

```
docker compose down -v
```

Lalu hapus isi folder `data/`. Seed Postgres hanya jalan kalau volume masih kosong.

## Isi

| Folder | Isi |
|---|---|
| `seed/` | `orders.sql` (skema dan 5 order), `stock.sql` (data contoh, tidak dipakai pipeline) |
| `mock-kirimecepat/` | REST partner, header `X-API-Key`, lihat README di dalamnya |
| `pipeline/` | `pipeline.py` (dlt), `transform.sql`, Dockerfile |
| `percobaan-a.md` | failure experiment: prediksi dan hasil |
| `bukti/` | log dan angka hasil run |
| `deck/` | deck 8 slide (`.pptx` native) dan `build-deck.js` untuk membangunnya ulang |
| `demo.md` | skrip demo, video cadangan, daftar cek submit |

Image: `postgres:16`, `python:3.12-slim`, `dlt[duckdb]==1.32.0`.
