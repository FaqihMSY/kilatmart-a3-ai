-- Dijalankan otomatis di akhir setiap load. Semua waktu UTC.
-- paid_order_count memakai status yang sama dengan gross_revenue (paid dan shipped).
CREATE OR REPLACE TABLE raw.sales_per_day AS
SELECT
    CAST(timezone('UTC', created_at) AS DATE)                                       AS sale_date,
    COUNT(*) FILTER (WHERE status <> 'cancelled')                                   AS order_count,
    COALESCE(SUM(price * qty) FILTER (WHERE status IN ('paid', 'shipped')), 0)      AS gross_revenue,
    COUNT(*) FILTER (WHERE status IN ('paid', 'shipped'))                           AS paid_order_count
FROM raw.orders
GROUP BY 1
ORDER BY 1;
