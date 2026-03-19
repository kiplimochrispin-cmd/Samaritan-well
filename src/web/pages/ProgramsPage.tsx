import { useRef } from "react";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import useHeroAnimation from "../hooks/useHeroAnimation";

export default function ProgramsPage() {
  const ref = useRef<HTMLElement>(null);
  useHeroAnimation(ref);

  return (
    <>
      <SiteShell ctaHref="/" ctaLabel="Home" />
      <main className="content shell" ref={ref}>
        <section className="hero-inner compact-hero">
          <section className="surface anim-hero">
            <p className="eyebrow">Programs</p>
            <h1>Water support programs built for real local needs.</h1>
            <p className="lead">These service tracks help Santa Shepherds Water support households, institutions, and community-based response needs across Eldoret.</p>
          </section>
          <aside className="hero-panel surface anim-card">
            <div className="bottle-badge" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img">
                <path d="M26 7h12v9l5 6v27c0 4-3 8-8 8H29c-5 0-8-4-8-8V22l5-6z" fill="currentColor" />
                <path d="M24 33c4 1 7 5 10 5 4 0 6-4 10-5v9c0 7-5 12-12 12s-12-5-12-12v-9c1 0 3 0 4 0z" fill="#d7f6ff" />
              </svg>
            </div>
            <h2>Program Pillars</h2>
            <ul className="feature-list">
              <li>Household access and refill continuity</li>
              <li>School and clinic water support</li>
              <li>Emergency response distribution</li>
              <li>Safe storage and hygiene awareness</li>
            </ul>
          </aside>
        </section>

        <section className="section section-grid">
          <article className="info-card anim-card">
            <p className="eyebrow">Program 1</p>
            <h3>Household Water Access</h3>
            <p>Supports routine home delivery and refill cycles for families that need reliable access to safe drinking water.</p>
          </article>
          <article className="info-card anim-card">
            <p className="eyebrow">Program 2</p>
            <h3>Schools and Clinics Supply</h3>
            <p>Helps institutions maintain steady bottled water and jar supply for learners, patients, staff, and visitors.</p>
          </article>
          <article className="info-card anim-card">
            <p className="eyebrow">Program 3</p>
            <h3>Emergency Response Support</h3>
            <p>Creates a practical channel for short-notice distribution during urgent shortages and community response periods.</p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
