import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { URL } from "node:url";

type PaymentMethod = "mpesa" | "card";
type OrderStatus = "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";

type OrderItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
};

type OrderPayload = {
  customer?: {
    name?: string;
    phone?: string;
    location?: string;
    notes?: string;
  };
  payment?: {
    method?: string;
    mpesaPhone?: string;
    cardLast4?: string;
  };
  items?: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  createdAt?: string;
};

type ParsedOrderInput = {
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  customerNotes: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
};

type OrderRow = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  customer_notes: string | null;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  items_json: string;
};

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
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

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".ts": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const ALLOWED_STATUSES = new Set<OrderStatus>([
  "pending",
  "confirmed",
  "dispatched",
  "delivered",
  "cancelled",
]);

function sendJson(
  res: http.ServerResponse<http.IncomingMessage>,
  statusCode: number,
  payload: unknown,
): void {
  res.writeHead(statusCode, { "Content-Type": MIME[".json"] });
  res.end(JSON.stringify(payload));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk: string) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error("Payload too large"));
      }
    });

    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sanitizePathname(pathname: string): string {
  const normalized = path.normalize(pathname).replace(/^\.+/, "");
  return normalized === path.sep ? "" : normalized;
}

function serveStaticFile(
  res: http.ServerResponse<http.IncomingMessage>,
  filePath: string,
  method: string,
): void {
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
}

function parseOrderInput(payload: OrderPayload): ParsedOrderInput {
  const customer = payload.customer || {};
  const payment = payload.payment || {};
  const items = Array.isArray(payload.items) ? payload.items : [];

  const paymentMethod = String(payment.method || "").trim().toLowerCase() as PaymentMethod;

  const normalized: ParsedOrderInput = {
    customerName: String(customer.name || "").trim(),
    customerPhone: String(customer.phone || "").trim(),
    customerLocation: String(customer.location || "").trim(),
    customerNotes: String(customer.notes || "").trim(),
    paymentMethod,
    paymentReference: String(payment.mpesaPhone || payment.cardLast4 || customer.phone || "")
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

function mapOrderRow(row: OrderRow) {
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
    items: JSON.parse(row.items_json) as OrderItem[],
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
      const parsed = JSON.parse(raw || "{}") as OrderPayload;
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
      const message = error instanceof Error ? error.message : "Invalid JSON payload";
      return sendJson(res, 400, { ok: false, error: message });
    }
  }

  if (method === "GET" && url.pathname === "/api/orders") {
    try {
      const limitQuery = Number(url.searchParams.get("limit") || 100);
      const limit = Number.isFinite(limitQuery) ? Math.min(Math.max(limitQuery, 1), 500) : 100;
      const rows = selectOrdersStmt.all(limit) as OrderRow[];
      const orders = rows.map(mapOrderRow);
      return sendJson(res, 200, { count: orders.length, orders });
    } catch (_error) {
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
      const parsed = JSON.parse(raw || "{}") as { status?: string };
      const status = String(parsed.status || "").trim().toLowerCase() as OrderStatus;

      if (!ALLOWED_STATUSES.has(status)) {
        return sendJson(res, 400, { ok: false, error: "Invalid status" });
      }

      const existing = selectOrderByIdStmt.get(orderId) as OrderRow | undefined;
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
  const filePath = path.join(DIST_DIR, safePath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveStaticFile(res, filePath, method);
      return;
    }

    serveStaticFile(res, path.join(DIST_DIR, "index.html"), method);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(`SQLite DB: ${DB_PATH}`);
});
