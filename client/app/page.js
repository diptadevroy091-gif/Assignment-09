
import Link from "next/link";
import Navbar from "./components/Navbar";
import "./page.css";

const equipment = [
  {
    name: "Professional DSLR Camera",
    category: "Photography",
    price: "৳1,200",
    period: "/ day",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    tag: "POPULAR",
  },
  {
    name: "Heavy Duty Excavator",
    category: "Construction",
    price: "৳8,500",
    period: "/ day",
    image:
      "https://images.unsplash.com/photo-1580901368919-7738efb0f87e?w=800",
    tag: "AVAILABLE",
  },
  {
    name: "Modern Delivery Van",
    category: "Vehicles",
    price: "৳3,000",
    period: "/ day",
    image:
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800",
    tag: "POPULAR",
  },
];

const categories = [
  ["🏗️", "Construction", "Heavy machinery and tools"],
  ["📷", "Photography", "Cameras and studio gear"],
  ["🚚", "Vehicles", "Cars, vans and transport"],
  ["🌾", "Agriculture", "Farming equipment"],
  ["💻", "Electronics", "Modern electronic devices"],
  ["🎪", "Events", "Event and party equipment"],
];

export default function Home() {
  return (
    <main>
      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="live-dot"></span>
            THE SMARTER WAY TO RENT
          </div>

          <h1>
            Rent smarter.
            <br />
            <span>Work better.</span>
          </h1>

          <p>
            Find the right equipment for every project.
            Rent quality tools, machinery and technology
            without the cost of ownership.
          </p>

          <div className="hero-actions">
            <Link href="/equipment" className="primary-btn">
              Explore Equipment <span>↗</span>
            </Link>

            <Link href="/register" className="secondary-btn">
              Become an Owner
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <strong>500+</strong>
              <span>Equipment items</span>
            </div>
            <div>
              <strong>1,200+</strong>
              <span>Happy customers</span>
            </div>
            <div>
              <strong>50+</strong>
              <span>Locations</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image"></div>

          <div className="floating-card">
            <span className="floating-icon">✦</span>
            <div>
              <strong>Quality you can trust</strong>
              <small>Verified equipment owners</small>
            </div>
          </div>

          <div className="image-label">
            <span>01 / BUILT FOR YOUR NEXT PROJECT</span>
            <span>↗</span>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="trust-strip">
        <span>BUILT FOR EVERY INDUSTRY</span>
        <strong>CONSTRUCTION</strong>
        <strong>PHOTOGRAPHY</strong>
        <strong>TRANSPORT</strong>
        <strong>AGRICULTURE</strong>
      </section>

      {/* CATEGORIES */}
      <section className="section categories-section" id="categories">
        <div className="section-heading">
          <div>
            <span className="section-label">WHAT DO YOU NEED?</span>
            <h2>
              Explore by category<span>.</span>
            </h2>
          </div>

          <Link href="/equipment" className="text-link">
            View all categories ↗
          </Link>
        </div>

        <div className="category-grid">
          {categories.map(([icon, name, description]) => (
            <Link
              href={`/equipment?category=${encodeURIComponent(name)}`}
              className="category-card"
              key={name}
            >
              <span className="category-icon">{icon}</span>
              <h3>{name}</h3>
              <p>{description}</p>
              <span className="category-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED EQUIPMENT */}
      <section className="section equipment-section">
        <div className="section-heading">
          <div>
            <span className="section-label">HANDPICKED FOR YOU</span>
            <h2>
              Featured equipment<span>.</span>
            </h2>

            <p className="section-description">
              Discover quality equipment ready for your next big idea.
            </p>
          </div>

          <Link href="/equipment" className="text-link">
            Browse all equipment ↗
          </Link>
        </div>

        <div className="equipment-grid">
          {equipment.map((item) => (
            <article className="equipment-card" key={item.name}>
              <div
                className="equipment-image"
                style={{
                  backgroundImage: `url("${item.image}")`,
                }}
              >
                <span className="equipment-tag">{item.tag}</span>

                <button
                  className="favorite-btn"
                  type="button"
                  aria-label="Add to favorites"
                >
                  ♡
                </button>
              </div>

              <div className="equipment-info">
                <span className="equipment-category">
                  {item.category}
                </span>

                <h3>{item.name}</h3>

                <div className="equipment-bottom">
                  <div>
                    <strong>{item.price}</strong>
                    <span>{item.period}</span>
                  </div>

                  <Link href="/equipment" className="rent-btn">
                    Rent now ↗
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* WHY EQUIPORA */}
      <section className="why-section" id="about">
        <div className="why-content">
          <span className="section-label">WHY EQUIPORA?</span>

          <h2>
            Everything you need.
            <br />
            Nothing you don't.
          </h2>

          <p>
            We make equipment rental simple, transparent and
            accessible so you can focus on getting things done.
          </p>

          <Link href="/register" className="primary-btn">
            Start renting <span>↗</span>
          </Link>
        </div>

        <div className="benefits-grid">
          <div className="benefit">
            <span>✦</span>
            <h3>Verified Quality</h3>
            <p>
              Every listed item goes through an approval process.
            </p>
          </div>

          <div className="benefit">
            <span>◈</span>
            <h3>Fair Pricing</h3>
            <p>
              Transparent rental prices with no hidden surprises.
            </p>
          </div>

          <div className="benefit">
            <span>↗</span>
            <h3>Easy Booking</h3>
            <p>
              Find and book equipment in just a few simple steps.
            </p>
          </div>

          <div className="benefit">
            <span>◎</span>
            <h3>Trusted Owners</h3>
            <p>
              Connect with equipment owners in your area.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <span className="section-label">
          HAVE EQUIPMENT TO SHARE?
        </span>

        <h2>
          Turn your equipment
          <br />
          into opportunity<span>.</span>
        </h2>

        <p>
          List your equipment, reach more customers and earn from what you own.
        </p>

        <Link href="/register" className="dark-btn">
          Become an equipment owner ↗
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <Link href="/" className="brand footer-brand">
          <span className="brand-icon">E</span>
          <span>
            equipora<span className="brand-dot">.</span>
          </span>
        </Link>

        <p>Making equipment rental simple for everyone.</p>

        <span>© 2026 Equipora. All rights reserved.</span>
      </footer>
    </main>
  );
}

