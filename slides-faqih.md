# Draf isi slide 3 sampai 5 (bagian Faqih)

Angka diambil dari run nyata 2026-11-24, log di `bukti/`. Story yang merapikan jadi slide.

## Slide 3: Konfigurasi dlt dan sumber data

- Pipeline `kilatmart`, destination DuckDB `/data/analytics.duckdb`, dataset `raw`.
- Orders: `sql_table` dari PostgreSQL `db:5432`, `merge`, `primary_key="id"`, incremental pada `updated_at`.
- Shipments: `@dlt.resource` dengan `RESTClient` ke `http://mock-kirimecepat:8000/shipments`, header `X-API-Key`, `merge`, `primary_key="shipment_id"`.
- Mock sengaja pakai field partner (`shipment_id`, `order_ref`, `courier`, `status`, `dispatched_at`), beda dari skema `orders`.
- Snippet untuk slide: `orders_resource()` dan `shipments_resource()` di `pipeline/pipeline.py`.

## Slide 4: Full load dan incremental

| Langkah | `orders` ditarik | Total `raw.orders` | Total `raw.shipments` |
|---|---|---|---|
| Full load (`docker compose up`) | 5 | 5 | 3 |
| Run ulang tanpa perubahan | 0 | 5 | 3 |
| Insert 1 order lalu run | 1 | 6 | 3 |

- Bukti: `bukti/01-full-load.log`, `03-run-ulang-tanpa-perubahan.log`, `04-incremental.log`.
- Shipments ditarik penuh (3) tiap run karena mock tidak punya cursor, totalnya tetap 3 karena `merge`.
- Kata "incremental" boleh dipakai di slide: run kedua terbukti hanya menarik 1 baris order.

## Slide 5: transform.sql dan sales_per_day

- `CREATE OR REPLACE TABLE raw.sales_per_day`, dijalankan otomatis di akhir tiap load, waktu UTC.
- `order_count` tanpa `cancelled`, `gross_revenue` dari `price * qty` berstatus `paid` dan `shipped`, `paid_order_count` memakai status yang sama.

| sale_date | order_count | gross_revenue | paid_order_count |
|---|---|---|---|
| 2026-11-20 | 2 | 130000 | 2 |
| 2026-11-21 | 1 | 0 | 0 |
| 2026-11-22 | 1 | 90000 | 1 |

- Cocok dengan hitungan manual di komentar `seed/orders.sql`. Setelah incremental muncul baris tanggal hari itu (order Budi, 100000).
- Bukti: `bukti/02-sales-per-day-full.txt`, `05-sales-per-day-incremental.txt`.
