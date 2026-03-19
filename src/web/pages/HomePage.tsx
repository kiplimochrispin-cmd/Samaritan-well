import { useMemo, useRef, useState } from "react";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import useHeroAnimation from "../hooks/useHeroAnimation";

type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
};

type PaymentMethod = "mpesa" | "card";

const products: Product[] = [
  { id: "p500", name: "500 ml PET Bottle", price: 35, unit: "per bottle" },
  { id: "p1500", name: "1.5 L PET Bottle", price: 90, unit: "per bottle" },
  { id: "p5", name: "5 L Family Container", price: 240, unit: "per container" },
  { id: "p10", name: "10 L Reusable Jerrycan", price: 430, unit: "per jerrycan" },
  { id: "p20", name: "20 L Returnable Jar", price: 700, unit: "per jar" }
];

const brandRefs = [
  { name: "Evian", summary: "Premium bottled water brand known for a clean, minimalist presentation style." },
  { name: "Aquafina", summary: "Widely recognized packaged water brand with mass-market retail visibility." },
  { name: "Dasani", summary: "Global bottled water label noted for strong supermarket and convenience distribution." },
  { name: "Nestle Pure Life", summary: "Household-oriented bottled water brand built around accessible daily hydration." }
];

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1, 10)}`;
  return digits ? `+${digits.slice(0, 12)}` : "";
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  useHeroAnimation(heroRef);

  const [quantities, setQuantities] = useState<Record<string, number>>(Object.fromEntries(products.map((product) => [product.id, 0])));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [status, setStatus] = useState("Add at least one item to place an order.");
  const [confirmation, setConfirmation] = useState<{ ref: string; message: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    notes: "",
    mpesaPhone: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: ""
  });

  const selectedItems = useMemo(() => {
    return products
      .filter((product) => quantities[product.id] > 0)
      .map((product) => ({
        id: product.id,
        name: product.name,
        qty: quantities[product.id],
        unitPrice: product.price
      }));
  }, [quantities]);

  const subtotal = useMemo(() => selectedItems.reduce((total, item) => total + item.unitPrice * item.qty, 0), [selectedItems]);
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 5000 ? 0 : subtotal >= 2000 ? 200 : 350;
  const total = subtotal + deliveryFee;

  function updateQuantity(id: string, value: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(0, value) }));
  }

  function updateForm<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItems.length) {
      setStatus("Please add at least one product before checkout.");
      return;
    }

    const phone = normalizePhone(form.phone);
    const mpesaPhone = normalizePhone(form.mpesaPhone || form.phone);

    if (form.name.trim().length < 3 || phone.length < 13 || form.location.trim().length < 4) {
      setStatus("Enter a valid full name, Kenyan phone number, and delivery location.");
      return;
    }

    if (paymentMethod === "mpesa" && mpesaPhone.length < 13) {
      setStatus("Enter a valid M-Pesa number in +254 format.");
      return;
    }

    if (
      paymentMethod === "card" &&
      (form.cardName.trim().length < 3 ||
        form.cardNumber.replace(/\s+/g, "").length < 16 ||
        form.cardExpiry.trim().length < 5 ||
        form.cardCvv.trim().length < 3)
    ) {
      setStatus("Complete the card details before placing the order.");
      return;
    }

    setStatus("Placing order...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            phone,
            location: form.location.trim(),
            notes: form.notes.trim()
          },
          payment: {
            method: paymentMethod,
            mpesaPhone: paymentMethod === "mpesa" ? mpesaPhone : "",
            cardLast4: paymentMethod === "card" ? form.cardNumber.replace(/\s+/g, "").slice(-4) : ""
          },
          items: selectedItems,
          subtotal,
          deliveryFee,
          total,
          createdAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || `Request failed (${response.status})`);
      }

      const result = (await response.json()) as { orderId: string };
      setConfirmation({
        ref: result.orderId,
        message:
          paymentMethod === "mpesa"
            ? `An M-Pesa prompt was sent to ${mpesaPhone}.`
            : `Card ending in ${form.cardNumber.replace(/\s+/g, "").slice(-4) || "****"} is queued for secure charge.`
      });
      setStatus(`Order placed. Reference: ${result.orderId}. We will call ${phone}.`);
      setQuantities(Object.fromEntries(products.map((product) => [product.id, 0])));
      setForm({
        name: "",
        phone: "",
        location: "",
        notes: "",
        mpesaPhone: "",
        cardName: "",
        cardNumber: "",
        cardExpiry: "",
        cardCvv: ""
      });
      setPaymentMethod("mpesa");
    } catch (error) {
      setStatus(`Could not place order: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return (
    <>
      <SiteShell ctaHref="/#shop" ctaLabel="Order Water" />
      <main className="content shell" ref={heroRef}>
        <section className="hero-inner hero-block">
          <section className="hero-copy surface">
            <p className="eyebrow anim-hero">Eldoret Water Access</p>
            <h1 className="anim-hero">Clean, dependable drinking water with a React and TypeScript frontend.</h1>
            <p className="lead anim-hero">
              The storefront now runs as a React + TypeScript application while keeping the local Node order API and SQLite storage behind it.
            </p>
            <div className="hero-actions anim-hero">
              <a className="btn" href="#shop">Start an Order</a>
              <a className="btn btn-soft" href="/contact">Talk to the Team</a>
            </div>
            <div className="hero-metrics">
              <article className="anim-card">
                <strong>React UI</strong>
                <span>Page content is now component-driven instead of hand-written per page.</span>
              </article>
              <article className="anim-card">
                <strong>Type-safe logic</strong>
                <span>Forms, totals, and API payloads are typed.</span>
              </article>
              <article className="anim-card">
                <strong>GSAP motion</strong>
                <span>Hero and card sections animate in on load.</span>
              </article>
            </div>
          </section>

          <aside className="hero-panel surface anim-card">
            <div className="bottle-badge" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img">
                <path d="M26 7h12v9l5 6v27c0 4-3 8-8 8H29c-5 0-8-4-8-8V22l5-6z" fill="currentColor" />
                <path d="M24 33c4 1 7 5 10 5 4 0 6-4 10-5v9c0 7-5 12-12 12s-12-5-12-12v-9c1 0 3 0 4 0z" fill="#d7f6ff" />
              </svg>
            </div>
            <p className="eyebrow">Quick Facts</p>
            <h2>Friendly on mobile, structured on desktop.</h2>
            <ul className="feature-list">
              <li>Component-based page layout in React</li>
              <li>Single frontend build served by the Node backend</li>
              <li>Shared navigation across all site pages</li>
              <li>Typed order flow and admin dashboard</li>
            </ul>
          </aside>
        </section>

        <section className="section surface anim-card">
          <div className="section-head">
            <p className="eyebrow">About Us</p>
            <h2>A calmer storefront with more logic in TypeScript than in static page files.</h2>
          </div>
          <div className="split-copy">
            <p>Santa Shepherds Water serves Eldoret with bottled drinking water and refill options for homes, schools, churches, clinics, and offices.</p>
            <p>The frontend now renders through React components, making it easier to extend the UX, maintain page consistency, and reuse shared logic.</p>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">Global Water Brands</p>
            <h2>Reference bottled-water companies used for market context.</h2>
          </div>
          <div className="brand-grid">
            {brandRefs.map((brand) => (
              <article key={brand.name} className="info-card anim-card">
                <p className="eyebrow">Reference Brand</p>
                <h3>{brand.name}</h3>
                <p>{brand.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="shop" className="section">
          <div className="section-head">
            <p className="eyebrow">Shop</p>
            <h2>Choose bottle and container sizes</h2>
          </div>
          <div className="products">
            {products.map((product) => (
              <article key={product.id} className="product-card anim-card">
                <h3>{product.name}</h3>
                <p className="price">KES {product.price.toLocaleString()} <span>{product.unit}</span></p>
                <div className="qty-row">
                  <label htmlFor={product.id}>Qty</label>
                  <input id={product.id} type="number" min={0} value={quantities[product.id]} onChange={(event) => updateQuantity(product.id, Number(event.target.value || 0))} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section checkout-wrap">
          <div className="checkout-panel surface anim-card">
            <div className="section-head">
              <p className="eyebrow">Checkout</p>
              <h2>Confirm your order</h2>
            </div>
            <form className="checkout-form" onSubmit={submitOrder}>
              <label>Full name<input value={form.name} onChange={(event) => updateForm("name", event.target.value)} /></label>
              <label>Phone number<input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="+254..." /></label>
              <label>Delivery location<input value={form.location} onChange={(event) => updateForm("location", event.target.value)} /></label>
              <label>Delivery notes<textarea rows={3} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Gate color, estate, nearest landmark..." /></label>
              <fieldset className="payment-group">
                <legend>Payment Method</legend>
                <label className="choice"><input type="radio" checked={paymentMethod === "mpesa"} onChange={() => setPaymentMethod("mpesa")} />M-Pesa STK Push</label>
                <label className="choice"><input type="radio" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />Debit/Credit Card</label>
              </fieldset>

              {paymentMethod === "mpesa" ? (
                <div className="payment-fields">
                  <label>M-Pesa Number<input value={form.mpesaPhone} onChange={(event) => updateForm("mpesaPhone", event.target.value)} placeholder="+254..." /></label>
                </div>
              ) : (
                <div className="payment-fields">
                  <label>Card holder name<input value={form.cardName} onChange={(event) => updateForm("cardName", event.target.value)} /></label>
                  <div className="card-grid">
                    <label>Card number<input value={form.cardNumber} onChange={(event) => updateForm("cardNumber", event.target.value)} placeholder="4242 4242 4242 4242" /></label>
                    <label>Expiry<input value={form.cardExpiry} onChange={(event) => updateForm("cardExpiry", event.target.value)} placeholder="08/28" /></label>
                    <label>CVV<input type="password" value={form.cardCvv} onChange={(event) => updateForm("cardCvv", event.target.value)} placeholder="123" /></label>
                  </div>
                </div>
              )}

              <button type="submit" className="btn">Place Order</button>
              <p className="helper">{status}</p>
            </form>

            {confirmation ? (
              <section className="confirmation">
                <p className="eyebrow">Order Received</p>
                <h3>Thank you. Your order is confirmed.</h3>
                <p>Reference: {confirmation.ref}</p>
                <p>{confirmation.message}</p>
              </section>
            ) : null}
          </div>

          <aside className="cart-panel surface anim-card">
            <h3>Order Summary</h3>
            <div className="cart-lines">
              {selectedItems.length ? selectedItems.map((item) => (
                <div className="cart-line" key={item.id}>
                  <span>{item.name} x {item.qty}</span>
                  <strong>KES {(item.unitPrice * item.qty).toLocaleString()}</strong>
                </div>
              )) : <p className="helper">No items selected.</p>}
            </div>
            <dl className="totals">
              <div><dt>Subtotal</dt><dd>KES {subtotal.toLocaleString()}</dd></div>
              <div><dt>Delivery</dt><dd>KES {deliveryFee.toLocaleString()}</dd></div>
              <div className="grand"><dt>Total</dt><dd>KES {total.toLocaleString()}</dd></div>
            </dl>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}
