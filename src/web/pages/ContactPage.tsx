import { useRef } from "react";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import useHeroAnimation from "../hooks/useHeroAnimation";

export default function ContactPage() {
  const ref = useRef<HTMLElement>(null);
  useHeroAnimation(ref);

  return (
    <>
      <SiteShell ctaHref="/" ctaLabel="Home" />
      <main className="content shell" ref={ref}>
        <section className="hero-inner compact-hero">
          <section className="surface anim-hero">
            <p className="eyebrow">Contact</p>
            <h1>Reach the Santa Shepherds Water team without friction.</h1>
            <p className="lead">Use the contacts below for orders, institutional supply questions, refill schedules, and direct delivery coordination.</p>
          </section>
          <aside className="hero-panel surface anim-card">
            <div className="bottle-badge" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img">
                <path d="M26 7h12v9l5 6v27c0 4-3 8-8 8H29c-5 0-8-4-8-8V22l5-6z" fill="currentColor" />
                <path d="M24 33c4 1 7 5 10 5 4 0 6-4 10-5v9c0 7-5 12-12 12s-12-5-12-12v-9c1 0 3 0 4 0z" fill="#d7f6ff" />
              </svg>
            </div>
            <h2>Primary Channels</h2>
            <ul className="feature-list">
              <li>Phone: +254-532063981</li>
              <li>WhatsApp: +254 757 674774</li>
              <li>Hours: Mon-Sat, 8:00-18:00</li>
              <li>City: Eldoret, Kenya</li>
            </ul>
          </aside>
        </section>

        <section className="section section-grid">
          <article className="info-card anim-card">
            <p className="eyebrow">Office Address</p>
            <h3>Delivery Coordination Desk</h3>
            <ul>
              <li>Malaba Rd, 842-30100</li>
              <li>Eldoret, Kenya</li>
              <li>Coverage: Eldoret and nearby wards</li>
            </ul>
          </article>
          <article className="info-card anim-card">
            <p className="eyebrow">Need Help Fast?</p>
            <h3>Best Ways to Reach Us</h3>
            <p>Call for immediate delivery questions and use WhatsApp for follow-up directions.</p>
            <p>For larger orders, prepare your location, quantity, and preferred delivery time.</p>
          </article>
          <article className="info-card anim-card">
            <p className="eyebrow">Support Topics</p>
            <h3>What We Can Help With</h3>
            <ul>
              <li>Home and office water orders</li>
              <li>School and clinic supply plans</li>
              <li>Bulk bottle and jar requests</li>
              <li>Routing and delivery follow-up</li>
            </ul>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
