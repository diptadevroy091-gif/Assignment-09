
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerDashboard() {
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
      setUser(JSON.parse(savedUser));
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
        Loading your dashboard...
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      padding: "40px 6%",
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        borderBottom: "1px solid #292929",
        paddingBottom: "24px"
      }}>
        <h2 style={{ margin: 0 }}>
          Equipora <span style={{ color: "#c9f269" }}>.</span>
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

      <section style={{ marginTop: "65px" }}>
        <p style={{ color: "#c9f269", letterSpacing: "2px" }}>
          CUSTOMER DASHBOARD
        </p>

        <h1 style={{ fontSize: "clamp(30px, 5vw, 48px)" }}>
          Welcome, {user.name || "Customer"}!
        </h1>

        <p style={{ color: "#aaa", lineHeight: 1.8 }}>
          You are successfully logged in to your Equipora account.
        </p>

        <div style={{
          marginTop: "35px",
          padding: "28px",
          background: "#151515",
          border: "1px solid #292929",
          borderRadius: "14px",
          maxWidth: "550px"
        }}>
          <h3>Account Information</h3>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>

        <Link
          href="/equipment"
          style={{
            display: "inline-block",
            marginTop: "30px",
            background: "#c9f269",
            color: "#080808",
            padding: "14px 24px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold"
          }}
        >
          Browse Equipment →
        </Link>
      </section>
    </main>
  );
}
