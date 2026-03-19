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

export default function SiteShell({ children, ctaHref = "/", ctaLabel = "Home", admin = false }: SiteShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <header className="hero shell">
        <nav className="nav">
          <Link className="brand-lockup" to="/">
            <BottleMark />
            <span>
              <strong>{admin ? "Santa Shepherds Water Admin" : "Santa Shepherds Water"}</strong>
              <small>{admin ? "Orders and operations" : "Fresh delivery for homes and institutions"}</small>
            </span>
          </Link>

          <button className="menu-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            Menu
          </button>

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
