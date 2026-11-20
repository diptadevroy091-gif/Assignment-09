
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { useToast } from "../../../components/ToastProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function OwnerAnalyticsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("equipora-token") ||
        localStorage.getItem("token");

      const userData = JSON.parse(
        localStorage.getItem("equipora-user") || "{}"
      );

      if (!token || userData.role !== "Owner") {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/bookings/owner/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load analytics."
        );
      }

      setAnalytics(result.data);
    } catch (error) {
      showToast(
        error.message || "Could not load analytics!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const stats = [
    {
      title: "Total Equipment",
      value: analytics?.totalEquipment ?? 0,
      icon: "🛠️",
    },
    {
      title: "Total Bookings",
      value: analytics?.totalBookings ?? 0,
      icon: "📋",
    },
    {
      title: "Completed Rentals",
      value: analytics?.completedRentals ?? 0,
      icon: "✅",
    },
    {
      title: "Paid Bookings",
      value: analytics?.paidBookings ?? 0,
      icon: "💳",
    },
    {
      title: "Total Earnings",
      value: `৳${(analytics?.totalEarnings ?? 0).toLocaleString("en-BD")}`,
      icon: "💰",
    },
  ];

  const monthlyData = analytics?.monthlyEarnings || [];

  const maxEarning = Math.max(
    ...monthlyData.map((item) => Number(item.earnings || 0)),
    1
  );

  const cardStyle = {
    background: "var(--surface-card)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "var(--shadow)",
  };

  const backButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 15px",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    background: "var(--surface-card)",
    color: "var(--foreground)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "700",
  };

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "100vh",
          padding: "35px 20px 60px",
          background: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Link href="/dashboard/owner" style={backButtonStyle}>
            ← Back to Owner Dashboard
          </Link>

          <div
            style={{
              marginTop: "28px",
              marginBottom: "28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--accent)",
                  fontWeight: "800",
                  fontSize: "12px",
                  letterSpacing: "2px",
                }}
              >
                OWNER CONTROL CENTER
              </p>

              <h1 style={{ fontSize: "32px", fontWeight: "900" }}>
                Owner Analytics
              </h1>

              <p style={{ color: "var(--muted)", marginTop: "7px" }}>
                Track your equipment, rentals and earnings.
              </p>
            </div>

            <button
              onClick={() => {
                setLoading(true);
                fetchAnalytics();
              }}
              disabled={loading}
              style={{
                padding: "11px 18px",
                borderRadius: "10px",
                border: "none",
                background: "var(--accent)",
                color: "var(--accent-text)",
                fontWeight: "800",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              ↻ {loading ? "Loading..." : "Refresh Analytics"}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "70px 10px" }}>
              Loading analytics...
            </div>
          ) : !analytics ? (
            <div style={cardStyle}>
              Unable to load analytics. Please refresh the page.
            </div>
          ) : (
            <>
              {/* Analytics Statistics */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "18px",
                }}
              >
                {stats.map((item) => (
                  <div key={item.title} style={cardStyle}>
                    <div style={{ fontSize: "27px" }}>
                      {item.icon}
                    </div>

                    <p
                      style={{
                        color: "var(--muted)",
                        fontSize: "13px",
                        marginTop: "15px",
                      }}
                    >
                      {item.title}
                    </p>

                    <h2
                      style={{
                        fontSize: "27px",
                        fontWeight: "900",
                        marginTop: "6px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {item.value}
                    </h2>
                  </div>
                ))}
              </div>

              {/* Monthly Earnings */}
              <section
                style={{
                  ...cardStyle,
                  marginTop: "25px",
                }}
              >
                <h2 style={{ fontSize: "21px", fontWeight: "800" }}>
                  Monthly Earnings
                </h2>

                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "13px",
                    marginTop: "5px",
                    marginBottom: "25px",
                  }}
                >
                  Your paid booking earnings over the last 6 months.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "end",
                    gap: "14px",
                    height: "230px",
                    overflowX: "auto",
                    paddingTop: "15px",
                  }}
                >
                  {monthlyData.map((item, index) => {
                    const earning = Number(item.earnings || 0);

                    const barHeight = Math.max(
                      (earning / maxEarning) * 145,
                      4
                    );

                    return (
                      <div
                        key={`${item.month}-${index}`}
                        style={{
                          flex: "1",
                          minWidth: "45px",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "end",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--muted)",
                            fontWeight: "700",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ৳{earning.toLocaleString("en-BD")}
                        </span>

                        <div
                          title={`৳${earning.toLocaleString("en-BD")}`}
                          style={{
                            width: "100%",
                            maxWidth: "55px",
                            height: `${barHeight}px`,
                            minHeight: "4px",
                            borderRadius: "8px 8px 2px 2px",
                            background: "var(--accent)",
                          }}
                        />

                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--muted)",
                          }}
                        >
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
