"""ELT KilatMart: orders (PostgreSQL) dan shipments (mock KirimCepat) -> DuckDB dataset raw, lalu transform.sql."""
import os

import dlt
from dlt.sources.helpers.rest_client import RESTClient
from dlt.sources.helpers.rest_client.auth import APIKeyAuth
from dlt.sources.helpers.rest_client.paginators import SinglePagePaginator
from dlt.sources.sql_database import sql_table

DATABASE_URL = os.environ["DATABASE_URL"]
KIRIMCEPAT_URL = os.environ["KIRIMCEPAT_URL"]
KIRIMCEPAT_API_KEY = os.environ["KIRIMCEPAT_API_KEY"]
DUCKDB_PATH = os.environ.get("DUCKDB_PATH", "/data/analytics.duckdb")


def orders_resource():
    # Incremental pada updated_at: run berikutnya hanya menarik baris dengan updated_at >= nilai terakhir.
    res = sql_table(
        credentials=DATABASE_URL,
        schema="public",
        table="orders",
        incremental=dlt.sources.incremental("updated_at"),
    )
    res.apply_hints(write_disposition="merge", primary_key="id")
    return res


@dlt.resource(name="shipments", write_disposition="merge", primary_key="shipment_id")
def shipments_resource():
    client = RESTClient(
        base_url=KIRIMCEPAT_URL,
        auth=APIKeyAuth(name="X-API-Key", api_key=KIRIMCEPAT_API_KEY, location="header"),
        paginator=SinglePagePaginator(),
    )
    for page in client.paginate("/shipments"):
        yield page


def main():
    pipeline = dlt.pipeline(
        pipeline_name="kilatmart",
        destination=dlt.destinations.duckdb(DUCKDB_PATH),
        dataset_name="raw",
    )
    load_info = pipeline.run([orders_resource(), shipments_resource()])
    print(load_info)

    # Baris yang ditarik run ini, bukan total di tabel. Exit code bukan bukti, angka ini yang dicek.
    row_counts = pipeline.last_trace.last_normalize_info.row_counts
    print("ROWS_THIS_RUN", {k: v for k, v in row_counts.items() if not k.startswith("_dlt")})

    with open(os.path.join(os.path.dirname(__file__), "transform.sql"), encoding="utf-8") as f:
        sql = f.read()
    with pipeline.sql_client() as client:
        client.execute_sql(sql)
        totals = {
            t: client.execute_sql(f"select count(*) from raw.{t}")[0][0]
            for t in ("orders", "shipments", "sales_per_day")
        }
    print("TOTAL_ROWS", totals)


if __name__ == "__main__":
    main()
