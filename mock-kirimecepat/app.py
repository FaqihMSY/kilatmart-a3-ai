"""Mock KirimCepat: REST partner KilatMart dengan field yang sengaja beda dari skema orders.

GET /shipments  -> list JSON berisi 3 shipments, wajib header X-API-Key
GET /health     -> 200 tanpa key, dipakai healthcheck compose
"""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

API_KEY = os.environ.get("KIRIMCEPAT_API_KEY", "kirimcepat-dev-key")
PORT = int(os.environ.get("PORT", "8000"))

# order_ref = id order di Postgres, ditulis sebagai teks (partner tidak tahu skema kita).
SHIPMENTS = [
    {"shipment_id": "KC-0001", "order_ref": "2", "courier": "JNE",
     "status": "delivered", "dispatched_at": "2026-11-20T16:00:00Z"},
    {"shipment_id": "KC-0002", "order_ref": "1", "courier": "SiCepat",
     "status": "in_transit", "dispatched_at": "2026-11-21T08:30:00Z"},
    {"shipment_id": "KC-0003", "order_ref": "5", "courier": "JNT",
     "status": "dispatched", "dispatched_at": "2026-11-22T11:15:00Z"},
]


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/health":
            return self._send(200, {"ok": True})
        if self.headers.get("X-API-Key") != API_KEY:
            return self._send(401, {"error": "invalid or missing X-API-Key"})
        if path == "/shipments":
            return self._send(200, SHIPMENTS)
        return self._send(404, {"error": "not found"})


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
