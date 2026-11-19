
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const cardStyle = {
    background: "#151515",
    border: "1px solid #292929",
    borderRadius: "14px",
    padding: "24px",
  };

  const buttonStyle = {
    background: "#c9f269",
    color: "#080808",
    border: "none",
    padding: "12px 22px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  // Fetch all equipment
  const fetchAllEquipment = async (token) => {
    try {
      setLoading(true);

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
      setError("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Check Admin Authentication
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
    } catch {
      localStorage.removeItem("equipora-token");
      localStorage.removeItem("equipora-user");
      router.replace("/login");
    }
  }, [router]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("equipora-token");
    localStorage.removeItem("equipora-user");
    router.replace("/login");
  };

  // Update Equipment Status
  const handleStatusUpdate = async (id, status) => {
    const token = localStorage.getItem("equipora-token");

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
        result.message || `Equipment ${status.toLowerCase()} successfully!`
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
    if (status === "Approved") return "#9be7a5";
    if (status === "Rejected") return "#ff8585";
    return "#ffd479";
  };

  // Dashboard loading
  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#080808",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading Admin Dashboard...
      </main>
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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#fff",
        padding: "35px 6%",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          borderBottom: "1px solid #292929",
          paddingBottom: "22px",
        }}
      >
        <h2 style={{ margin: 0 }}>
          Equipora{" "}
          <span style={{ color: "#c9f269" }}>Admin</span>
        </h2>

        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      </header>

      {/* Welcome */}
      <section style={{ marginTop: "45px" }}>
        <p
          style={{
            color: "#c9f269",
            letterSpacing: "2px",
            fontSize: "12px",
          }}
        >
          ADMIN CONTROL CENTER
        </p>

        <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)" }}>
          Welcome, {user.name || "Admin"}!
        </h1>

        <p style={{ color: "#999", lineHeight: 1.7 }}>
          Manage and monitor your Equipora platform from one place.
        </p>

        {/* Admin Information */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          <div style={cardStyle}>
            <p style={{ color: "#999" }}>Account Type</p>
            <h2 style={{ color: "#c9f269" }}>Administrator</h2>
          </div>

          <div style={cardStyle}>
            <p style={{ color: "#999" }}>Admin Name</p>
            <h2>{user.name || "Admin"}</h2>
          </div>

          <div style={cardStyle}>
            <p style={{ color: "#999" }}>Admin Email</p>
            <h3 style={{ overflowWrap: "anywhere" }}>
              {user.email}
            </h3>
          </div>
        </div>
      </section>

      {/* Equipment Statistics */}
      <section style={{ marginTop: "45px" }}>
        <h2 style={{ fontSize: "26px", marginBottom: "20px" }}>
          Equipment Overview
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "18px",
          }}
        >
          <div style={cardStyle}>
            <p style={{ color: "#999" }}>Total Equipment</p>
            <h1 style={{ color: "#fff", fontSize: "34px" }}>
              {equipment.length}
            </h1>
          </div>

          <div style={cardStyle}>
            <p style={{ color: "#999" }}>Pending</p>
            <h1 style={{ color: "#ffd479", fontSize: "34px" }}>
              {pendingCount}
            </h1>
          </div>

          <div style={cardStyle}>
            <p style={{ color: "#999" }}>Approved</p>
            <h1 style={{ color: "#9be7a5", fontSize: "34px" }}>
              {approvedCount}
            </h1>
          </div>

          <div style={cardStyle}>
            <p style={{ color: "#999" }}>Rejected</p>
            <h1 style={{ color: "#ff8585", fontSize: "34px" }}>
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
            <h2 style={{ fontSize: "26px", marginBottom: "8px" }}>
              Equipment Management
            </h2>

            <p style={{ color: "#999", margin: 0 }}>
              Review and manage equipment submitted by owners.
            </p>
          </div>

          <button
            onClick={() =>
              fetchAllEquipment(
                localStorage.getItem("equipora-token")
              )
            }
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Refreshing..." : "Refresh List"}
          </button>
        </div>

        {/* Success */}
        {message && (
          <div
            style={{
              background: "#17351d",
              color: "#9be7a5",
              padding: "14px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#381919",
              color: "#ff9999",
              padding: "14px",
              borderRadius: "8px",
              marginBottom: "20px",
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={cardStyle}>
            <p style={{ color: "#c9f269" }}>
              Loading equipment...
            </p>
          </div>
        ) : equipment.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              textAlign: "center",
              padding: "45px 20px",
            }}
          >
            <h3>No Equipment Submitted</h3>
            <p style={{ color: "#999" }}>
              Equipment submitted by owners will appear here.
            </p>
          </div>
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
                style={{
                  ...cardStyle,
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                {/* Image */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.equipmentName}
                    style={{
                      width: "100%",
                      height: "190px",
                      objectFit: "cover",
                      background: "#222",
                    }}
                  />
                )}

                <div style={{ padding: "20px" }}>
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
                        color: "#c9f269",
                        fontSize: "11px",
                        letterSpacing: "1px",
                      }}
                    >
                      {item.category}
                    </span>

                    <span
                      style={{
                        color: getStatusColor(item.status),
                        background: "#252525",
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
                      color: "#999",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.description}
                  </p>

                  <div
                    style={{
                      borderTop: "1px solid #333",
                      borderBottom: "1px solid #333",
                      padding: "12px 0",
                      margin: "15px 0",
                    }}
                  >
                    <p style={{ color: "#ccc", margin: "7px 0" }}>
                      Price:{" "}
                      <strong style={{ color: "#c9f269" }}>
                        ৳{item.rentalPrice}
                      </strong>{" "}
                      / {item.rentalType}
                    </p>

                    <p style={{ color: "#999", margin: "7px 0" }}>
                      Location: {item.location}
                    </p>

                    <p style={{ color: "#999", margin: "7px 0" }}>
                      Quantity: {item.availableQuantity}
                    </p>

                    <p style={{ color: "#999", margin: "7px 0" }}>
                      Brand: {item.brand} {item.model}
                    </p>

                    <p style={{ color: "#999", margin: "7px 0" }}>
                      Condition: {item.condition}
                    </p>

                    <p style={{ color: "#999", margin: "7px 0" }}>
                      Owner: {item.ownerInfo?.name || "Unknown"}
                    </p>

                    <p
                      style={{
                        color: "#999",
                        margin: "7px 0",
                        overflowWrap: "anywhere",
                      }}
                    >
                      Email: {item.ownerInfo?.email || "Unknown"}
                    </p>
                  </div>

                  <p
                    style={{
                      color: "#aaa",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    <strong style={{ color: "#fff" }}>
                      Rental Terms:
                    </strong>{" "}
                    {item.rentalTerms}
                  </p>

                  {/* Admin Actions */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginTop: "20px",
                    }}
                  >
                    <button
                      disabled={updatingId === item._id}
                      onClick={() =>
                        handleStatusUpdate(item._id, "Approved")
                      }
                      style={{
                        background: "#9be7a5",
                        color: "#080808",
                        border: "none",
                        borderRadius: "7px",
                        padding: "11px 8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        opacity: updatingId === item._id ? 0.5 : 1,
                      }}
                    >
                      {updatingId === item._id
                        ? "Updating..."
                        : "Approve"}
                    </button>

                    <button
                      disabled={updatingId === item._id}
                      onClick={() =>
                        handleStatusUpdate(item._id, "Rejected")
                      }
                      style={{
                        background: "#ff8585",
                        color: "#080808",
                        border: "none",
                        borderRadius: "7px",
                        padding: "11px 8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        opacity: updatingId === item._id ? 0.5 : 1,
                      }}
                    >
                      Reject
                    </button>
                  </div>

                  {item.status !== "Pending" && (
                    <button
                      disabled={updatingId === item._id}
                      onClick={() =>
                        handleStatusUpdate(item._id, "Pending")
                      }
                      style={{
                        width: "100%",
                        marginTop: "10px",
                        background: "transparent",
                        color: "#ccc",
                        border: "1px solid #444",
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
    </main>
  );
}
