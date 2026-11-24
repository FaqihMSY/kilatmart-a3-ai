FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir "dlt[duckdb]==1.32.0" psycopg2-binary==2.9.13 sqlalchemy==2.1.9
COPY pipeline.py transform.sql ./
CMD ["python", "pipeline.py"]
