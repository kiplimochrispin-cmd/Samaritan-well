const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "orders.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_location TEXT NOT NULL,
  customer_notes TEXT,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  items_json TEXT NOT NULL
);
`);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".ts": "text/plain; charset=utf-8",
};

const ALLOWED_STATUSES = new Set(["pending", "confirmed", "dispatched", "delivered", "cancelled"]);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": MIME[".json"] });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sanitizePathname(pathname) {
  const normalized = path.normalize(pathname).replace(/^\.+/, "");
  return normalized === path.sep ? "" : normalized;
}

function parseOrderInput(payload) {
  const customer = payload.customer || {};
  const payment = payload.payment || {};
  const items = Array.isArray(payload.items) ? payload.items : [];

  const normalized = {
    customerName: String(customer.name || "").trim(),
    customerPhone: String(customer.phone || "").trim(),
    customerLocation: String(customer.location || "").trim(),
    customerNotes: String(customer.notes || "").trim(),
    paymentMethod: String(payment.method || "").trim().toLowerCase(),
    paymentReference:
      String(payment.mpesaPhone || payment.cardLast4 || customer.phone || "")
        .replace(/\s+/g, " ")
        .trim(),
    items,
    subtotal: Number(payload.subtotal || 0),
    deliveryFee: Number(payload.deliveryFee || 0),
    total: Number(payload.total || 0),
    createdAt: String(payload.createdAt || new Date().toISOString()),
  };

  if (!normalized.customerName || !normalized.customerPhone || !normalized.customerLocation) {
    throw new Error("Missing customer fields");
  }

  if (normalized.paymentMethod !== "mpesa" && normalized.paymentMethod !== "card") {
    throw new Error("Invalid payment method");
  }

  if (items.length === 0) {
    throw new Error("No order items");
  }

  if (!Number.isFinite(normalized.total) || normalized.total <= 0) {
    throw new Error("Invalid order total");
  }

  return normalized;
}

function mapOrderRow(row) {
  return {
    orderId: row.order_id,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      location: row.customer_location,
      notes: row.customer_notes || "",
    },
    payment: {
      method: row.payment_method,
      reference: row.payment_reference || "",
    },
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    items: JSON.parse(row.items_json),
  };
}

const insertOrderStmt = db.prepare(`
INSERT INTO orders (
  order_id,
  customer_name,
  customer_phone,
  customer_location,
  customer_notes,
  payment_method,
  payment_reference,
  subtotal,
  delivery_fee,
  total,
  status,
  created_at,
  items_json
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectOrdersStmt = db.prepare(`
SELECT * FROM orders
ORDER BY datetime(created_at) DESC
LIMIT ?
`);

const selectOrderByIdStmt = db.prepare(`SELECT * FROM orders WHERE order_id = ?`);
const updateOrderStatusStmt = db.prepare(`UPDATE orders SET status = ? WHERE order_id = ?`);

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const reportPathBlocked =
    url.pathname === "/santa_shepherds_water_report.html" ||
    url.pathname === "/santa_shepherds_water_report.js" ||
    url.pathname === "/santa_shepherds_water_report.md" ||
    url.pathname === "/santa_shepherds_water_report.ts";

  if (reportPathBlocked) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  if (method === "POST" && url.pathname === "/api/orders") {
    try {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw || "{}");
      const order = parseOrderInput(parsed);
      const orderId = `SSW-${Date.now().toString(36).toUpperCase()}`;

      insertOrderStmt.run(
        orderId,
        order.customerName,
        order.customerPhone,
        order.customerLocation,
        order.customerNotes,
        order.paymentMethod,
        order.paymentReference,
        Math.round(order.subtotal),
        Math.round(order.deliveryFee),
        Math.round(order.total),
        "pending",
        order.createdAt,
        JSON.stringify(order.items),
      );

      return sendJson(res, 201, { ok: true, orderId, status: "pending" });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Invalid JSON payload" });
    }
  }

  if (method === "GET" && url.pathname === "/api/orders") {
    try {
      const limitQuery = Number(url.searchParams.get("limit") || 100);
      const limit = Number.isFinite(limitQuery) ? Math.min(Math.max(limitQuery, 1), 500) : 100;
      const rows = selectOrdersStmt.all(limit);
      const orders = rows.map(mapOrderRow);
      return sendJson(res, 200, { count: orders.length, orders });
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: "Could not load orders" });
    }
  }

  if (method === "PATCH" && url.pathname.startsWith("/api/orders/") && url.pathname.endsWith("/status")) {
    try {
      const parts = url.pathname.split("/");
      const orderId = decodeURIComponent(parts[3] || "");
      if (!orderId) {
        return sendJson(res, 400, { ok: false, error: "Missing order ID" });
      }

      const raw = await readBody(req);
      const parsed = JSON.parse(raw || "{}");
      const status = String(parsed.status || "").trim().toLowerCase();

      if (!ALLOWED_STATUSES.has(status)) {
        return sendJson(res, 400, { ok: false, error: "Invalid status" });
      }

      const existing = selectOrderByIdStmt.get(orderId);
      if (!existing) {
        return sendJson(res, 404, { ok: false, error: "Order not found" });
      }

      updateOrderStatusStmt.run(status, orderId);
      return sendJson(res, 200, { ok: true, orderId, status });
    } catch (_error) {
      return sendJson(res, 400, { ok: false, error: "Invalid request" });
    }
  }

  if (method !== "GET" && method !== "HEAD") {
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = sanitizePathname(requested);
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    const type = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    if (method === "HEAD") {
      res.end();
    } else {
      res.end(data);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`SQLite DB: ${DB_PATH}`);
});
