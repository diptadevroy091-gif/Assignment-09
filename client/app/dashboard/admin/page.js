
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

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
    } catch {
      localStorage.removeItem("equipora-token");
      localStorage.removeItem("equipora-user");
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("equipora-token");
    localStorage.removeItem("equipora-user");
    router.replace("/login");
  };

  if (!user) {
    return (
      <main style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#fff",
        display: "grid",
        placeItems: "center"
      }}>
        Loading Admin Dashboard...
      </main>
    );
  }

  const cardStyle = {
    background: "#151515",
    border: "1px solid #292929",
    borderRadius: "14px",
    padding: "25px"
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      padding: "35px 6%",
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
        borderBottom: "1px solid #292929",
        paddingBottom: "22px"
      }}>
        <h2>
          Equipora <span style={{ color: "#c9f269" }}>Admin</span>
        </h2>

        <button
          onClick={handleLogout}
          style={{
            background: "#c9f269",
            color: "#080808",
            border: "none",
            padding: "12px 22px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </header>

      <section style={{ marginTop: "55px" }}>
        <p style={{
          color: "#c9f269",
          letterSpacing: "2px",
          fontSize: "12px"
        }}>
          ADMIN CONTROL CENTER
        </p>

        <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)" }}>
          Welcome, {user.name || "Admin"}!
        </h1>

        <p style={{ color: "#999", lineHeight: 1.7 }}>
          Manage and monitor your Equipora platform from one place.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "35px"
        }}>
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

        <div style={{
          ...cardStyle,
          marginTop: "25px"
        }}>
          <h2>Admin Panel</h2>
          <p style={{ color: "#999", lineHeight: 1.8 }}>
            Your Admin Dashboard is ready. Platform management
            features can be connected here.
          </p>
        </div>
      </section>
    </main>
  );
}
