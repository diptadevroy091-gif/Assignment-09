
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { useToast } from "../../../components/ToastProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function AdminRentalsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [bookingFilter, setBookingFilter] = useState("All");
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const getToken = () => {
    if (typeof window === "undefined") return "";

    return (
      localStorage.getItem("equipora-token") ||
      localStorage.getItem("token") ||
      ""
    );
  };

  const fetchBookings = useCallback(async () => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/bookings/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load rentals.");
      }

      setBookings(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      showToast(error.message || "Could not load rentals.", "error");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    const savedUser = localStorage.getItem("equipora-user");

    if (!savedUser || !getToken()) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.role !== "Admin") {
        router.replace(
          user.role === "Owner"
            ? "/dashboard/owner"
            : "/dashboard/customer"
        );
        return;
      }

      fetchBookings();
    } catch {
      router.replace("/login");
    }
  }, [router, fetchBookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const equipment = booking.equipmentId || {};
      const customer = booking.customerInfo || {};

      const searchText = [
        equipment.equipmentName,
        customer.name,
        customer.email,
        booking.contactNumber,
        booking.deliveryAddress,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const matchesPayment =
        paymentFilter === "All" ||
        booking.paymentStatus === paymentFilter;

      const matchesBooking =
        bookingFilter === "All" ||
        booking.bookingStatus === bookingFilter;

      return matchesSearch && matchesPayment && matchesBooking;
    });
  }, [bookings, search, paymentFilter, bookingFilter]);

  const totalRevenue = bookings
    .filter((booking) => booking.paymentStatus === "Paid")
    .reduce(
      (sum, booking) => sum + Number(booking.totalAmount || 0),
      0
    );

  const paidCount = bookings.filter(
    (booking) => booking.paymentStatus === "Paid"
  ).length;

  const pendingCount = bookings.filter(
    (booking) => booking.bookingStatus === "Pending"
  ).length;

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMoney = (amount) =>
    `৳${Number(amount || 0).toLocaleString("en-BD")}`;

  const statusStyle = (status) => {
    const value = String(status || "").toLowerCase();

    if (["paid", "confirmed", "completed"].includes(value)) {
      return {
        background: "rgba(34, 197, 94, 0.13)",
        color: "#16a34a",
      };
    }

    if (value === "pending") {
      return {
        background: "rgba(234, 179, 8, 0.14)",
        color: "#d69e22",
      };
    }

    if (["failed", "cancelled", "refunded"].includes(value)) {
      return {
        background: "rgba(239, 68, 68, 0.13)",
        color: "#ef4444",
      };
    }

    return {
      background: "var(--surface)",
      color: "var(--muted)",
    };
  };

  const deleteBooking = async () => {
    if (!bookingToDelete) return;

    if (
      bookingToDelete.paymentStatus !== "Pending" ||
      bookingToDelete.bookingStatus !== "Pending"
    ) {
      showToast("Only unpaid pending bookings can be deleted.", "warning");
      setBookingToDelete(null);
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_BASE}/api/bookings/admin/${bookingToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete rental.");
      }

      setBookings((previous) =>
        previous.filter((item) => item._id !== bookingToDelete._id)
      );

      showToast(
        result.message || "Pending rental deleted successfully!",
        "success"
      );

      setBookingToDelete(null);
    } catch (error) {
      showToast(error.message || "Failed to delete rental.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const cardStyle = {
    background: "var(--surface-card, var(--surface, #ffffff))",
    color: "var(--foreground, #171717)",
    border: "1px solid var(--border, #e5e7eb)",
    borderRadius: "16px",
    boxShadow: "var(--shadow, 0 2px 12px rgba(0,0,0,0.04))",
  };

  const inputStyle = {
    width: "100%",
    minWidth: 0,
    padding: "13px 15px",
    borderRadius: "10px",
    border: "1px solid var(--border, #e5e7eb)",
    background: "var(--background, #ffffff)",
    color: "var(--foreground, #171717)",
    outline: "none",
    fontSize: "14px",
  };

  const mutedStyle = {
    color: "var(--muted, #888888)",
  };

  const buttonStyle = {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid var(--border, #e5e7eb)",
    background: "var(--surface-card, #ffffff)",
    color: "var(--foreground, #171717)",
    fontWeight: "700",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background, #f5f6fa)",
        color: "var(--foreground, #171717)",
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "32px 20px 70px",
        }}
      >
        {/* Back and Refresh */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "30px",
          }}
        >
          <Link
            href="/dashboard/admin"
            style={buttonStyle}
          >
            ← Back to Admin Dashboard
          </Link>

          <button
            type="button"
            onClick={fetchBookings}
            disabled={loading}
            style={{
              ...buttonStyle,
              background: "var(--accent, #ccff00)",
              color: "var(--accent-text, #080808)",
              border: "none",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh Rentals"}
          </button>
        </div>

        {/* Page Heading */}
        <div style={{ marginBottom: "30px" }}>
          <p
            style={{
              color: "var(--accent-text, #8aa900)",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "2px",
              marginBottom: "10px",
            }}
          >
            ADMIN CONTROL CENTER
          </p>

          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 42px)",
              fontWeight: "900",
              margin: 0,
              letterSpacing: "-1px",
            }}
          >
            All Rentals
          </h1>

          <p style={{ ...mutedStyle, marginTop: "10px", lineHeight: 1.7 }}>
            Monitor every rental, customer, payment and booking status.
          </p>
        </div>

        {/* Statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          {[
            {
              label: "Total Rentals",
              value: bookings.length,
              icon: "📋",
            },
            {
              label: "Paid Rentals",
              value: paidCount,
              icon: "💳",
            },
            {
              label: "Pending Bookings",
              value: pendingCount,
              icon: "⏳",
            },
            {
              label: "Total Revenue",
              value: formatMoney(totalRevenue),
              icon: "৳",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...cardStyle,
                padding: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <p style={{ ...mutedStyle, fontSize: "13px", margin: 0 }}>
                  {item.label}
                </p>

                <span style={{ fontSize: "23px" }}>{item.icon}</span>
              </div>

              <h2
                style={{
                  fontSize: "27px",
                  fontWeight: "900",
                  marginTop: "17px",
                  overflowWrap: "anywhere",
                }}
              >
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Rental Management */}
        <section
          style={{
            ...cardStyle,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid var(--border, #e5e7eb)",
            }}
          >
            <h2 style={{ fontSize: "21px", fontWeight: "800" }}>
              Rental Management
            </h2>

            <p style={{ ...mutedStyle, fontSize: "13px", marginTop: "6px" }}>
              Search and monitor all customer rental records.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search equipment, customer, email..."
                style={inputStyle}
              />

              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                style={inputStyle}
              >
                <option value="All">All Payment Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>

              <select
                value={bookingFilter}
                onChange={(event) => setBookingFilter(event.target.value)}
                style={inputStyle}
              >
                <option value="All">All Booking Status</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "65px 20px", textAlign: "center" }}>
              <p style={mutedStyle}>Loading rental records...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ padding: "65px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "38px", marginBottom: "12px" }}>
                📭
              </div>

              <h3 style={{ fontWeight: "800" }}>No rentals found</h3>

              <p style={{ ...mutedStyle, fontSize: "13px", marginTop: "8px" }}>
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "1100px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "13px",
                }}
              >
                <thead
                  style={{
                    background: "var(--surface, #f3f4f6)",
                    color: "var(--muted, #777777)",
                  }}
                >
                  <tr>
                    {[
                      "Equipment / Customer",
                      "Owner",
                      "Rental Period",
                      "Quantity",
                      "Amount",
                      "Payment",
                      "Booking",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "17px 15px",
                          fontSize: "11px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => {
                    const equipment = booking.equipmentId || {};
                    const customer = booking.customerInfo || {};

                    const canDelete =
                      booking.paymentStatus === "Pending" &&
                      booking.bookingStatus === "Pending";

                    return (
                      <tr
                        key={booking._id}
                        style={{
                          borderTop: "1px solid var(--border, #e5e7eb)",
                        }}
                      >
                        <td style={{ padding: "17px 15px" }}>
                          <p style={{ fontWeight: "800" }}>
                            {equipment.equipmentName || "Equipment unavailable"}
                          </p>

                          <p style={{ ...mutedStyle, marginTop: "6px" }}>
                            {customer.name || "Unknown customer"}
                          </p>

                          <p style={{ ...mutedStyle, fontSize: "11px" }}>
                            {customer.email || "—"}
                          </p>
                        </td>

                        <td style={{ padding: "17px 15px" }}>
                          <p style={{ fontWeight: "600" }}>
                            {equipment.ownerInfo?.name || "Owner"}
                          </p>

                          <p style={{ ...mutedStyle, marginTop: "5px" }}>
                            {equipment.location || "—"}
                          </p>
                        </td>

                        <td style={{ padding: "17px 15px", whiteSpace: "nowrap" }}>
                          <p>{formatDate(booking.startDate)}</p>
                          <p style={{ ...mutedStyle, marginTop: "5px" }}>
                            to {formatDate(booking.endDate)}
                          </p>
                        </td>

                        <td style={{ padding: "17px 15px", fontWeight: "700" }}>
                          {booking.quantity || 1}
                        </td>

                        <td style={{ padding: "17px 15px", fontWeight: "800" }}>
                          {formatMoney(booking.totalAmount)}
                        </td>

                        <td style={{ padding: "17px 15px" }}>
                          <span
                            style={{
                              ...statusStyle(booking.paymentStatus),
                              padding: "6px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "800",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {booking.paymentStatus || "Pending"}
                          </span>
                        </td>

                        <td style={{ padding: "17px 15px" }}>
                          <span
                            style={{
                              ...statusStyle(booking.bookingStatus),
                              padding: "6px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "800",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {booking.bookingStatus || "Pending"}
                          </span>
                        </td>

                        <td style={{ padding: "17px 15px" }}>
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setBookingToDelete(booking)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #ef4444",
                                background: "transparent",
                                color: "#ef4444",
                                fontWeight: "800",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          ) : (
                            <span
                              style={{
                                color: "#16a34a",
                                fontSize: "12px",
                                fontWeight: "800",
                              }}
                            >
                              Protected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              padding: "16px 22px",
              borderTop: "1px solid var(--border, #e5e7eb)",
              ...mutedStyle,
              fontSize: "12px",
            }}
          >
            Showing {filteredBookings.length} of {bookings.length} rentals
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {bookingToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.65)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "430px",
              padding: "26px",
              borderRadius: "18px",
              background: "var(--surface-card, var(--background, #ffffff))",
              color: "var(--foreground, #171717)",
              border: "1px solid var(--border, #e5e7eb)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "14px" }}>
              ⚠️
            </div>

            <h3 style={{ fontSize: "21px", fontWeight: "900" }}>
              Delete this rental?
            </h3>

            <p
              style={{
                ...mutedStyle,
                fontSize: "13px",
                lineHeight: 1.8,
                marginTop: "12px",
              }}
            >
              You are about to delete the pending booking for{" "}
              <strong style={{ color: "var(--foreground)" }}>
                {bookingToDelete.equipmentId?.equipmentName || "this equipment"}
              </strong>
              . This action cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "25px",
              }}
            >
              <button
                type="button"
                onClick={() => setBookingToDelete(null)}
                disabled={deleting}
                style={buttonStyle}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteBooking}
                disabled={deleting}
                style={{
                  padding: "12px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: "800",
                  cursor: "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
