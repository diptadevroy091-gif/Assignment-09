
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { useToast } from "../../../components/ToastProvider";
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function OwnerRentalsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("equipora-token") ||
      localStorage.getItem("token")
    );
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/bookings/owner/my-bookings`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        showToast("Please login again.", "error");
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        showToast("You do not have Owner access.", "error");
        router.push("/dashboard");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load rental bookings."
        );
      }

      setBookings(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      showToast(error.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
  };

  const getStatusStyle = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "paid" || value === "confirmed" || value === "completed") {
      return {
        background: "rgba(34,197,94,0.12)",
        color: "#22c55e",
      };
    }

    if (value === "failed" || value === "cancelled") {
      return {
        background: "rgba(239,68,68,0.12)",
        color: "#ef4444",
      };
    }

    return {
      background: "rgba(234,179,8,0.12)",
      color: "#eab308",
    };
  };

  const totalPaid = bookings.filter(
    (booking) => booking.paymentStatus === "Paid"
  ).length;

  const totalPending = bookings.filter(
    (booking) => booking.paymentStatus === "Pending"
  ).length;

  const totalCompleted = bookings.filter(
    (booking) => booking.bookingStatus === "Completed"
  ).length;

  const totalRevenue = bookings
    .filter((booking) => booking.paymentStatus === "Paid")
    .reduce(
      (total, booking) => total + Number(booking.totalAmount || 0),
      0
    );

  const cardStyle = {
    background: "var(--surface-card, #151515)",
    border: "1px solid var(--border, #333)",
    borderRadius: "14px",
    padding: "22px",
  };

  const backButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "11px 18px",
    marginBottom: "25px",
    background: "var(--surface-card, #151515)",
    color: "var(--foreground, #fff)",
    border: "1px solid var(--border, #333)",
    borderRadius: "9px",
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
          background: "var(--background, #080808)",
          color: "var(--foreground, #fff)",
          padding: "35px 20px 70px",
        }}
      >
        <div style={{ maxWidth: "1250px", margin: "0 auto" }}>
          <Link href="/dashboard/owner" style={backButtonStyle}>
            ← Back to Owner Dashboard
          </Link>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "18px",
              marginBottom: "30px",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--accent, #ccff00)",
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "2px",
                  marginBottom: "10px",
                }}
              >
                OWNER CONTROL CENTER
              </p>

              <h1
                style={{
                  fontSize: "clamp(28px, 5vw, 42px)",
                  fontWeight: "900",
                  margin: "0 0 10px",
                }}
              >
                My Equipment Rentals
              </h1>

              <p style={{ color: "var(--muted, #999)", margin: 0 }}>
                Monitor customers, rental bookings and payment information.
              </p>
            </div>

            <button
              onClick={fetchBookings}
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: "9px",
                border: "1px solid var(--border, #333)",
                background: "var(--surface-card, #151515)",
                color: "var(--foreground, #fff)",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ↻ {loading ? "Loading..." : "Refresh Rentals"}
            </button>
          </div>

          {/* Statistics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "16px",
              marginBottom: "30px",
            }}
          >
            <div style={cardStyle}>
              <p style={{ color: "var(--muted, #999)", margin: "0 0 12px" }}>
                Total Rentals
              </p>
              <h2 style={{ fontSize: "30px", margin: 0 }}>
                {bookings.length}
              </h2>
            </div>

            <div style={cardStyle}>
              <p style={{ color: "var(--muted, #999)", margin: "0 0 12px" }}>
                Paid Bookings
              </p>
              <h2 style={{ fontSize: "30px", color: "#22c55e", margin: 0 }}>
                {totalPaid}
              </h2>
            </div>

            <div style={cardStyle}>
              <p style={{ color: "var(--muted, #999)", margin: "0 0 12px" }}>
                Pending Payments
              </p>
              <h2 style={{ fontSize: "30px", color: "#eab308", margin: 0 }}>
                {totalPending}
              </h2>
            </div>

            <div style={cardStyle}>
              <p style={{ color: "var(--muted, #999)", margin: "0 0 12px" }}>
                Completed Rentals
              </p>
              <h2 style={{ fontSize: "30px", margin: 0 }}>
                {totalCompleted}
              </h2>
            </div>

            <div style={cardStyle}>
              <p style={{ color: "var(--muted, #999)", margin: "0 0 12px" }}>
                Total Earnings
              </p>
              <h2
                style={{
                  fontSize: "30px",
                  color: "var(--accent, #ccff00)",
                  margin: 0,
                }}
              >
                {formatAmount(totalRevenue)}
              </h2>
            </div>
          </div>

          {/* Rentals Table */}
          <section
            style={{
              ...cardStyle,
              padding: "0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "22px",
                borderBottom: "1px solid var(--border, #333)",
              }}
            >
              <h2 style={{ fontSize: "20px", margin: 0 }}>
                Customer Rental Records
              </h2>
              <p
                style={{
                  color: "var(--muted, #999)",
                  fontSize: "13px",
                  margin: "8px 0 0",
                }}
              >
                All rental bookings for your listed equipment.
              </p>
            </div>

            {loading ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                Loading rental records...
              </div>
            ) : bookings.length === 0 ? (
              <div style={{ padding: "65px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "42px", marginBottom: "15px" }}>
                  📋
                </div>
                <h3 style={{ marginBottom: "8px" }}>
                  No Rental Bookings Yet
                </h3>
                <p style={{ color: "var(--muted, #999)" }}>
                  Customer bookings for your equipment will appear here.
                </p>
                <Link
                  href="/dashboard/owner/equipment"
                  style={{
                    display: "inline-block",
                    marginTop: "12px",
                    color: "var(--accent, #ccff00)",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  Manage My Equipment →
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: "1050px",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr style={{ background: "var(--surface, #101010)" }}>
                      {[
                        "Customer",
                        "Equipment",
                        "Rental Period",
                        "Quantity",
                        "Amount",
                        "Payment",
                        "Booking Status",
                        "Booking Date",
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: "16px",
                            fontSize: "12px",
                            color: "var(--muted, #999)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking._id}
                        style={{
                          borderTop: "1px solid var(--border, #333)",
                        }}
                      >
                        <td style={{ padding: "16px" }}>
                          <strong>
                            {booking.customerInfo?.name || "Customer"}
                          </strong>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--muted, #999)",
                              margin: "5px 0 0",
                            }}
                          >
                            {booking.customerInfo?.email || "—"}
                          </p>
                        </td>

                        <td style={{ padding: "16px", fontWeight: "700" }}>
                          {booking.equipmentId?.equipmentName ||
                            "Equipment unavailable"}
                        </td>

                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          {formatDate(booking.startDate)}
                          <br />
                          <span style={{ color: "var(--muted, #999)" }}>
                            to {formatDate(booking.endDate)}
                          </span>
                        </td>

                        <td style={{ padding: "16px" }}>
                          {booking.quantity || 0}
                        </td>

                        <td
                          style={{
                            padding: "16px",
                            fontWeight: "800",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatAmount(booking.totalAmount)}
                        </td>

                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              ...getStatusStyle(booking.paymentStatus),
                              padding: "6px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "800",
                            }}
                          >
                            {booking.paymentStatus || "Pending"}
                          </span>
                        </td>

                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              ...getStatusStyle(booking.bookingStatus),
                              padding: "6px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "800",
                            }}
                          >
                            {booking.bookingStatus || "Pending"}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: "16px",
                            whiteSpace: "nowrap",
                            color: "var(--muted, #999)",
                            fontSize: "13px",
                          }}
                        >
                          {formatDate(booking.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
