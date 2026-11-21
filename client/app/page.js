
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "./components/Navbar";
import { useToast } from "./components/ToastProvider";
import "./page.css";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const categories = [
  ["🏗️", "Construction", "Heavy machinery and tools"],
  ["📷", "Photography", "Cameras and studio gear"],
  ["🚚", "Vehicles", "Cars, vans and transport"],
  ["🌾", "Agriculture", "Farming equipment"],
  ["💻", "Electronics", "Modern electronic devices"],
  ["🎪", "Events", "Event and party equipment"],
];

const reviews = [
  {
    id: 1,
    name: "Rahim Ahmed",
    role: "Construction Business Owner",
    rating: 5,
    comment:
      "Equipora made it easy to find quality construction equipment. The booking process was simple and smooth.",
  },
  {
    id: 2,
    name: "Sadia Islam",
    role: "Photographer",
    rating: 5,
    comment:
      "I found the camera equipment I needed at a reasonable price. A really convenient rental platform!",
  },
  {
    id: 3,
    name: "Tanvir Hasan",
    role: "Event Organizer",
    rating: 4,
    comment:
      "Great platform for finding event equipment. The overall experience was easy and convenient.",
  },
  {
    id: 4,
    name: "Nusrat Jahan",
    role: "Small Business Owner",
    rating: 5,
    comment:
      "Equipora saves both time and money. I can rent the equipment I need without purchasing everything.",
  },
];

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();

  const [equipment, setEquipment] = useState([]);
  const [totalEquipment, setTotalEquipment] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState([]);

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("equipora-token") ||
      localStorage.getItem("token")
    );
  };

  // LOAD APPROVED EQUIPMENT AND USER FAVORITES
  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      try {
        // Load approved equipment
        const equipmentResponse = await fetch(
          `${API_URL}/api/equipment`
        );

        const equipmentResult = await equipmentResponse.json();

        if (!equipmentResponse.ok) {
          throw new Error(
            equipmentResult.message || "Failed to load equipment"
          );
        }

        if (active) {
          const equipmentData = Array.isArray(equipmentResult.data)
            ? equipmentResult.data
            : [];

          setEquipment(equipmentData.slice(0, 6));

          // Use the actual total returned by the API.
          const actualTotal = Number(equipmentResult.total);

          setTotalEquipment(
            Number.isFinite(actualTotal) && actualTotal >= 0
              ? actualTotal
              : equipmentData.length
          );
        }

        // Load logged-in user
        const savedUser = localStorage.getItem("equipora-user");
        const user = savedUser ? JSON.parse(savedUser) : null;

        if (active) {
          setCurrentUser(user);
          setAuthLoaded(true);
        }

        // Load favorites from MongoDB
        const token = getToken();

        if (token && user?.role === "Customer") {
          const favoriteResponse = await fetch(
            `${API_URL}/api/favorites/my-favorites`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const favoriteResult = await favoriteResponse.json();

          if (favoriteResponse.ok && active) {
            const favoriteIds = (
              Array.isArray(favoriteResult.data)
                ? favoriteResult.data
                : []
            )
              .map((favorite) => {
                const equipmentItem = favorite.equipmentId;

                return typeof equipmentItem === "object"
                  ? equipmentItem?._id
                  : equipmentItem;
              })
              .filter(Boolean)
              .map(String);

            setFavorites(favoriteIds);
          }
        }
      } catch (error) {
        console.error("Home page loading error:", error);

        if (active) {
          showToast(
            "Could not load equipment. Please refresh the page.",
            "error"
          );
        }
      } finally {
        if (active) {
          setEquipmentLoading(false);
        }
      }
    };

    loadHomeData();

    const handleAuthChange = () => {
      loadHomeData();
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener(
      "equipora-auth-changed",
      handleAuthChange
    );

    return () => {
      active = false;

      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener(
        "equipora-auth-changed",
        handleAuthChange
      );
    };
  }, [showToast]);

  // GUEST AND CUSTOMER CAN SEE FAVORITE BUTTON
  const canSeeWishlist =
    authLoaded &&
    (!currentUser || currentUser.role === "Customer");

  // ADD OR REMOVE FAVORITE USING MONGODB
  const handleFavorite = async (item) => {
    const token = getToken();
    const savedUser = localStorage.getItem("equipora-user");

    if (!token || !savedUser) {
      showToast(
        "Please login first to add equipment to your favorites.",
        "info"
      );

      router.push("/login");
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch {
      showToast("Your session is invalid. Please login again.", "error");
      router.push("/login");
      return;
    }

    if (user?.role !== "Customer") {
      showToast(
        "Wishlist is available for Customer accounts only.",
        "info"
      );
      return;
    }

    if (!item?._id) {
      showToast("Equipment information is missing.", "error");
      return;
    }

    const equipmentId = String(item._id);

    if (processingIds.includes(equipmentId)) return;

    setProcessingIds((previous) => [...previous, equipmentId]);

    const alreadyFavorite = favorites.includes(equipmentId);

    try {
      let response;

      if (alreadyFavorite) {
        response = await fetch(
          `${API_URL}/api/favorites/${equipmentId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await fetch(
          `${API_URL}/api/favorites`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ equipmentId }),
          }
        );
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not update favorites."
        );
      }

      if (alreadyFavorite) {
        setFavorites((previous) =>
          previous.filter((id) => id !== equipmentId)
        );

        showToast(
          `${item.equipmentName} removed from favorites.`,
          "success"
        );
      } else {
        setFavorites((previous) => [...previous, equipmentId]);

        showToast(
          `${item.equipmentName} added to favorites!`,
          "success"
        );
      }
    } catch (error) {
      showToast(error.message || "Something went wrong.", "error");
    } finally {
      setProcessingIds((previous) =>
        previous.filter((id) => id !== equipmentId)
      );
    }
  };

  // BECOME AN OWNER
  const handleBecomeOwner = () => {
    const token = getToken();
    const savedUser = localStorage.getItem("equipora-user");

    if (!token || !savedUser) {
      showToast(
        "Please login first to become an equipment owner.",
        "info"
      );

      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.role === "Owner") {
        showToast(
          "You are already logged in as an Owner!",
          "success"
        );

        router.push("/dashboard/owner");
        return;
      }

      if (user.role === "Admin") {
        showToast(
          "You are logged in as Admin. Logout first to continue as an Owner.",
          "info"
        );
        return;
      }

      showToast(
        "You are already logged in as a Customer. Logout first to register as an Owner.",
        "info"
      );
    } catch {
      showToast(
        "Your login session is invalid. Please login again.",
        "error"
      );

      router.push("/login");
    }
  };

  return (
    <main>
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

            <button
              type="button"
              className="secondary-btn"
              onClick={handleBecomeOwner}
            >
              Become an Owner
            </button>
          </div>

          {/* REAL PLATFORM INFORMATION */}
          <div className="hero-stats">
            <div>
              <strong>
                {equipmentLoading
                  ? "—"
                  : totalEquipment === null
                    ? "0"
                    : totalEquipment.toLocaleString("en-BD")}
              </strong>
              <span>Equipment listings</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Platform user roles</span>
            </div>

            <div>
              <strong>Online</strong>
              <span>Payment support</span>
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
      <section
        className="section categories-section"
        id="categories"
      >
        <div className="section-heading">
          <div>
            <span className="section-label">
              WHAT DO YOU NEED?
            </span>

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
            <span className="section-label">
              HANDPICKED FOR YOU
            </span>

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
          {equipmentLoading ? (
            <p>Loading equipment...</p>
          ) : equipment.length === 0 ? (
            <p>No approved equipment available right now.</p>
          ) : (
            equipment.map((item) => {
              const equipmentId = String(item._id);
              const isFavorite = favorites.includes(equipmentId);
              const isProcessing = processingIds.includes(equipmentId);

              return (
                <article
                  className="equipment-card"
                  key={equipmentId}
                >
                  <div
                    className="equipment-image"
                    style={{
                      backgroundImage: `url("${item.imageUrl}")`,
                    }}
                  >
                    <span className="equipment-tag">
                      {item.availableQuantity > 0
                        ? "AVAILABLE"
                        : "UNAVAILABLE"}
                    </span>

                    {canSeeWishlist && (
                      <button
                        type="button"
                        className="favorite-btn"
                        onClick={() => handleFavorite(item)}
                        disabled={isProcessing}
                        aria-label={
                          isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                        aria-pressed={isFavorite}
                        title={
                          isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                        style={{
                          color: isFavorite ? "#ef4444" : "#171717",
                          opacity: isProcessing ? 0.5 : 1,
                        }}
                      >
                        {isFavorite ? "♥" : "♡"}
                      </button>
                    )}
                  </div>

                  <div className="equipment-info">
                    <span className="equipment-category">
                      {item.category}
                    </span>

                    <h3>{item.equipmentName}</h3>

                    <div className="equipment-bottom">
                      <div>
                        <strong>
                          ৳
                          {Number(item.rentalPrice || 0).toLocaleString(
                            "en-BD"
                          )}
                        </strong>

                        <span>
                          / {item.rentalType || "day"}
                        </span>
                      </div>

                      <Link
                        href={`/equipment/${equipmentId}`}
                        className="rent-btn"
                      >
                        View Details ↗
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* WHY EQUIPORA */}
      <section className="why-section" id="about">
        <div className="why-content">
          <span className="section-label">
            WHY EQUIPORA?
          </span>

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

      {/* CUSTOMER REVIEWS */}
      <section
        className="section"
        id="reviews"
        style={{
          paddingTop: "100px",
          paddingBottom: "100px",
        }}
      >
        <div className="section-heading">
          <div>
            <span className="section-label">
              CUSTOMER EXPERIENCES
            </span>

            <h2>
              What our customers say<span>.</span>
            </h2>

            <p className="section-description">
              Discover what people think about renting with Equipora.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "24px",
            marginTop: "40px",
          }}
        >
          {reviews.map((review) => (
            <article
              key={review.id}
              style={{
                padding: "28px",
                border: "1px solid var(--border-color, #333)",
                borderRadius: "16px",
                background: "var(--card-bg, #151515)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div
                style={{
                  color: "#f5b942",
                  fontSize: "20px",
                  letterSpacing: "3px",
                }}
                aria-label={`${review.rating} out of 5 stars`}
              >
                {"★".repeat(review.rating)}

                <span style={{ color: "#777" }}>
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>

              <p
                style={{
                  lineHeight: 1.8,
                  color: "var(--text-secondary, #aaa)",
                  flex: 1,
                }}
              >
                "{review.comment}"
              </p>

              <div
                style={{
                  borderTop: "1px solid var(--border-color, #333)",
                  paddingTop: "16px",
                }}
              >
                <h3 style={{ marginBottom: "5px" }}>
                  {review.name}
                </h3>

                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary, #999)",
                  }}
                >
                  {review.role}
                </span>
              </div>
            </article>
          ))}
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

        <button
          type="button"
          className="dark-btn"
          onClick={handleBecomeOwner}
        >
          Become an equipment owner ↗
        </button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <Link href="/" className="brand footer-brand">
          <span className="brand-icon">E</span>

          <span>
            equipora<span className="brand-dot">.</span>
          </span>
        </Link>

        <p>
          Making equipment rental simple for everyone.
        </p>

        <span>
          © 2026 Equipora. All rights reserved.
        </span>
      </footer>
    </main>
  );
}
