
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { useToast } from "../../components/ToastProvider";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getToken = () => {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("equipora-token") ||
    localStorage.getItem("token")
  );
};

const readResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    throw new Error("Invalid response received from server.");
  }
};

export default function EquipmentDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

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

  // Fetch equipment details.
  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchEquipment = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/equipment/${id}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await readResponse(response);

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "Equipment not found."
          );
        }

        setEquipment(result.data);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Equipment details error:", err);

        setError(
          err.message || "Unable to load equipment details."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchEquipment();

    return () => controller.abort();
  }, [id]);

  // Check whether the equipment is already in favorites.
  useEffect(() => {
    if (!id) return;

    const token = getToken();

    if (!token) {
      setIsFavorite(false);
      return;
    }

    const controller = new AbortController();

    const checkFavorite = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/favorites/my-favorites`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await readResponse(response);

        if (!response.ok || !result.success) return;

        const favoriteList = Array.isArray(result.data)
          ? result.data
          : [];

        const exists = favoriteList.some((favorite) => {
          const favoriteEquipment = favorite.equipmentId;

          const favoriteId =
            typeof favoriteEquipment === "object"
              ? favoriteEquipment?._id
              : favoriteEquipment;

          return String(favoriteId) === String(id);
        });

        if (!controller.signal.aborted) {
          setIsFavorite(exists);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Favorite check failed:", err);
        }
      }
    };

    checkFavorite();

    return () => controller.abort();
  }, [id]);

  // Add equipment to favorites.
  const handleFavorite = async () => {
    const token = getToken();

    if (!token) {
      showToast("Please login to add favorites.", "info");
      router.push("/login");
      return;
    }

    if (isFavorite) {
      showToast("Already added to your favorites.", "info");
      return;
    }

    if (favoriteLoading) return;

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

      const result = await readResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to add favorite."
        );
      }

      setIsFavorite(true);

      showToast(
        "Added to your favorites successfully!",
        "success"
      );
    } catch (err) {
      console.error("Add favorite error:", err);

      showToast(
        err.message || "Something went wrong.",
        "error"
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Handle booking form changes.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // Calculate rental duration and estimated total.
  const calculateTotal = useCallback(() => {
    if (!equipment || !form.startDate || !form.endDate) {
      return 0;
    }

    // Parse date-only values as UTC to avoid timezone differences.
    const start = Date.parse(`${form.startDate}T00:00:00Z`);
    const end = Date.parse(`${form.endDate}T00:00:00Z`);

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
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

    const price = Number(equipment.rentalPrice);
    const quantity = Number(form.quantity);

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      return 0;
    }

    return price * units * quantity;
  }, [equipment, form.startDate, form.endDate, form.quantity]);

  const estimatedTotal = useMemo(
    () => calculateTotal(),
    [calculateTotal]
  );

  // Create booking and redirect to Stripe Checkout.
  const handleBooking = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");

    const token = getToken();

    if (!token) {
      showToast("Please login before booking.", "info");
      router.push("/login");
      return;
    }

    if (!equipment) {
      setError("Equipment information is not available.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Please select your rental dates.");
      return;
    }

    if (form.startDate < getToday()) {
      setError("Start date cannot be in the past.");
      return;
    }

    if (form.endDate <= form.startDate) {
      setError("End date must be after start date.");
      return;
    }

    const quantity = Number(form.quantity);
    const availableQuantity = Number(
      equipment.availableQuantity
    );

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > availableQuantity
    ) {
      setError(
        `Please enter a quantity between 1 and ${availableQuantity}.`
      );
      return;
    }

    if (!form.contactNumber.trim()) {
      setError("Please enter your contact number.");
      return;
    }

    if (!form.deliveryAddress.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (!Number.isFinite(Number(equipment.rentalPrice))) {
      setError("Invalid rental price.");
      return;
    }

    try {
      setSubmitting(true);

      // STEP 1: CREATE BOOKING.
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
            quantity,
            contactNumber: form.contactNumber.trim(),
            deliveryAddress: form.deliveryAddress.trim(),
            notes: form.notes.trim(),
          }),
        }
      );

      const bookingResult = await readResponse(bookingResponse);

      if (!bookingResponse.ok || !bookingResult.success) {
        throw new Error(
          bookingResult.message || "Booking creation failed."
        );
      }

      const bookingId = bookingResult.data?._id;

      if (!bookingId) {
        throw new Error("Booking ID was not returned by server.");
      }

      // STEP 2: CREATE STRIPE CHECKOUT SESSION.
      const paymentResponse = await fetch(
        `${API_URL}/api/payments/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
          }),
        }
      );

      const paymentResult = await readResponse(paymentResponse);

      if (!paymentResponse.ok || !paymentResult.success) {
        throw new Error(
          paymentResult.message ||
            "Payment session creation failed."
        );
      }

      if (!paymentResult.url) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      // STEP 3: REDIRECT TO STRIPE.
      window.location.href = paymentResult.url;
    } catch (err) {
      console.error("Booking error:", err);

      setError(
        err.message ||
          "Something went wrong while processing your booking."
      );

      setSubmitting(false);
    }
  };

  // Shared input styles.
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
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    marginTop: "18px",
    fontWeight: 600,
  };

  // Loading state.
  if (loading) {
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
            textAlign: "center",
            padding: "100px 20px",
          }}
        >
          <p>Loading equipment details...</p>
        </div>
      </main>
    );
  }

  // Equipment not found state.
  if (error && !equipment) {
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
            textAlign: "center",
            padding: "100px 20px",
          }}
        >
          <h2>Equipment Not Found</h2>

          <p
            style={{
              color: "var(--muted)",
              margin: "15px 0 25px",
            }}
          >
            {error}
          </p>

          <Link
            href="/equipment"
            style={{
              color: "var(--accent)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Back to Equipment
          </Link>
        </div>
      </main>
    );
  }

  if (!equipment) return null;

  const availableQuantity =
    Number(equipment.availableQuantity) || 0;

  const isAvailable = availableQuantity > 0;

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
        {/* BACK NAVIGATION */}
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
          {/* EQUIPMENT DETAILS */}
          <section>
            <img
              src={
                equipment.imageUrl ||
                "/images/placeholder.png"
              }
              alt={equipment.equipmentName || "Equipment"}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src =
                  "/images/placeholder.png";
              }}
              style={{
                width: "100%",
                height: "380px",
                objectFit: "cover",
                borderRadius: "20px",
                background: "var(--surface)",
              }}
            />

            <div style={{ marginTop: "25px" }}>
              <span
                style={{
                  color: "var(--accent)",
                  fontWeight: 700,
                }}
              >
                {equipment.category}
              </span>

              <h1
                style={{
                  fontSize: "32px",
                  margin: "10px 0",
                  lineHeight: 1.3,
                }}
              >
                {equipment.equipmentName}
              </h1>

              <p
                style={{
                  color: "var(--muted)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {equipment.description ||
                  "No description available for this equipment."}
              </p>

              {/* FAVORITE BUTTON */}
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
                  background: isFavorite
                    ? "var(--accent)"
                    : "var(--surface-card)",
                  color: isFavorite
                    ? "var(--accent-text)"
                    : "var(--foreground)",
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

              {/* EQUIPMENT SPECIFICATIONS */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
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
                  ["Available Quantity", availableQuantity],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      padding: "15px",
                      borderRadius: "12px",
                      background: "var(--surface-card)",
                      border: "1px solid var(--border)",
                      minWidth: 0,
                    }}
                  >
                    <small style={{ color: "var(--muted)" }}>
                      {label}
                    </small>

                    <p
                      style={{
                        fontWeight: 700,
                        marginTop: "6px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {value || "Not specified"}
                    </p>
                  </div>
                ))}
              </div>

              {/* RENTAL TERMS */}
              <h3 style={{ marginTop: "25px" }}>
                Rental Terms
              </h3>

              <p
                style={{
                  color: "var(--muted)",
                  lineHeight: 1.8,
                  marginTop: "8px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {equipment.rentalTerms ||
                  "Contact the equipment owner for rental terms."}
              </p>
            </div>
          </section>

          {/* BOOKING PANEL */}
          <section
            style={{
              padding: "25px",
              borderRadius: "20px",
              background: "var(--surface-card)",
              border: "1px solid var(--border)",
              minWidth: 0,
            }}
          >
            <p style={{ color: "var(--muted)" }}>
              Rental Price
            </p>

            <h2
              style={{
                fontSize: "30px",
                margin: "8px 0 25px",
              }}
            >
              ৳
              {Number(equipment.rentalPrice || 0).toLocaleString(
                "en-BD"
              )}

              <span
                style={{
                  fontSize: "15px",
                  color: "var(--muted)",
                }}
              >
                {" "}
                / {equipment.rentalType || "Daily"}
              </span>
            </h2>

            {/* AVAILABILITY STATUS */}
            <div
              style={{
                padding: "12px 15px",
                borderRadius: "10px",
                marginBottom: "22px",
                background: isAvailable
                  ? "rgba(34, 197, 94, 0.10)"
                  : "rgba(239, 68, 68, 0.10)",
                color: isAvailable ? "#16a34a" : "#dc2626",
                fontWeight: 700,
              }}
            >
              {isAvailable
                ? `${availableQuantity} unit(s) available`
                : "Currently unavailable"}
            </div>

            <h2
              style={{
                fontSize: "22px",
                marginBottom: "20px",
              }}
            >
              Book This Equipment
            </h2>

            {/* BOOKING ERROR */}
            {error && (
              <p
                role="alert"
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
              {/* START DATE */}
              <label style={labelStyle}>
                Start Date

                <input
                  type="date"
                  name="startDate"
                  required
                  min={getToday()}
                  value={form.startDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              {/* END DATE */}
              <label style={labelStyle}>
                End Date

                <input
                  type="date"
                  name="endDate"
                  required
                  min={form.startDate || getToday()}
                  value={form.endDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              {/* QUANTITY */}
              <label style={labelStyle}>
                Quantity

                <input
                  type="number"
                  name="quantity"
                  min="1"
                  max={availableQuantity}
                  required
                  value={form.quantity}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isAvailable}
                />
              </label>

              {/* CONTACT NUMBER */}
              <label style={labelStyle}>
                Contact Number

                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="Enter your phone number"
                  required
                  maxLength={20}
                  value={form.contactNumber}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              {/* DELIVERY ADDRESS */}
              <label style={labelStyle}>
                Delivery Address

                <textarea
                  name="deliveryAddress"
                  placeholder="Enter your complete address"
                  required
                  rows={3}
                  maxLength={500}
                  value={form.deliveryAddress}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              {/* OPTIONAL NOTES */}
              <label style={labelStyle}>
                Additional Notes (Optional)

                <textarea
                  name="notes"
                  placeholder="Any special instructions?"
                  rows={2}
                  maxLength={1000}
                  value={form.notes}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              {/* ESTIMATED TOTAL */}
              <div
                style={{
                  marginTop: "25px",
                  padding: "18px",
                  background: "var(--background)",
                  borderRadius: "12px",
                }}
              >
                <p style={{ color: "var(--muted)" }}>
                  Estimated Total
                </p>

                <h2
                  style={{
                    fontSize: "28px",
                    marginTop: "8px",
                  }}
                >
                  ৳
                  {estimatedTotal.toLocaleString("en-BD")}
                </h2>

                <small style={{ color: "var(--muted)" }}>
                  Final amount is calculated by the server.
                </small>
              </div>

              {/* BOOKING BUTTON */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  !isAvailable ||
                  !form.startDate ||
                  !form.endDate
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
                  opacity:
                    submitting || !isAvailable ? 0.6 : 1,
                }}
              >
                {submitting
                  ? "Processing..."
                  : !isAvailable
                    ? "Currently Unavailable"
                    : "Book & Pay Now →"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
