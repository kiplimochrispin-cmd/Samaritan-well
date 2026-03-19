import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top shell">
        <div>
          <p className="eyebrow">Need More Details?</p>
          <h3>Discuss bottle sizes, custom labelling, and bulk supply options with the team.</h3>
        </div>
        <Link className="btn" to="/contact">
          Request a Quote
        </Link>
      </div>
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
          <h3>Product Areas</h3>
          <ul>
            <li><a href="/#shop">PET Bottles</a></li>
            <li><a href="/#shop">Water Bottles</a></li>
            <li><a href="/#shop">Refill Containers</a></li>
            <li><a href="/#shop">Bulk Orders</a></li>
          </ul>
        </section>
        <section>
          <h3>Custom Work</h3>
          <ul>
            <li><Link to="/programs">Institution Supply</Link></li>
            <li><Link to="/contact">Custom Labelling</Link></li>
            <li><Link to="/contact">Wholesale Quotes</Link></li>
            <li><Link to="/contact">Delivery Planning</Link></li>
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
