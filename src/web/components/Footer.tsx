import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid shell">
        <section>
          <h3>Santa Shepherds Water</h3>
          <p>React + TypeScript storefront for bottled water delivery, refill orders, and local support in Eldoret.</p>
        </section>
        <section>
          <h3>Explore</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/programs">Programs</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/admin">Admin</Link></li>
          </ul>
        </section>
        <section>
          <h3>Contact</h3>
          <ul>
            <li>Malaba Rd, Eldoret, Kenya</li>
            <li>Phone: +254-532063981</li>
            <li>WhatsApp: +254 757 674774</li>
          </ul>
        </section>
      </div>
      <p className="copyright">&copy; 2026 Santa Shepherds Water Initiative.</p>
    </footer>
  );
}
