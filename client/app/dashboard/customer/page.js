
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { useToast } from "../../components/ToastProvider";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

function formatDate(date) {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount) {
  return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
}

function statusStyle(status) {
  const value = String(status || "Pending").toLowerCase();

  if (
    ["paid", "confirmed", "completed", "approved"].includes(value)
  ) {
    return {
      color: "#16a34a",
      background: "rgba(22,163,74,0.12)",
    };
  }

  if (["failed", "cancelled", "rejected"].includes(value)) {
    return {
      color: "#dc2626",
      background: "rgba(220,38,38,0.12)",
    };
  }

  return {
    color: "#d97706",
    background: "rgba(217,119,6,0.12)",
  };
}

const cardStyle = {
  background: "var(--surface-card)",
  border: "1px solid var(--border)",
  borderRadius: "18px",
  padding: "24px",
};

const buttonStyle = {
  border: "none",
  borderRadius: "9px",
  padding: "10px 16px",
  background: "var(--accent)",
  color: "var(--accent-text)",
  fontWeight: "800",
  cursor: "pointer",
};

export default function CustomerDashboard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingError, setBookingError] = useState("");

  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState("");

  const [removingId, setRemovingId] = useState("");
  const [favoriteSearch, setFavoriteSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("All");

  const loadBookings = useCallback(async (authToken) => {
    setBookingsLoading(true);
    setBookingError("");

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await readResponse(response);

      const data = Array.isArray(result.data) ? result.data : [];

      setBookings(
        [...data].sort(
          (a, b) =>
            new Date(b.createdAt || b.startDate || 0).getTime() -
            new Date(a.createdAt || a.startDate || 0).getTime()
        )
      );
    } catch (error) {
      console.error("Booking loading error:", error);
      setBookingError(error.message || "Could not load your bookings.");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async (authToken) => {
    setFavoritesLoading(true);
    setFavoritesError("");

    try {
      const response = await fetch(
        `${API_URL}/api/favorites/my-favorites`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await readResponse(response);

      setFavorites(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Favorites loading error:", error);
      setFavoritesError(error.message || "Could not load favorites.");
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const savedToken =
          localStorage.getItem("equipora-token") ||
          localStorage.getItem("token");

        const savedUser = localStorage.getItem("equipora-user");

        if (!savedToken || !savedUser) {
          router.replace("/login");
          return;
        }

        const parsedUser = JSON.parse(savedUser);

        if (parsedUser.role !== "Customer") {
          if (parsedUser.role === "Admin") {
            router.replace("/dashboard/admin");
          } else if (parsedUser.role === "Owner") {
            router.replace("/dashboard/owner");
          } else {
            router.replace("/");
          }

          return;
        }

        setToken(savedToken);
        setUser(parsedUser);

        await Promise.all([
          loadBookings(savedToken),
          loadFavorites(savedToken),
        ]);
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        showToast("Could not load your account. Please login again.", "error");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router, loadBookings, loadFavorites, showToast]);

  const handleRemoveFavorite = async (equipmentId) => {
    if (!equipmentId || removingId) return;

    if (!token) {
      router.push("/login");
      return;
    }

    setRemovingId(equipmentId);

    try {
      const response = await fetch(
        `${API_URL}/api/favorites/${equipmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await readResponse(response);

      setFavorites((previous) =>
        previous.filter(
          (item) => item.equipmentId?._id !== equipmentId
        )
      );

      showToast("Removed from your favorites!", "success");
    } catch (error) {
      console.error("Remove favorite error:", error);
      showToast(error.message || "Failed to remove favorite.", "error");
    } finally {
      setRemovingId("");
    }
  };

  const filteredFavorites = favorites.filter((favorite) => {
    const equipment = favorite.equipmentId;

    if (!equipment) return false;

    const search = favoriteSearch.trim().toLowerCase();

    if (!search) return true;

    return (
      equipment.equipmentName?.toLowerCase().includes(search) ||
      equipment.category?.toLowerCase().includes(search) ||
      equipment.location?.toLowerCase().includes(search)
    );
  });

  const filteredBookings = bookings.filter((booking) => {
    if (bookingFilter === "All") return true;

    if (bookingFilter === "Paid") {
      return String(booking.paymentStatus || "").toLowerCase() === "paid";
    }

    if (bookingFilter === "Pending") {
      return String(booking.bookingStatus || "").toLowerCase() === "pending";
    }

    if (bookingFilter === "Completed") {
      return String(booking.bookingStatus || "").toLowerCase() === "completed";
    }

    return true;
  });

  const paidBookings = bookings.filter(
    (booking) =>
      String(booking.paymentStatus || "").toLowerCase() === "paid"
  );

  const totalSpent = paidBookings.reduce(
    (total, booking) => total + Number(booking.totalAmount || 0),
    0
  );

  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--background)",
          color: "var(--foreground)",
          fontWeight: "700",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <Navbar />

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "55px 20px",
        }}
      >
        {/* Dashboard Header */}
        <div style={{ marginBottom: "30px" }}>
          <span
            style={{
              color: "var(--accent-text)",
              background: "var(--accent)",
              padding: "8px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            CUSTOMER DASHBOARD
          </span>

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: "800",
              marginTop: "22px",
              marginBottom: "12px",
            }}
          >
            Welcome, {user.name}!
          </h1>

          <p style={{ color: "var(--muted)", lineHeight: "1.7" }}>
            Manage your rentals, favorites, and account information.
          </p>
        </div>

        {/* Dashboard Statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginBottom: "35px",
          }}
        >
          {[
            {
              label: "Total Bookings",
              value: bookings.length,
              icon: "📦",
            },
            {
              label: "Paid Bookings",
              value: paidBookings.length,
              icon: "✅",
            },
            {
              label: "Saved Favorites",
              value: favorites.length,
              icon: "❤️",
            },
            {
              label: "Total Spent",
              value: formatMoney(totalSpent),
              icon: "💳",
            },
          ].map((stat) => (
            <div key={stat.label} style={cardStyle}>
              <div style={{ fontSize: "25px", marginBottom: "12px" }}>
                {stat.icon}
              </div>

              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                {stat.label}
              </p>

              <h2
                style={{
                  fontSize: "clamp(20px, 3vw, 25px)",
                  fontWeight: "800",
                  overflowWrap: "anywhere",
                }}
              >
                {stat.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "15px",
            marginBottom: "35px",
          }}
        >
          {[
            {
              title: "Browse Equipment",
              description: "Find equipment to rent",
              href: "/equipment",
              icon: "🔍",
            },
            {
              title: "My Favorites",
              description: "View your saved equipment",
              href: "/wishlist",
              icon: "❤️",
            },
            {
              title: "My Profile",
              description: "Manage your account",
              href: "/profile",
              icon: "👤",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              style={{
                ...cardStyle,
                color: "var(--foreground)",
                textDecoration: "none",
                display: "block",
                transition: "border-color 0.2s ease",
              }}
            >
              <div style={{ fontSize: "27px", marginBottom: "12px" }}>
                {item.icon}
              </div>

              <h3 style={{ fontWeight: "800", marginBottom: "7px" }}>
                {item.title}
              </h3>

              <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Favorites Section */}
        <div style={{ ...cardStyle, marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "22px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "23px", fontWeight: "800" }}>
                ❤️ My Favorites
              </h2>

              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "13px",
                  marginTop: "5px",
                }}
              >
                Your saved equipment collection
              </p>
            </div>

            <span
              style={{
                padding: "7px 13px",
                borderRadius: "20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              {favorites.length} Saved
            </span>
          </div>

          {!favoritesLoading && favorites.length > 0 && (
            <input
              type="search"
              value={favoriteSearch}
              onChange={(event) => setFavoriteSearch(event.target.value)}
              placeholder="Search your favorites..."
              aria-label="Search favorites"
              style={{
                width: "100%",
                maxWidth: "380px",
                padding: "12px 15px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--foreground)",
                outline: "none",
                marginBottom: "20px",
              }}
            />
          )}

          {favoritesLoading ? (
            <p style={{ color: "var(--muted)" }}>
              Loading your favorites...
            </p>
          ) : favoritesError ? (
            <div>
              <p style={{ color: "#dc2626", marginBottom: "12px" }}>
                {favoritesError}
              </p>

              <button
                type="button"
                style={buttonStyle}
                onClick={() => loadFavorites(token)}
              >
                Try Again
              </button>
            </div>
          ) : favorites.length === 0 ? (
            <div style={{ textAlign: "center", padding: "35px 10px" }}>
              <p style={{ fontSize: "38px", marginBottom: "12px" }}>♡</p>

              <h3 style={{ fontWeight: "800", marginBottom: "8px" }}>
                No favorites yet
              </h3>

              <p style={{ color: "var(--muted)", marginBottom: "18px" }}>
                Explore equipment and save your favorites here.
              </p>

              <Link
                href="/equipment"
                style={{
                  ...buttonStyle,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                Browse Equipment →
              </Link>
            </div>
          ) : filteredFavorites.length === 0 ? (
            <p style={{ color: "var(--muted)", padding: "20px 0" }}>
              No favorites match your search.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "18px",
              }}
            >
              {filteredFavorites.map((favorite) => {
                const equipment = favorite.equipmentId;

                return (
                  <div
                    key={favorite._id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "15px",
                      overflow: "hidden",
                      background: "var(--surface)",
                      minWidth: 0,
                    }}
                  >
                    <img
                      src={equipment.imageUrl || "/placeholder.png"}
                      alt={equipment.equipmentName || "Equipment"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = "/placeholder.png";
                      }}
                      style={{
                        width: "100%",
                        height: "175px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    <div style={{ padding: "17px" }}>
                      <p
                        style={{
                          color: "var(--accent)",
                          fontSize: "11px",
                          fontWeight: "800",
                          marginBottom: "8px",
                        }}
                      >
                        {equipment.category || "Equipment"}
                      </p>

                      <h3
                        style={{
                          fontSize: "17px",
                          fontWeight: "800",
                          marginBottom: "9px",
                        }}
                      >
                        {equipment.equipmentName}
                      </h3>

                      <p
                        style={{
                          color: "var(--muted)",
                          fontSize: "13px",
                          marginBottom: "12px",
                        }}
                      >
                        📍 {equipment.location || "Location not available"}
                      </p>

                      <p
                        style={{
                          fontWeight: "800",
                          fontSize: "18px",
                          marginBottom: "16px",
                        }}
                      >
                        {formatMoney(equipment.rentalPrice)}
                        <span
                          style={{
                            color: "var(--muted)",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {" "}
                          / {equipment.rentalType || "Rental"}
                        </span>
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "9px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Link
                          href={`/equipment/${equipment._id}`}
                          style={{
                            ...buttonStyle,
                            flex: "1",
                            textAlign: "center",
                            textDecoration: "none",
                            fontSize: "12px",
                          }}
                        >
                          View Details →
                        </Link>

                        <button
                          type="button"
                          disabled={removingId === equipment._id}
                          onClick={() =>
                            handleRemoveFavorite(equipment._id)
                          }
                          style={{
                            padding: "10px 12px",
                            borderRadius: "9px",
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: "#dc2626",
                            fontWeight: "700",
                            cursor: "pointer",
                            opacity: removingId === equipment._id ? 0.6 : 1,
                          }}
                        >
                          {removingId === equipment._id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rentals Section */}
        <div style={{ ...cardStyle, marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "22px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "23px", fontWeight: "800" }}>
                My Rentals
              </h2>

              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "13px",
                  marginTop: "5px",
                }}
              >
                Your booking and payment history
              </p>
            </div>

            <span
              style={{
                padding: "7px 13px",
                borderRadius: "20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              {bookings.length} Bookings
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            {["All", "Paid", "Pending", "Completed"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setBookingFilter(filter)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  background:
                    bookingFilter === filter
                      ? "var(--accent)"
                      : "var(--surface)",
                  color:
                    bookingFilter === filter
                      ? "var(--accent-text)"
                      : "var(--foreground)",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {bookingsLoading ? (
            <p style={{ color: "var(--muted)" }}>
              Loading your rentals...
            </p>
          ) : bookingError ? (
            <div>
              <p style={{ color: "#dc2626", marginBottom: "12px" }}>
                {bookingError}
              </p>

              <button
                type="button"
                style={buttonStyle}
                onClick={() => loadBookings(token)}
              >
                Try Again
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "35px 10px" }}>
              <p style={{ fontSize: "35px", marginBottom: "12px" }}>📦</p>

              <h3 style={{ fontWeight: "800", marginBottom: "8px" }}>
                No rentals yet
              </h3>

              <p style={{ color: "var(--muted)", marginBottom: "18px" }}>
                Browse equipment and make your first booking.
              </p>

              <Link
                href="/equipment"
                style={{
                  ...buttonStyle,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                Browse Equipment →
              </Link>
            </div>
          ) : filteredBookings.length === 0 ? (
            <p style={{ color: "var(--muted)", padding: "20px 0" }}>
              No bookings found for this filter.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "720px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                      "Equipment",
                      "Rental Period",
                      "Booking Date",
                      "Amount",
                      "Payment",
                      "Booking Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "14px 12px",
                          color: "var(--muted)",
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking._id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td
                        style={{
                          padding: "16px 12px",
                          fontWeight: "700",
                        }}
                      >
                        {booking.equipmentId?.equipmentName || "Equipment"}
                      </td>

                      <td
                        style={{
                          padding: "16px 12px",
                          fontSize: "13px",
                        }}
                      >
                        {formatDate(booking.startDate)}
                        <br />
                        to {formatDate(booking.endDate)}
                      </td>

                      <td
                        style={{
                          padding: "16px 12px",
                          fontSize: "13px",
                        }}
                      >
                        {formatDate(booking.createdAt)}
                      </td>

                      <td
                        style={{
                          padding: "16px 12px",
                          fontWeight: "800",
                        }}
                      >
                        {formatMoney(booking.totalAmount)}
                      </td>

                      <td style={{ padding: "16px 12px" }}>
                        <span
                          style={{
                            ...statusStyle(booking.paymentStatus),
                            padding: "6px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "800",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {booking.paymentStatus || "Pending"}
                        </span>
                      </td>

                      <td style={{ padding: "16px 12px" }}>
                        <span
                          style={{
                            ...statusStyle(booking.bookingStatus),
                            padding: "6px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "800",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {booking.bookingStatus || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "800",
              marginBottom: "24px",
            }}
          >
            Account Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            <div>
              <p style={{ color: "var(--muted)", marginBottom: "8px" }}>
                Name
              </p>
              <strong>{user.name}</strong>
            </div>

            <div>
              <p style={{ color: "var(--muted)", marginBottom: "8px" }}>
                Email
              </p>
              <strong style={{ overflowWrap: "anywhere" }}>
                {user.email}
              </strong>
            </div>

            <div>
              <p style={{ color: "var(--muted)", marginBottom: "8px" }}>
                Role
              </p>
              <strong>{user.role}</strong>
            </div>
          </div>

          <div style={{ marginTop: "25px" }}>
            <Link
              href="/"
              style={{
                color: "var(--muted)",
                textDecoration: "none",
                fontWeight: "700",
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
