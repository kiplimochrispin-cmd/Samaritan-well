import { Link } from "react-router-dom";
import { PropsWithChildren, useState } from "react";

type SiteShellProps = PropsWithChildren<{
  ctaHref?: string;
  ctaLabel?: string;
  admin?: boolean;
}>;

function BottleMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <path d="M26 8h12v8l6 7v26c0 4-3 7-7 7H27c-4 0-7-3-7-7V23l6-7z" fill="currentColor" />
        <path d="M24 31c5 1 7 6 11 6s6-5 11-6v10c0 7-6 13-13 13s-13-6-13-13V31c1 0 3 0 4 0z" fill="#dff8ff" />
      </svg>
    </span>
  );
}

function SocialIcon({ label }: { label: string }) {
  return <span className="social-icon" aria-hidden="true">{label}</span>;
}

export default function SiteShell({ children, ctaHref = "/", ctaLabel = "Home", admin = false }: SiteShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <header className="hero">
        <div className="utility-bar">
          <div className="shell utility-inner">
            <p><strong>Working Hours:</strong> Monday - Friday: 8am to 5pm</p>
            <p><strong>Lipa Na M-Pesa:</strong> 309900</p>
            <p><strong>Contact:</strong> +254 722 207787, +254 733 207787</p>
            <a href="mailto:sales@santashepherdswater.co.ke">sales@santashepherdswater.co.ke</a>
          </div>
        </div>

        <div className="shell brand-band">
          <Link className="brand-lockup brand-lockup-large" to="/">
            <BottleMark />
            <span>
              <strong>{admin ? "Santa Shepherds Water Admin" : "Santa Shepherds Water"}</strong>
              <small>{admin ? "Orders and operations" : "Fresh delivery for homes and institutions"}</small>
            </span>
          </Link>

          <div className="brand-side">
            <div className="social-list" aria-label="Social links">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><SocialIcon label="f" /></a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X"><SocialIcon label="x" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><SocialIcon label="in" /></a>
              <a href="https://wa.me/254757674774" target="_blank" rel="noreferrer" aria-label="WhatsApp"><SocialIcon label="wa" /></a>
            </div>

            <button className="menu-toggle menu-toggle-icon" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              <span className="menu-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>

        <nav className="nav shell">
          <div className={`nav-links ${open ? "is-open" : ""}`}>
            <Link to="/" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/programs" onClick={() => setOpen(false)}>Programs</Link>
            <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
            <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>
            <Link className="btn btn-soft" to={ctaHref} onClick={() => setOpen(false)}>{ctaLabel}</Link>
          </div>
        </nav>
      </header>

      {children}
    </div>
  );
}
