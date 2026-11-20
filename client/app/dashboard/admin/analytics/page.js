
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { useToast } from "../../../components/ToastProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const money = (amount) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getList = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.users)) return result.users;
  if (Array.isArray(result?.equipment)) return result.equipment;
  if (Array.isArray(result?.bookings)) return result.bookings;
  return [];
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    const token =
      localStorage.getItem("equipora-token") ||
      localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [usersResponse, equipmentResponse, bookingsResponse] =
        await Promise.all([
          fetch(`${API_BASE}/api/users`, { headers }),
          fetch(`${API_BASE}/api/equipment/admin/all`, { headers }),
          fetch(`${API_BASE}/api/bookings/admin/all`, { headers }),
        ]);

      const results = await Promise.all([
        usersResponse.json(),
        equipmentResponse.json(),
        bookingsResponse.json(),
      ]);

      if (
        !usersResponse.ok ||
        !equipmentResponse.ok ||
        !bookingsResponse.ok
      ) {
        throw new Error(
          results.find((item) => item?.message)?.message ||
            "Could not load analytics data."
        );
      }

      setUsers(getList(results[0]));
      setEquipment(getList(results[1]));
      setBookings(getList(results[2]));
    } catch (error) {
      showToast(error.message || "Failed to load analytics.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    const savedUser = localStorage.getItem("equipora-user");

    if (!savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "Admin") {
        router.replace("/dashboard");
        return;
      }

      fetchAnalytics();
    } catch {
      router.replace("/login");
    }
  }, [router, fetchAnalytics]);

  const totalUsers = users.length;
  const totalEquipment = equipment.length;
  const totalBookings = bookings.length;

  const pendingApprovals = equipment.filter(
    (item) => item.status?.toLowerCase() === "pending"
  ).length;

  const completedRentals = bookings.filter(
    (booking) => booking.bookingStatus?.toLowerCase() === "completed"
  ).length;

  const totalRevenue = bookings
    .filter(
      (booking) => booking.paymentStatus?.toLowerCase() === "paid"
    )
    .reduce(
      (total, booking) => total + Number(booking.totalAmount || 0),
      0
    );

  const monthlyBookings = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    const year = date.getFullYear();
    const month = date.getMonth();

    const count = bookings.filter((booking) => {
      const created = new Date(booking.createdAt);

      return (
        !Number.isNaN(created.getTime()) &&
        created.getFullYear() === year &&
        created.getMonth() === month
      );
    }).length;

    return {
      label: date.toLocaleString("en-US", { month: "short" }),
      count,
    };
  });

  const maxMonthlyBookings = Math.max(
    ...monthlyBookings.map((item) => item.count),
    1
  );

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: "👥",
      color: "#60a5fa",
    },
    {
      label: "Total Equipment",
      value: totalEquipment,
      icon: "🛠️",
      color: "#a78bfa",
    },
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: "📋",
      color: "#fbbf24",
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      icon: "⏳",
      color: "#fb923c",
    },
    {
      label: "Completed Rentals",
      value: completedRentals,
      icon: "✅",
      color: "#34d399",
    },
    {
      label: "Total Revenue",
      value: money(totalRevenue),
      icon: "৳",
      color: "#ccff00",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding: "35px 20px 70px",
        }}
      >
        {/* Back Button - Same style as All Rentals */}
        <Link
          href="/dashboard/admin"
          style={{
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
            transition: "all 0.2s ease",
          }}
        >
          ← Back to Admin Dashboard
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginTop: "28px",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                color: "#ccff00",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "2px",
              }}
            >
              ADMIN CONTROL CENTER
            </p>

            <h1 style={{ fontSize: "32px", margin: "10px 0" }}>
              Admin Analytics
            </h1>

            <p style={{ color: "var(--muted)" }}>
              Monitor your platform performance and business statistics.
            </p>
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing || loading}
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--surface-card)",
              color: "var(--foreground)",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh Analytics"}
          </button>
        </div>

        {loading ? (
          <div
            style={{
              padding: "70px 20px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Loading analytics...
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "22px",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    background: "var(--surface-card)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "var(--muted)", fontSize: "13px" }}>
                      {stat.label}
                    </span>
                    <span style={{ fontSize: "22px", color: stat.color }}>
                      {stat.icon}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: "29px",
                      margin: "16px 0 0",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {stat.value}
                  </h2>
                </div>
              ))}
            </div>

            <section
              style={{
                marginTop: "28px",
                padding: "25px",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                background: "var(--surface-card)",
              }}
            >
              <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
                Monthly Booking Statistics
              </h2>

              <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                Booking creation activity over the last six months.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                  gap: "12px",
                  alignItems: "end",
                  height: "230px",
                  marginTop: "25px",
                }}
              >
                {monthlyBookings.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "end",
                      height: "100%",
                      gap: "9px",
                    }}
                  >
                    <strong style={{ fontSize: "13px" }}>
                      {item.count}
                    </strong>

                    <div
                      style={{
                        width: "100%",
                        maxWidth: "65px",
                        height: `${Math.max(
                          (item.count / maxMonthlyBookings) * 145,
                          5
                        )}px`,
                        background: "#ccff00",
                        borderRadius: "8px 8px 2px 2px",
                      }}
                    />

                    <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                marginTop: "25px",
                padding: "24px",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                background: "var(--surface-card)",
              }}
            >
              <h2 style={{ fontSize: "20px", marginBottom: "18px" }}>
                Platform Overview
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "18px",
                }}
              >
                <div>
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                    Approved Equipment
                  </p>
                  <h3 style={{ fontSize: "24px", marginTop: "8px" }}>
                    {equipment.filter(
                      (item) => item.status?.toLowerCase() === "approved"
                    ).length}
                  </h3>
                </div>

                <div>
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                    Paid Bookings
                  </p>
                  <h3 style={{ fontSize: "24px", marginTop: "8px" }}>
                    {
                      bookings.filter(
                        (item) => item.paymentStatus?.toLowerCase() === "paid"
                      ).length
                    }
                  </h3>
                </div>

                <div>
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                    Pending Bookings
                  </p>
                  <h3 style={{ fontSize: "24px", marginTop: "8px" }}>
                    {
                      bookings.filter(
                        (item) =>
                          item.bookingStatus?.toLowerCase() === "pending"
                      ).length
                    }
                  </h3>
                </div>
              </div>
            </section>
          </>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "25px",
          }}
        >
          <Link
            href="/dashboard/admin/users"
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              background: "#ccff00",
              color: "#080808",
              textDecoration: "none",
              fontWeight: "800",
            }}
          >
            Manage Users →
          </Link>

          <Link
            href="/dashboard/admin/rentals"
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--surface-card)",
              color: "var(--foreground)",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            View All Rentals →
          </Link>
        </div>
      </div>
    </main>
  );
}
