-- Dijalankan otomatis oleh image postgres:16 kalau seed/ di-mount ke /docker-entrypoint-initdb.d.
-- updated_at wajib ada: dipakai sebagai cursor incremental dlt.
CREATE TABLE orders (
    id          bigserial PRIMARY KEY,
    customer    text        NOT NULL,
    item        text        NOT NULL,
    qty         integer     NOT NULL,
    price       numeric(12, 0) NOT NULL,
    status      text        NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 5 order, 3 item (Kopi, Teh, Gula), 3 hari (20, 21, 22 November 2026, UTC).
INSERT INTO orders (customer, item, qty, price, status, created_at, updated_at) VALUES
    ('Andi', 'Kopi', 2, 50000, 'shipped',   '2026-11-20 09:00:00+00', '2026-11-21 08:30:00+00'),
    ('Sari', 'Teh',  1, 30000, 'shipped',   '2026-11-20 14:30:00+00', '2026-11-20 16:00:00+00'),
    ('Budi', 'Gula', 5, 15000, 'pending',   '2026-11-21 10:15:00+00', '2026-11-21 10:15:00+00'),
    ('Dewi', 'Kopi', 1, 50000, 'cancelled', '2026-11-21 16:45:00+00', '2026-11-21 17:00:00+00'),
    ('Rina', 'Teh',  3, 30000, 'shipped',   '2026-11-22 08:20:00+00', '2026-11-22 11:15:00+00');

-- Hitungan manual untuk sales_per_day (order_count tanpa cancelled, gross_revenue dari paid dan shipped):
--   2026-11-20: order_count 2, gross_revenue 130000 (2*50000 + 1*30000)
--   2026-11-21: order_count 1, gross_revenue 0      (Budi pending, Dewi cancelled)
--   2026-11-22: order_count 1, gross_revenue 90000  (3*30000)
-- Order 1, 2, 5 berstatus shipped dan masing-masing punya satu shipment di mock KirimCepat (order_ref = id).
-- Seed hanya jalan kalau volume Postgres masih kosong: setelah mengubah file ini, jalankan docker compose down -v.
-- Setelah demo incremental (insert Budi, Kopi, 2, 50000, paid, tanggal hari itu), baris itu menambah satu tanggal.
