
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { useToast } from "../../components/ToastProvider";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export default function EquipmentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    quantity: "1",
    contactNumber: "",
    deliveryAddress: "",
    notes: "",
  });

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("equipora-token") ||
        localStorage.getItem("token")
      : null;

  // Fetch equipment details
  useEffect(() => {
    if (!id) return;

    const fetchEquipment = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/equipment/${id}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Equipment not found!");
        }

        setEquipment(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  // Check whether this equipment is already in favorites
  useEffect(() => {
    if (!id) return;

    const token = getToken();
    if (!token) return;

    const checkFavorite = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/favorites/my-favorites`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          const exists = result.data?.some(
            (favorite) =>
              favorite.equipmentId?._id === id
          );

          setIsFavorite(Boolean(exists));
        }
      } catch (err) {
        console.error("Favorite check failed:", err);
      }
    };

    checkFavorite();
  }, [id]);

  // Add to favorites
  const handleFavorite = async () => {
    const token = getToken();

    if (!token) {
      showToast("Please login to add favorites.", "error");
      router.push("/login");
      return;
    }

    if (isFavorite) {
      showToast("Already added to your favorites.", "info");
      return;
    }

    try {
      setFavoriteLoading(true);

      const response = await fetch(
        `${API_URL}/api/favorites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            equipmentId: id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to add favorite."
        );
      }

      setIsFavorite(true);
      showToast("Added to your favorites successfully!", "success");
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const calculateTotal = () => {
    if (!equipment || !form.startDate || !form.endDate) {
      return 0;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return 0;
    }

    const duration = Math.ceil(
      (end - start) / (1000 * 60 * 60 * 24)
    );

    let units = duration;

    if (equipment.rentalType === "Weekly") {
      units = Math.ceil(duration / 7);
    } else if (equipment.rentalType === "Monthly") {
      units = Math.ceil(duration / 30);
    }

    return (
      Number(equipment.rentalPrice) *
      units *
      Number(form.quantity || 1)
    );
  };

  // Booking and Stripe Payment
  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Please select your rental dates.");
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after start date.");
      return;
    }

    if (
      Number(form.quantity) < 1 ||
      Number(form.quantity) > Number(equipment.availableQuantity)
    ) {
      setError("Requested quantity is not available.");
      return;
    }

    if (!form.contactNumber.trim() || !form.deliveryAddress.trim()) {
      setError("Please enter your contact number and delivery address.");
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Create Booking
      const bookingResponse = await fetch(
        `${API_URL}/api/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            equipmentId: id,
            startDate: form.startDate,
            endDate: form.endDate,
            quantity: Number(form.quantity),
            contactNumber: form.contactNumber.trim(),
            deliveryAddress: form.deliveryAddress.trim(),
            notes: form.notes.trim(),
          }),
        }
      );

      const bookingResult = await bookingResponse.json();

      if (!bookingResponse.ok || !bookingResult.success) {
        throw new Error(
          bookingResult.message || "Booking creation failed."
        );
      }

      const bookingId = bookingResult.data?._id;

      if (!bookingId) {
        throw new Error("Booking ID was not returned.");
      }

      // Step 2: Create Stripe Checkout Session
      const paymentResponse = await fetch(
        `${API_URL}/api/payments/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId }),
        }
      );

      const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok || !paymentResult.success) {
        throw new Error(
          paymentResult.message || "Payment session creation failed."
        );
      }

      if (!paymentResult.url) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      // Step 3: Redirect to Stripe Checkout
      window.location.href = paymentResult.url;
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--background)",
    color: "var(--foreground)",
    marginTop: "7px",
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh" }}>
        <Navbar />
        <p style={{ textAlign: "center", padding: "80px" }}>
          Loading equipment details...
        </p>
      </main>
    );
  }

  if (error && !equipment) {
    return (
      <main style={{ minHeight: "100vh" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2>Equipment Not Found</h2>
          <p>{error}</p>
          <Link href="/equipment">Back to Equipment</Link>
        </div>
      </main>
    );
  }

  if (!equipment) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
        paddingBottom: "60px",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: "1150px",
          margin: "40px auto",
          padding: "0 20px",
        }}
      >
        <Link
          href="/equipment"
          style={{
            color: "var(--accent)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Back to Equipment
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "35px",
            marginTop: "25px",
            alignItems: "start",
          }}
        >
          <section>
            <img
              src={equipment.imageUrl}
              alt={equipment.equipmentName}
              style={{
                width: "100%",
                height: "380px",
                objectFit: "cover",
                borderRadius: "20px",
                background: "var(--surface)",
              }}
            />

            <div style={{ marginTop: "25px" }}>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                {equipment.category}
              </span>

              <h1 style={{ fontSize: "32px", margin: "10px 0" }}>
                {equipment.equipmentName}
              </h1>

              <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                {equipment.description}
              </p>

              <button
                type="button"
                onClick={handleFavorite}
                disabled={favoriteLoading}
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  padding: "13px 18px",
                  marginTop: "18px",
                  borderRadius: "30px",
                  border: "1px solid var(--border)",
                  background: isFavorite ? "var(--accent)" : "var(--surface-card)",
                  color: isFavorite ? "var(--accent-text)" : "var(--foreground)",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: favoriteLoading ? "wait" : "pointer",
                  opacity: favoriteLoading ? 0.6 : 1,
                }}
              >
                {favoriteLoading
                  ? "Saving..."
                  : isFavorite
                    ? "❤️ Added to Favorites"
                    : "♡ Add to Favorites"}
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "15px",
                  marginTop: "25px",
                }}
              >
                {[
                  ["Brand", equipment.brand],
                  ["Model", equipment.model],
                  ["Condition", equipment.condition],
                  ["Location", equipment.location],
                  ["Rental Type", equipment.rentalType],
                  ["Available Quantity", equipment.availableQuantity],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      padding: "15px",
                      borderRadius: "12px",
                      background: "var(--surface-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <small style={{ color: "var(--muted)" }}>
                      {label}
                    </small>
                    <p style={{ fontWeight: 700, marginTop: "6px" }}>
                      {value || "Not specified"}
                    </p>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: "25px" }}>Rental Terms</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                {equipment.rentalTerms ||
                  "Contact the equipment owner for rental terms."}
              </p>
            </div>
          </section>

          <section
            style={{
              padding: "25px",
              borderRadius: "20px",
              background: "var(--surface-card)",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ color: "var(--muted)" }}>Rental Price</p>

            <h2 style={{ fontSize: "30px", margin: "8px 0 25px" }}>
              ৳{Number(equipment.rentalPrice).toLocaleString()}
              <span style={{ fontSize: "15px", color: "var(--muted)" }}>
                {" "}/ {equipment.rentalType}
              </span>
            </h2>

            <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
              Book This Equipment
            </h2>

            {error && (
              <p
                style={{
                  padding: "12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "8px",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
            )}

            <form onSubmit={handleBooking}>
              <label>
                Start Date
                <input
                  type="date"
                  name="startDate"
                  required
                  min={new Date().toLocaleDateString("en-CA")}
                  value={form.startDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "block", marginTop: "18px" }}>
                End Date
                <input
                  type="date"
                  name="endDate"
                  required
                  min={form.startDate || new Date().toLocaleDateString("en-CA")}
                  value={form.endDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "block", marginTop: "18px" }}>
                Quantity
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  max={equipment.availableQuantity}
                  required
                  value={form.quantity}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "block", marginTop: "18px" }}>
                Contact Number
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="Enter your phone number"
                  required
                  value={form.contactNumber}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "block", marginTop: "18px" }}>
                Delivery Address
                <textarea
                  name="deliveryAddress"
                  placeholder="Enter your complete address"
                  required
                  rows="3"
                  value={form.deliveryAddress}
                  onChange={handleChange}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <label style={{ display: "block", marginTop: "18px" }}>
                Additional Notes (Optional)
                <textarea
                  name="notes"
                  placeholder="Any special instructions?"
                  rows="2"
                  value={form.notes}
                  onChange={handleChange}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <div
                style={{
                  marginTop: "25px",
                  padding: "18px",
                  background: "var(--background)",
                  borderRadius: "12px",
                }}
              >
                <p style={{ color: "var(--muted)" }}>Estimated Total</p>
                <h2 style={{ fontSize: "28px", marginTop: "8px" }}>
                  ৳{calculateTotal().toLocaleString()}
                </h2>
                <small style={{ color: "var(--muted)" }}>
                  Final amount is calculated by the server.
                </small>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !equipment.availableQuantity ||
                  Number(equipment.availableQuantity) < 1
                }
                style={{
                  width: "100%",
                  padding: "15px",
                  marginTop: "20px",
                  border: "none",
                  borderRadius: "30px",
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                  fontWeight: 800,
                  fontSize: "15px",
                  cursor: submitting ? "wait" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Processing..." : "Book & Pay Now →"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
