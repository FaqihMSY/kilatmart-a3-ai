-- Data contoh saja, tidak disambungkan ke pipeline.
CREATE TABLE stock (
    product text PRIMARY KEY,
    qty     integer NOT NULL
);

INSERT INTO stock (product, qty) VALUES
    ('Kopi', 120),
    ('Teh',  80),
    ('Gula', 200);
