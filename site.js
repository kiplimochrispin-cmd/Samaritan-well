const products = [
  { id: "p500", name: "500 ml PET Bottle", price: 35, unit: "per bottle" },
  { id: "p1500", name: "1.5 L PET Bottle", price: 90, unit: "per bottle" },
  { id: "p5", name: "5 L Family Container", price: 240, unit: "per container" },
  { id: "p10", name: "10 L Reusable Jerrycan", price: 430, unit: "per jerrycan" },
  { id: "p20", name: "20 L Returnable Jar", price: 700, unit: "per jar" },
];

const quantities = Object.fromEntries(products.map((p) => [p.id, 0]));

const productsRoot = document.getElementById("products");
const cartLines = document.getElementById("cart-lines");
const subtotalEl = document.getElementById("subtotal");
const deliveryEl = document.getElementById("delivery");
const totalEl = document.getElementById("total");
const statusEl = document.getElementById("order-status");
const checkoutForm = document.getElementById("checkout-form");
const mpesaFields = document.getElementById("mpesa-fields");
const cardFields = document.getElementById("card-fields");
const confirmationPanel = document.getElementById("confirmation");
const confirmationRef = document.getElementById("confirmation-ref");
const confirmationMessage = document.getElementById("confirmation-message");
const newOrderBtn = document.getElementById("new-order-btn");
const paymentRadios = document.querySelectorAll("input[name='paymentMethod']");

const nameInput = checkoutForm.elements.name;
const phoneInput = checkoutForm.elements.phone;
const locationInput = checkoutForm.elements.location;
const mpesaPhoneInput = checkoutForm.elements.mpesaPhone;
const cardNameInput = checkoutForm.elements.cardName;
const cardNumberInput = checkoutForm.elements.cardNumber;
const cardExpiryInput = checkoutForm.elements.cardExpiry;
const cardCvvInput = checkoutForm.elements.cardCvv;

const formatKes = (value) => `KES ${value.toLocaleString()}`;

function ensureErrorNode(input) {
  const parent = input.parentElement;
  if (!parent) return null;
  let errorNode = parent.querySelector(".field-error");
  if (!errorNode) {
    errorNode = document.createElement("small");
    errorNode.className = "field-error";
    parent.appendChild(errorNode);
  }
  return errorNode;
}

