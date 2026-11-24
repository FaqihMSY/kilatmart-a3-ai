# Skrip demo, video cadangan, dan daftar cek submit

Deck ada di `deck/kilatmart-a3-deck.pptx` (komponen asli, catatan pembicara per slide ada di panel notes). Dibangun ulang dengan `deck/build-deck.js`.

## Waktu presentasi: 7 menit, dipotong paksa di 7.00

| Menit | Isi | Usulan pembicara |
|---|---|---|
| 0.00-0.40 | Slide 1-2: masalah dan arsitektur | Story |
| 0.40-1.20 | Slide 3: konfigurasi dlt | Faqih |
| 1.20-2.00 | Slide 4: full load dan incremental | Faqih |
| 2.00-2.40 | Slide 5: transform SQL | Faqih |
| 2.40-3.20 | Slide 6: failure experiment | Experiment |
| 3.20-4.00 | Slide 7-8: konsep, reproducibility, AI disclosure | Story |
| 4.00-7.00 | Demo langsung, 3 menit | Pipeline dan Faqih |

Pembicara hanya usulan. Faqih tidak bisa ditanya setelah Selasa, jadi anggota lain harus bisa menjelaskan slide 3-5 dari catatan pembicara.

## Demo langsung, 3 menit

Siapkan sebelum maju: Docker Desktop menyala, `data/` kosong, `docker compose down -v` sudah dijalankan, image sudah di-build sekali (supaya tidak menunggu unduhan).

```
docker compose up -d --build
docker compose logs pipeline
```

Yang disebut dengan suara: baris `ROWS_THIS_RUN` berisi orders 5 dan shipments 3, baris `TOTAL_ROWS` berisi 5, 3, 3. Itu full load.

```
docker compose exec db psql -U kilatmart -d kilatmart -c "insert into orders (customer, item, qty, price, status) values ('Budi', 'Kopi', 2, 50000, 'paid')"
docker compose run --rm pipeline
```

Yang disebut: `ROWS_THIS_RUN` berisi orders 1, `TOTAL_ROWS` orders 6 dan `sales_per_day` 4 baris. Itu incremental. Kalau waktu tersisa, `docker compose run --rm pipeline python -c "import duckdb; print(duckdb.connect('/data/analytics.duckdb', read_only=True).sql('select * from raw.sales_per_day').fetchall())"`.

Kalau macet, pakai video cadangan. Jangan memperbaiki di depan kelas.

## Video cadangan, maksimal 2 menit

Rekam layar terminal, tanpa suara internet. Urutan sama dengan demo: `up`, log full load, insert order, run kedua, log incremental. Putar dari file lokal.

## Walkthrough kode, 5 menit (untuk anggota lain)

1. `docker-compose.yml`: tiga service, healthcheck, pipeline `restart: "no"`.
2. `seed/orders.sql`: skema dan 5 order.
3. `mock-kirimecepat/app.py`: 401 tanpa key.
4. `pipeline/pipeline.py`: dua resource dan `merge`.
5. `pipeline/transform.sql` dan `percobaan-a.md`.

## Daftar cek submit (belum ada yang saya kerjakan di sini)

| Hal | Status |
|---|---|
| Isi nama kelompok di sampul slide 1 | belum, placeholder `[Nama kelompok dan anggota]` |
| Isi link repo di slide 8 | selesai, `github.com/FaqihMSY/kilatmart-a3-ai`. Repo private: tambahkan dosen dan tim sebagai collaborator |
| Ekspor deck ke PDF | belum, brief meminta PDF. Lakukan setelah deck disetujui |
| Video cadangan | belum direkam |
| Uji clone bersih di laptop demo | belum |
| Konfirmasi lima atau empat orang ke dosen | belum |
| Cek tanggal submit dan presentasi | belum, rencana menulis 26 Oktober dan 1 November |
| Submit PDF dan link repo lewat MS Teams | belum |
| Pernyataan AI di slide 8 cocok dengan alat yang dipakai seluruh anggota | belum dicek, saya hanya menulis penggunaan Claude Code |
