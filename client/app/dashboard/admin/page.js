
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function AdminDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const styles = {
    page: {
      minHeight: "100vh",
      background: "var(--background, #080808)",
      color: "var(--foreground, #ffffff)",
      padding: "35px 6%",
      fontFamily: "Arial, sans-serif",
    },
    card: {
      background: "var(--surface-card, #151515)",
      color: "var(--foreground, #ffffff)",
      border: "1px solid var(--border, #292929)",
      borderRadius: "14px",
      padding: "24px",
    },
    muted: { color: "var(--muted, #999999)" },
    accent: { color: "var(--accent-text, #c9f269)" },
    primaryButton: {
      background: "var(--accent, #c9f269)",
      color: "var(--accent-text, #080808)",
      border: "none",
      padding: "12px 22px",
      borderRadius: "8px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    sectionTitle: {
      fontSize: "26px",
      marginBottom: "20px",
      color: "var(--foreground, #ffffff)",
    },
  };

  // Fetch all equipment
  const fetchAllEquipment = useCallback(async (token) => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/equipment/admin/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load equipment.");
      }

      setEquipment(result.data || []);
    } catch (err) {
      setError(err.message || "Could not load equipment.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all bookings
  const fetchAllBookings = useCallback(async (token) => {
    if (!token) return;

    try {
      setBookingLoading(true);

      const response = await fetch(
        `${API_BASE}/api/bookings/admin/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load bookings.");
      }

      setBookings(result.data || []);
    } catch (err) {
      setError(err.message || "Could not load bookings.");
    } finally {
      setBookingLoading(false);
    }
  }, []);

  // Admin authentication
  useEffect(() => {
    const token = localStorage.getItem("equipora-token");
    const savedUser = localStorage.getItem("equipora-user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const currentUser = JSON.parse(savedUser);

      if (currentUser.role !== "Admin") {
        router.replace(
          currentUser.role === "Owner"
            ? "/dashboard/owner"
            : "/dashboard/customer"
        );
        return;
      }

      setUser(currentUser);
      fetchAllEquipment(token);
      fetchAllBookings(token);
    } catch {
      localStorage.removeItem("equipora-token");
      localStorage.removeItem("equipora-user");
      router.replace("/login");
    }
  }, [router, fetchAllEquipment, fetchAllBookings]);

  // Update equipment status
  const handleStatusUpdate = async (id, status) => {
    const token = localStorage.getItem("equipora-token");
    if (!token) return router.replace("/login");

    setUpdatingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/api/equipment/admin/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not update status.");
      }

      setMessage(result.message || `Equipment ${status} successfully!`);
      await fetchAllEquipment(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete only unpaid pending bookings
  const handleDeleteBooking = async (booking) => {
    if (
      booking.paymentStatus !== "Pending" ||
      booking.bookingStatus !== "Pending"
    ) {
      setError("Only unpaid pending bookings can be deleted.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this pending booking?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("equipora-token");
    if (!token) return router.replace("/login");

    setDeletingId(booking._id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/api/bookings/admin/${booking._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete booking.");
      }

      setMessage(result.message || "Pending booking deleted successfully!");
      await fetchAllBookings(token);
    } catch (err) {
      setError(err.message || "Booking deletion failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Approved" || status === "Paid" || status === "Confirmed") {
      return "#219653";
    }
    if (status === "Rejected" || status === "Failed" || status === "Cancelled") {
      return "#e05252";
    }
    return "#d69e22";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <main
          style={{
            minHeight: "100vh",
            background: "var(--background, #080808)",
            color: "var(--foreground, #ffffff)",
            display: "grid",
            placeItems: "center",
          }}
        >
          Loading Admin Dashboard...
        </main>
      </>
    );
  }

  const pendingCount = equipment.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedCount = equipment.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = equipment.filter(
    (item) => item.status === "Rejected"
  ).length;

  const pendingBookings = bookings.filter(
    (item) =>
      item.paymentStatus === "Pending" &&
      item.bookingStatus === "Pending"
  ).length;

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        {/* Welcome */}
        <section style={{ marginTop: "25px" }}>
          <p
            style={{
              ...styles.accent,
              letterSpacing: "2px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            ADMIN CONTROL CENTER
          </p>

          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", margin: "12px 0" }}>
            Welcome, {user.name || "Admin"}!
          </h1>

          <p style={{ ...styles.muted, lineHeight: 1.7 }}>
            Manage and monitor your Equipora platform from one place.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginTop: "30px",
            }}
          >
            <div style={styles.card}>
              <p style={styles.muted}>Account Type</p>
              <h2 style={styles.accent}>Administrator</h2>
            </div>

            <div style={styles.card}>
              <p style={styles.muted}>Admin Name</p>
              <h2>{user.name || "Admin"}</h2>
            </div>

            <div style={styles.card}>
              <p style={styles.muted}>Admin Email</p>
              <h3 style={{ overflowWrap: "anywhere" }}>{user.email}</h3>
            </div>
          </div>
        </section>

        {/* Global messages */}
        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "8px",
              background: "rgba(33,150,83,0.12)",
              color: "#219653",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "8px",
              background: "rgba(224,82,82,0.12)",
              color: "#e05252",
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </div>
        )}

        {/* Equipment Overview */}
        <section style={{ marginTop: "45px" }}>
          <h2 style={styles.sectionTitle}>Equipment Overview</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "18px",
            }}
          >
            {[
              ["Total Equipment", equipment.length, styles.accent],
              ["Pending", pendingCount, { color: "#d69e22" }],
              ["Approved", approvedCount, { color: "#219653" }],
              ["Rejected", rejectedCount, { color: "#e05252" }],
            ].map(([label, value, colorStyle]) => (
              <div key={label} style={styles.card}>
                <p style={styles.muted}>{label}</p>
                <h1 style={{ fontSize: "34px", ...colorStyle }}>{value}</h1>
              </div>
            ))}
          </div>
        </section>

        {/* Equipment Management */}
        <section style={{ marginTop: "45px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "22px",
            }}
          >
            <div>
              <h2 style={{ ...styles.sectionTitle, marginBottom: "8px" }}>
                Equipment Management
              </h2>
              <p style={{ ...styles.muted, margin: 0 }}>
                Review and manage equipment submitted by owners.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchAllEquipment(localStorage.getItem("equipora-token"))
              }
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
          </div>

          {loading ? (
            <div style={styles.card}>Loading equipment...</div>
          ) : equipment.length === 0 ? (
            <div style={styles.card}>No Equipment Submitted</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "22px",
              }}
            >
              {equipment.map((item) => (
                <article
                  key={item._id}
                  style={{ ...styles.card, padding: 0, overflow: "hidden" }}
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.equipmentName}
                      style={{
                        width: "100%",
                        height: "190px",
                        objectFit: "cover",
                      }}
                    />
                  )}

                  <div style={{ padding: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <span style={styles.accent}>{item.category}</span>
                      <strong style={{ color: getStatusColor(item.status) }}>
                        {item.status || "Pending"}
                      </strong>
                    </div>

                    <h3>{item.equipmentName}</h3>

                    <p style={{ ...styles.muted, fontSize: "13px", lineHeight: 1.6 }}>
                      {item.description}
                    </p>

                    <div
                      style={{
                        borderTop: "1px solid var(--border, #333)",
                        borderBottom: "1px solid var(--border, #333)",
                        padding: "12px 0",
                        margin: "15px 0",
                      }}
                    >
                      <p>Price: <strong style={styles.accent}>৳{item.rentalPrice}</strong> / {item.rentalType}</p>
                      <p style={styles.muted}>Location: {item.location}</p>
                      <p style={styles.muted}>Quantity: {item.availableQuantity}</p>
                      <p style={styles.muted}>Brand: {item.brand} {item.model}</p>
                      <p style={styles.muted}>Condition: {item.condition}</p>
                      <p style={styles.muted}>Owner: {item.ownerInfo?.name || "Unknown"}</p>
                      <p style={{ ...styles.muted, overflowWrap: "anywhere" }}>
                        Email: {item.ownerInfo?.email || "Unknown"}
                      </p>
                    </div>

                    <p style={{ ...styles.muted, fontSize: "13px", lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--foreground)" }}>
                        Rental Terms:
                      </strong>{" "}
                      {item.rentalTerms}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginTop: "20px",
                      }}
                    >
                      <button
                        type="button"
                        disabled={updatingId === item._id}
                        onClick={() => handleStatusUpdate(item._id, "Approved")}
                        style={{
                          background: "#219653",
                          color: "#fff",
                          border: "none",
                          borderRadius: "7px",
                          padding: "11px 8px",
                          cursor: "pointer",
                        }}
                      >
                        {updatingId === item._id ? "Updating..." : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === item._id}
                        onClick={() => handleStatusUpdate(item._id, "Rejected")}
                        style={{
                          background: "#e05252",
                          color: "#fff",
                          border: "none",
                          borderRadius: "7px",
                          padding: "11px 8px",
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </div>

                    {item.status !== "Pending" && (
                      <button
                        type="button"
                        disabled={updatingId === item._id}
                        onClick={() => handleStatusUpdate(item._id, "Pending")}
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          background: "transparent",
                          color: "var(--foreground)",
                          border: "1px solid var(--border, #444)",
                          borderRadius: "7px",
                          padding: "10px",
                          cursor: "pointer",
                        }}
                      >
                        Reset to Pending
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Booking Overview */}
        <section style={{ marginTop: "55px" }}>
          <h2 style={styles.sectionTitle}>Booking Overview</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "18px",
            }}
          >
            <div style={styles.card}>
              <p style={styles.muted}>Total Bookings</p>
              <h1 style={{ fontSize: "34px" }}>{bookings.length}</h1>
            </div>

            <div style={styles.card}>
              <p style={styles.muted}>Pending Bookings</p>
              <h1 style={{ color: "#d69e22", fontSize: "34px" }}>
                {pendingBookings}
              </h1>
            </div>

            <div style={styles.card}>
              <p style={styles.muted}>Paid Bookings</p>
              <h1 style={{ color: "#219653", fontSize: "34px" }}>
                {bookings.filter((item) => item.paymentStatus === "Paid").length}
              </h1>
            </div>
          </div>
        </section>

        {/* Booking Management */}
        <section style={{ marginTop: "35px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "22px",
            }}
          >
            <div>
              <h2 style={{ ...styles.sectionTitle, marginBottom: "8px" }}>
                Booking Management
              </h2>
              <p style={{ ...styles.muted, margin: 0 }}>
                View customer bookings and manage unpaid pending bookings.
              </p>
            </div>

            <button
              type="button"
              disabled={bookingLoading}
              onClick={() =>
                fetchAllBookings(localStorage.getItem("equipora-token"))
              }
              style={styles.primaryButton}
            >
              {bookingLoading ? "Refreshing..." : "Refresh Bookings"}
            </button>
          </div>

          {bookingLoading ? (
            <div style={styles.card}>Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div style={{ ...styles.card, textAlign: "center" }}>
              <h3>No Bookings Found</h3>
              <p style={styles.muted}>
                Customer bookings will appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "18px",
              }}
            >
              {bookings.map((booking) => {
                const canDelete =
                  booking.paymentStatus === "Pending" &&
                  booking.bookingStatus === "Pending";

                const equipmentName =
                  booking.equipmentId?.equipmentName || "Equipment unavailable";

                return (
                  <article key={booking._id} style={styles.card}>
                    <p style={styles.accent}>BOOKING DETAILS</p>

                    <h3 style={{ marginTop: "8px" }}>{equipmentName}</h3>

                    <div
                      style={{
                        borderTop: "1px solid var(--border, #333)",
                        borderBottom: "1px solid var(--border, #333)",
                        padding: "12px 0",
                        margin: "14px 0",
                        lineHeight: 1.8,
                      }}
                    >
                      <p>
                        Customer:{" "}
                        <strong>
                          {booking.customerInfo?.name || "Unknown"}
                        </strong>
                      </p>

                      <p style={{ ...styles.muted, overflowWrap: "anywhere" }}>
                        Email: {booking.customerInfo?.email || "N/A"}
                      </p>

                      <p>
                        Rental Period: {formatDate(booking.startDate)} to{" "}
                        {formatDate(booking.endDate)}
                      </p>

                      <p>Booking Date: {formatDate(booking.createdAt)}</p>
                      <p>Quantity: {booking.quantity || 1}</p>

                      <p>
                        Amount:{" "}
                        <strong style={styles.accent}>
                          ৳{Number(booking.totalAmount || 0).toLocaleString("en-BD")}
                        </strong>
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginBottom: "16px",
                      }}
                    >
                      <span
                        style={{
                          background: "var(--surface, #252525)",
                          padding: "7px 11px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          color: getStatusColor(booking.paymentStatus),
                        }}
                      >
                        Payment: {booking.paymentStatus || "Pending"}
                      </span>

                      <span
                        style={{
                          background: "var(--surface, #252525)",
                          padding: "7px 11px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          color: getStatusColor(booking.bookingStatus),
                        }}
                      >
                        Booking: {booking.bookingStatus || "Pending"}
                      </span>
                    </div>

                    {canDelete ? (
                      <button
                        type="button"
                        disabled={deletingId === booking._id}
                        onClick={() => handleDeleteBooking(booking)}
                        style={{
                          width: "100%",
                          background: "#e05252",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          opacity: deletingId === booking._id ? 0.6 : 1,
                        }}
                      >
                        {deletingId === booking._id
                          ? "Deleting..."
                          : "Delete Pending Booking"}
                      </button>
                    ) : (
                      <p
                        style={{
                          color: "#219653",
                          fontSize: "13px",
                          fontWeight: "bold",
                          marginBottom: 0,
                        }}
                      >
                        <span>Protected Booking — Cannot Delete</span>
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
