import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";

type OrderStatus = "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";

type Order = {
  orderId: string;
  customer: {
    name: string;
    phone: string;
    location: string;
  };
  payment: {
    method: string;
    reference?: string;
  };
  items: Array<{ name: string; qty: number }>;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

const statuses: OrderStatus[] = ["pending", "confirmed", "dispatched", "delivered", "cancelled"];

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("Loading orders...");

  async function loadOrders() {
    setStatus("Loading orders...");
    try {
      const response = await fetch("/api/orders?limit=200");
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const payload = (await response.json()) as { orders?: Order[] };
      const nextOrders = Array.isArray(payload.orders) ? payload.orders : [];
      setOrders(nextOrders);
      setStatus(`Loaded ${nextOrders.length} order(s).`);
    } catch (error) {
      setStatus("Failed to load orders. Check server connection.");
      console.error(error);
    }
  }

  async function updateStatus(orderId: string, nextStatus: OrderStatus) {
    setStatus(`Updating ${orderId}...`);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error(`Failed to update status (${response.status})`);
      setStatus(`Updated ${orderId} to ${nextStatus}.`);
      await loadOrders();
    } catch (error) {
      setStatus(`Could not update ${orderId}.`);
      console.error(error);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    <>
      <SiteShell ctaHref="/" ctaLabel="Shop" admin />
      <main className="content shell">
        <section className="section surface">
          <div className="section-head">
            <p className="eyebrow">Operations</p>
            <h2>Orders Dashboard</h2>
            <p className="helper">{status}</p>
          </div>
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? orders.map((order) => (
                  <tr key={order.orderId}>
                    <td><strong>{order.orderId}</strong></td>
                    <td>{order.customer.name}<br /><small>{order.customer.phone}</small></td>
                    <td>{order.customer.location}</td>
                    <td>{order.items.map((item) => `${item.name} x ${item.qty}`).join(", ")}</td>
                    <td><strong>KES {Number(order.total).toLocaleString()}</strong></td>
                    <td>{order.payment.method}{order.payment.reference ? ` (${order.payment.reference})` : ""}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>{order.status}</span>
                      <select className="status-select" value={order.status} onChange={(event) => updateStatus(order.orderId, event.target.value as OrderStatus)}>
                        {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8}>No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
