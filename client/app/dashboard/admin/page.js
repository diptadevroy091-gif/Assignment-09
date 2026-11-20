
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
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Theme-aware styles
  const styles = {
    page: {
      minHeight: "100vh",
      background: "var(--background, #080808)",
      color: "var(--foreground, #ffffff)",
      padding: "35px 6%",
      fontFamily: "Arial, sans-serif",
      transition: "background 0.25s ease, color 0.25s ease",
    },

    card: {
      background: "var(--surface-card, #151515)",
      color: "var(--foreground, #ffffff)",
      border: "1px solid var(--border, #292929)",
      borderRadius: "14px",
      padding: "24px",
    },

    muted: {
      color: "var(--muted, #999999)",
    },

    accent: {
      color: "var(--accent-text, #c9f269)",
    },

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
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/equipment/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not load equipment."
        );
      }

      setEquipment(result.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin authentication and role checking
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
        if (currentUser.role === "Owner") {
          router.replace("/dashboard/owner");
        } else {
          router.replace("/dashboard/customer");
        }
        return;
      }

      setUser(currentUser);
      fetchAllEquipment(token);
    } catch (err) {
      localStorage.removeItem("equipora-token");
      localStorage.removeItem("equipora-user");
      router.replace("/login");
    }
  }, [router, fetchAllEquipment]);

  // Update equipment status
  const handleStatusUpdate = async (id, status) => {
    const token = localStorage.getItem("equipora-token");

    if (!token) {
      router.replace("/login");
      return;
    }

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
        throw new Error(
          result.message || "Could not update equipment status."
        );
      }

      setMessage(
        result.message ||
          `Equipment ${status.toLowerCase()} successfully!`
      );

      await fetchAllEquipment(token);
    } catch (err) {
      setError(err.message || "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Status colors
  const getStatusColor = (status) => {
    if (status === "Approved") return "#219653";
    if (status === "Rejected") return "#e05252";
    return "#d69e22";
  };

  // Loading screen
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
            fontFamily: "Arial, sans-serif",
          }}
        >
          Loading Admin Dashboard...
        </main>
      </>
    );
  }

  // Equipment statistics
  const pendingCount = equipment.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedCount = equipment.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = equipment.filter(
    (item) => item.status === "Rejected"
  ).length;

  return (
    <>
      {/* Shared Navbar */}
      <Navbar />

      <main className="admin-dashboard" style={styles.page}>
        {/* Welcome Section */}
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

          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 46px)",
              margin: "12px 0",
            }}
          >
            Welcome, {user.name || "Admin"}!
          </h1>

          <p style={{ ...styles.muted, lineHeight: 1.7 }}>
            Manage and monitor your Equipora platform from one place.
          </p>

          {/* Admin Information */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
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
              <h3 style={{ overflowWrap: "anywhere" }}>
                {user.email}
              </h3>
            </div>
          </div>
        </section>

        {/* Equipment Overview */}
        <section style={{ marginTop: "45px" }}>
          <h2 style={styles.sectionTitle}>
            Equipment Overview
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "18px",
            }}
          >
            <div style={styles.card}>
              <p style={styles.muted}>Total Equipment</p>
              <h1 style={{ fontSize: "34px" }}>
                {equipment.length}
              </h1>
            </div>

            <div style={styles.card}>
              <p style={styles.muted}>Pending</p>
              <h1 style={{ color: "#d69e22", fontSize: "34px" }}>
                {pendingCount}
              </h1>
            </div>

            <div style={styles.card}>
              <p style={styles.muted}>Approved</p>
              <h1 style={{ color: "#219653", fontSize: "34px" }}>
                {approvedCount}
              </h1>
            </div>

            <div style={styles.card}>
              <p style={styles.muted}>Rejected</p>
              <h1 style={{ color: "#e05252", fontSize: "34px" }}>
                {rejectedCount}
              </h1>
            </div>
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
                fetchAllEquipment(
                  localStorage.getItem("equipora-token")
                )
              }
              disabled={loading}
              style={{
                ...styles.primaryButton,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
          </div>

          {/* Success Message */}
          {message && (
            <div
              style={{
                background: "rgba(33, 150, 83, 0.12)",
                color: "#219653",
                border: "1px solid rgba(33, 150, 83, 0.3)",
                padding: "14px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "rgba(224, 82, 82, 0.12)",
                color: "#e05252",
                border: "1px solid rgba(224, 82, 82, 0.3)",
                padding: "14px",
                borderRadius: "8px",
                marginBottom: "20px",
                overflowWrap: "anywhere",
              }}
            >
              {error}
            </div>
          )}

          {/* Loading / Empty / Equipment List */}
          {loading ? (
            <div style={styles.card}>
              <p style={styles.accent}>Loading equipment...</p>
            </div>
          ) : equipment.length === 0 ? (
            <div
              style={{
                ...styles.card,
                textAlign: "center",
                padding: "45px 20px",
              }}
            >
              <h3>No Equipment Submitted</h3>
              <p style={styles.muted}>
                Equipment submitted by owners will appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "22px",
              }}
            >
              {equipment.map((item) => (
                <article
                  key={item._id}
                  style={{
                    ...styles.card,
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  {/* Equipment Image */}
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.equipmentName}
                      style={{
                        width: "100%",
                        height: "190px",
                        objectFit: "cover",
                        background: "var(--surface, #222222)",
                      }}
                    />
                  )}

                  <div style={{ padding: "20px" }}>
                    {/* Category and Status */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          ...styles.accent,
                          fontSize: "11px",
                          letterSpacing: "1px",
                        }}
                      >
                        {item.category}
                      </span>

                      <span
                        style={{
                          color: getStatusColor(item.status),
                          background: "var(--surface, #252525)",
                          padding: "6px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        {item.status || "Pending"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "21px" }}>
                      {item.equipmentName}
                    </h3>

                    <p
                      style={{
                        ...styles.muted,
                        fontSize: "13px",
                        lineHeight: 1.6,
                      }}
                    >
                      {item.description}
                    </p>

                    {/* Equipment Details */}
                    <div
                      style={{
                        borderTop: "1px solid var(--border, #333333)",
                        borderBottom: "1px solid var(--border, #333333)",
                        padding: "12px 0",
                        margin: "15px 0",
                      }}
                    >
                      <p style={{ margin: "7px 0" }}>
                        Price:{" "}
                        <strong style={styles.accent}>
                          ৳{item.rentalPrice}
                        </strong>{" "}
                        / {item.rentalType}
                      </p>

                      <p style={{ ...styles.muted, margin: "7px 0" }}>
                        Location: {item.location}
                      </p>

                      <p style={{ ...styles.muted, margin: "7px 0" }}>
                        Quantity: {item.availableQuantity}
                      </p>

                      <p style={{ ...styles.muted, margin: "7px 0" }}>
                        Brand: {item.brand} {item.model}
                      </p>

                      <p style={{ ...styles.muted, margin: "7px 0" }}>
                        Condition: {item.condition}
                      </p>

                      <p style={{ ...styles.muted, margin: "7px 0" }}>
                        Owner: {item.ownerInfo?.name || "Unknown"}
                      </p>

                      <p
                        style={{
                          ...styles.muted,
                          margin: "7px 0",
                          overflowWrap: "anywhere",
                        }}
                      >
                        Email: {item.ownerInfo?.email || "Unknown"}
                      </p>
                    </div>

                    {/* Rental Terms */}
                    <p
                      style={{
                        ...styles.muted,
                        fontSize: "13px",
                        lineHeight: 1.6,
                      }}
                    >
                      <strong style={{ color: "var(--foreground, #ffffff)" }}>
                        Rental Terms:
                      </strong>{" "}
                      {item.rentalTerms}
                    </p>

                    {/* Approve and Reject */}
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
                        onClick={() =>
                          handleStatusUpdate(item._id, "Approved")
                        }
                        style={{
                          background: "#219653",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "7px",
                          padding: "11px 8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          opacity:
                            updatingId === item._id ? 0.5 : 1,
                        }}
                      >
                        {updatingId === item._id
                          ? "Updating..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === item._id}
                        onClick={() =>
                          handleStatusUpdate(item._id, "Rejected")
                        }
                        style={{
                          background: "#e05252",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "7px",
                          padding: "11px 8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          opacity:
                            updatingId === item._id ? 0.5 : 1,
                        }}
                      >
                        Reject
                      </button>
                    </div>

                    {/* Reset to Pending */}
                    {item.status !== "Pending" && (
                      <button
                        type="button"
                        disabled={updatingId === item._id}
                        onClick={() =>
                          handleStatusUpdate(item._id, "Pending")
                        }
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          background: "transparent",
                          color: "var(--foreground, #ffffff)",
                          border: "1px solid var(--border, #444444)",
                          borderRadius: "7px",
                          padding: "10px",
                          cursor: "pointer",
                          opacity:
                            updatingId === item._id ? 0.5 : 1,
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
      </main>
    </>
  );
}
