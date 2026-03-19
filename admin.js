const bodyEl = document.getElementById("orders-body");
const statusEl = document.getElementById("admin-status");
const refreshBtn = document.getElementById("refresh-orders");

const statusOptions = ["pending", "confirmed", "dispatched", "delivered", "cancelled"];

const formatKes = (value) => `KES ${Number(value || 0).toLocaleString()}`;

function renderItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "-";
  return items.map((item) => `${item.name} x ${item.qty}`).join(", ");
}

function statusBadge(status) {
  return `<span class="status-badge status-${status}">${status}</span>`;
}

async function updateStatus(orderId, status) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update status (${response.status})`);
  }
}

function renderOrders(orders) {
  if (!orders.length) {
    bodyEl.innerHTML = `<tr><td colspan="8">No orders yet.</td></tr>`;
    return;
  }

  bodyEl.innerHTML = orders
    .map((order) => {
      const paymentRef = order.payment?.reference ? ` (${order.payment.reference})` : "";
      return `
        <tr>
          <td><strong>${order.orderId}</strong></td>
          <td>
            ${order.customer.name}<br />
            <small>${order.customer.phone}</small>
          </td>
          <td>${order.customer.location}</td>
          <td>${renderItems(order.items)}</td>
          <td><strong>${formatKes(order.total)}</strong></td>
          <td>${order.payment.method}${paymentRef}</td>
          <td>
            ${statusBadge(order.status)}
            <select data-order-id="${order.orderId}" class="status-select">
              ${statusOptions
                .map((s) => `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`)
                .join("")}
            </select>
          </td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
        </tr>
      `;
    })
    .join("");

  bodyEl.querySelectorAll(".status-select").forEach((selectEl) => {
    selectEl.addEventListener("change", async () => {
      const orderId = selectEl.getAttribute("data-order-id");
      const nextStatus = selectEl.value;
      statusEl.textContent = `Updating ${orderId}...`;
      try {
        await updateStatus(orderId, nextStatus);
        statusEl.textContent = `Updated ${orderId} to ${nextStatus}.`;
        await loadOrders();
      } catch (error) {
        statusEl.textContent = `Could not update ${orderId}.`;
        console.error(error);
      }
    });
  });
}

async function loadOrders() {
  statusEl.textContent = "Loading orders...";

  try {
    const response = await fetch("/api/orders?limit=200");
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const result = await response.json();
    const orders = Array.isArray(result.orders) ? result.orders : [];
    renderOrders(orders);
    statusEl.textContent = `Loaded ${orders.length} order(s).`;
  } catch (error) {
    bodyEl.innerHTML = `<tr><td colspan="8">Could not load orders.</td></tr>`;
    statusEl.textContent = "Failed to load orders. Check server connection.";
    console.error(error);
  }
}

refreshBtn.addEventListener("click", loadOrders);
loadOrders();
