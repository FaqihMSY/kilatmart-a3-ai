# Percobaan A: tambah kolom `promo_code`

Dry run Faqih, 2026-11-24. Urutan: prediksi, yang diubah, perintah, hasil, penjelasan.

## Prediksi (ditulis sebelum run)

Setelah `promo_code` (text) ditambahkan di `orders` dan pipeline dijalankan lagi:

1. Kolom `promo_code` muncul di `raw.orders` di DuckDB setelah run berikutnya.
2. Baris lama berisi null di kolom itu.
3. Pipeline tidak gagal.
4. Incremental tetap hanya menarik order baru, bukan semua baris.

## Yang diubah

Dua tahap, karena "tambah kolom lalu run lagi" bisa berarti dua hal. Kondisi awal: `raw.orders` 6 baris (5 seed ditambah 1 hasil incremental), tanpa kolom `promo_code`.

1. Tahap 1: `ALTER TABLE orders ADD COLUMN promo_code text`, tanpa menambah baris.
2. Tahap 2: insert satu order baru (`Citra`, `promo_code = 'HEMAT10'`).

## Perintah

```
docker compose exec db psql -U kilatmart -d kilatmart -c "alter table orders add column promo_code text"
docker compose run --rm pipeline
docker compose exec db psql -U kilatmart -d kilatmart -c "insert into orders (customer, item, qty, price, status, promo_code) values ('Citra', 'Teh', 1, 30000, 'paid', 'HEMAT10')"
docker compose run --rm pipeline
```

## Hasil

Log lengkap di `bukti/06-percobaan-a.log`.

| Tahap | `orders` ditarik | Total `raw.orders` | Kolom `promo_code` di DuckDB | Pipeline |
|---|---|---|---|---|
| 1, setelah ALTER | 0 | 6 | tidak ada | tidak gagal |
| 2, setelah order baru | 1 | 7 | ada, 6 baris lama null, `Citra` berisi `HEMAT10` | tidak gagal |

## Penjelasan

Prediksi 2, 3, dan 4 benar: baris lama null, pipeline tidak gagal, dan incremental hanya menarik 1 order baru.

Prediksi 1 meleset di waktunya. Kolom tidak muncul setelah ALTER saja. Kolom baru di DuckDB baru dibuat saat dlt memuat baris dari tabel itu, dan pada tahap 1 tidak ada baris yang lolos filter `updated_at`, jadi tidak ada load untuk `orders` dan skema di DuckDB tidak berubah. Kolom muncul di run yang menarik baris pertama setelah ALTER. Artinya schema drift ditangani implisit dan tertunda: perubahan di source tidak langsung terlihat di analytics store, dan baris lama tidak diisi ulang karena `updated_at`-nya tidak berubah.

Catatan: `shipments` ditarik penuh (3 baris) di setiap run karena mock tidak punya cursor. Itu `merge` dengan `primary_key`, jadi totalnya tetap 3 baris.