function setFieldError(input, message) {
  const errorNode = ensureErrorNode(input);
  input.classList.toggle("input-error", Boolean(message));
  input.setCustomValidity(message || "");
  if (errorNode) errorNode.textContent = message || "";
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1, 10)}`;
  return `+${digits.slice(0, 12)}`;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateBaseFields() {
  let isValid = true;

  if (String(nameInput.value || "").trim().length < 3) {
    setFieldError(nameInput, "Enter at least 3 characters for full name.");
    isValid = false;
  } else {
    setFieldError(nameInput, "");
  }

  const normalizedPhone = normalizePhone(String(phoneInput.value || ""));
  phoneInput.value = normalizedPhone;
  if (!/^\+254\d{9}$/.test(normalizedPhone)) {
    setFieldError(phoneInput, "Use a valid Kenyan number, e.g. +254712345678.");
    isValid = false;
  } else {
    setFieldError(phoneInput, "");
  }

  if (String(locationInput.value || "").trim().length < 4) {
    setFieldError(locationInput, "Provide a detailed delivery location.");
    isValid = false;
  } else {
    setFieldError(locationInput, "");
  }

  return isValid;
}

function validatePaymentFields() {
  const method = document.querySelector("input[name='paymentMethod']:checked")?.value || "mpesa";
  let isValid = true;

  if (method === "mpesa") {
    const normalizedMpesa = normalizePhone(String(mpesaPhoneInput.value || phoneInput.value || ""));
    mpesaPhoneInput.value = normalizedMpesa;
    if (!/^\+254\d{9}$/.test(normalizedMpesa)) {
      setFieldError(mpesaPhoneInput, "Use a valid M-Pesa number in +254 format.");
      isValid = false;
    } else {
      setFieldError(mpesaPhoneInput, "");
    }

    setFieldError(cardNameInput, "");
    setFieldError(cardNumberInput, "");
    setFieldError(cardExpiryInput, "");
    setFieldError(cardCvvInput, "");
    return isValid;
  }

  if (String(cardNameInput.value || "").trim().length < 3) {
    setFieldError(cardNameInput, "Enter the name shown on the card.");
    isValid = false;
  } else {
    setFieldError(cardNameInput, "");
  }

  cardNumberInput.value = formatCardNumber(String(cardNumberInput.value || ""));
  if (!/^\d{4}(\s\d{4}){3}$/.test(cardNumberInput.value)) {
    setFieldError(cardNumberInput, "Card number must have 16 digits.");
    isValid = false;
  } else {
    setFieldError(cardNumberInput, "");
  }

  cardExpiryInput.value = formatExpiry(String(cardExpiryInput.value || ""));
  const expiryMatch = cardExpiryInput.value.match(/^(\d{2})\/(\d{2})$/);
  if (!expiryMatch) {
    setFieldError(cardExpiryInput, "Expiry must be MM/YY.");
    isValid = false;
  } else {
    const month = Number(expiryMatch[1]);
    if (month < 1 || month > 12) {
      setFieldError(cardExpiryInput, "Expiry month must be between 01 and 12.");
      isValid = false;
    } else {
      setFieldError(cardExpiryInput, "");
    }
  }

  cardCvvInput.value = String(cardCvvInput.value || "").replace(/\D/g, "").slice(0, 4);
  if (!/^\d{3,4}$/.test(cardCvvInput.value)) {
    setFieldError(cardCvvInput, "CVV must be 3 or 4 digits.");
    isValid = false;
  } else {
    setFieldError(cardCvvInput, "");
  }

  setFieldError(mpesaPhoneInput, "");
  return isValid;
}

function validateCheckoutForm() {
  const baseValid = validateBaseFields();
  const paymentValid = validatePaymentFields();
  return baseValid && paymentValid;
}

function renderProducts() {
  productsRoot.innerHTML = products
    .map(
      (p) => `
      <article class="product-card">
        <h3>${p.name}</h3>
        <p class="price">${formatKes(p.price)} <span>${p.unit}</span></p>
        <div class="qty-row">
          <label for="${p.id}">Qty</label>
          <input id="${p.id}" type="number" min="0" value="0" data-product-id="${p.id}" />
        </div>
      </article>
    `,
    )
    .join("");

  productsRoot.querySelectorAll("input[data-product-id]").forEach((el) => {
    el.addEventListener("input", (event) => {
      const input = event.currentTarget;
      const id = input.getAttribute("data-product-id");
      const value = Math.max(0, Number(input.value || 0));
      quantities[id] = Number.isFinite(value) ? value : 0;
      updateCart();
    });
  });
}

function getSubtotal() {
  return products.reduce((acc, p) => acc + p.price * quantities[p.id], 0);
}

function getDeliveryFee(subtotal) {
  if (subtotal === 0) return 0;
  if (subtotal >= 5000) return 0;
  if (subtotal >= 2000) return 200;
  return 350;
}

function updateCart() {
  const selected = products.filter((p) => quantities[p.id] > 0);
  const subtotal = getSubtotal();
  const delivery = getDeliveryFee(subtotal);
  const total = subtotal + delivery;

  if (selected.length === 0) {
    cartLines.innerHTML = '<p class="helper">No items selected.</p>';
  } else {
    cartLines.innerHTML = selected
      .map(
        (p) => `
        <div class="cart-line">
          <span>${p.name} x ${quantities[p.id]}</span>
          <strong>${formatKes(p.price * quantities[p.id])}</strong>
        </div>
      `,
      )
      .join("");
  }

  subtotalEl.textContent = formatKes(subtotal);
  deliveryEl.textContent = formatKes(delivery);
  totalEl.textContent = formatKes(total);
}

function setPaymentFieldRequirements(method) {
  const isMpesa = method === "mpesa";
  mpesaFields.classList.toggle("is-hidden", !isMpesa);
  cardFields.classList.toggle("is-hidden", isMpesa);

  mpesaPhoneInput.required = isMpesa;
  cardNameInput.required = !isMpesa;
  cardNumberInput.required = !isMpesa;
  cardExpiryInput.required = !isMpesa;
  cardCvvInput.required = !isMpesa;
}

function resetCart() {
  Object.keys(quantities).forEach((id) => {
    quantities[id] = 0;
    const input = document.querySelector(`[data-product-id="${id}"]`);
    if (input) input.value = "0";
  });
  updateCart();
}

async function submitOrder(event) {
  event.preventDefault();

  const items = products
    .filter((p) => quantities[p.id] > 0)
    .map((p) => ({ id: p.id, name: p.name, qty: quantities[p.id], unitPrice: p.price }));

  if (items.length === 0) {
    statusEl.textContent = "Please add at least one product before checkout.";
    return;
  }

  if (!validateCheckoutForm()) {
    statusEl.textContent = "Fix highlighted fields before placing the order.";
    checkoutForm.reportValidity();
    return;
  }

  const formData = new FormData(checkoutForm);
  const paymentMethod = String(formData.get("paymentMethod") || "mpesa");

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee(subtotal);

  const payload = {
    customer: {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    },
    payment: {
      method: paymentMethod,
      mpesaPhone: paymentMethod === "mpesa" ? String(formData.get("mpesaPhone") || "").trim() : "",
      cardLast4:
        paymentMethod === "card"
          ? String(formData.get("cardNumber") || "")
              .replace(/\s+/g, "")
              .slice(-4)
          : "",
    },
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    createdAt: new Date().toISOString(),
  };

  statusEl.textContent = "Placing order...";

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error || `Request failed (${response.status})`);
    }

    const result = await response.json();
    statusEl.textContent = `Order placed. Reference: ${result.orderId}. We will call ${payload.customer.phone}.`;
    confirmationRef.textContent = `Reference: ${result.orderId}`;
    confirmationMessage.textContent =
      paymentMethod === "mpesa"
        ? `An M-Pesa prompt was sent to ${payload.payment.mpesaPhone || payload.customer.phone}.`
        : `Card ending in ${payload.payment.cardLast4 || "****"} is queued for secure charge.`;

    confirmationPanel.classList.remove("is-hidden");
    checkoutForm.classList.add("is-hidden");
    checkoutForm.reset();
    setPaymentFieldRequirements("mpesa");
    resetCart();
  } catch (error) {
    statusEl.textContent = `Could not place order: ${error.message}`;
    console.error(error);
  }
}

paymentRadios.forEach((radio) => {
  radio.addEventListener("change", () => setPaymentFieldRequirements(radio.value));
});

phoneInput.addEventListener("input", () => {
  phoneInput.value = normalizePhone(phoneInput.value);
  validateBaseFields();
});

mpesaPhoneInput.addEventListener("input", () => {
  mpesaPhoneInput.value = normalizePhone(mpesaPhoneInput.value);
  validatePaymentFields();
});

cardNumberInput.addEventListener("input", () => {
  cardNumberInput.value = formatCardNumber(cardNumberInput.value);
  validatePaymentFields();
});

cardExpiryInput.addEventListener("input", () => {
  cardExpiryInput.value = formatExpiry(cardExpiryInput.value);
  validatePaymentFields();
});

cardCvvInput.addEventListener("input", () => {
  cardCvvInput.value = cardCvvInput.value.replace(/\D/g, "").slice(0, 4);
  validatePaymentFields();
});

[nameInput, locationInput, cardNameInput].forEach((input) => {
  input.addEventListener("blur", () => {
    validateBaseFields();
    validatePaymentFields();
  });
});

newOrderBtn.addEventListener("click", () => {
  confirmationPanel.classList.add("is-hidden");
  checkoutForm.classList.remove("is-hidden");
  statusEl.textContent = "Add at least one item to place an order.";
});

renderProducts();
updateCart();
setPaymentFieldRequirements("mpesa");
checkoutForm.addEventListener("submit", submitOrder);
