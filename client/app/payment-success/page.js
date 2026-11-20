
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState(
    "Please wait while we verify your payment..."
  );

  const verifyPayment = async () => {
    if (!sessionId) {
      setStatus("error");
      setMessage("Payment session ID is missing.");
      return;
    }

    try {
      // Check both token names
      const token =
        localStorage.getItem("equipora-token") ||
        localStorage.getItem("token");

      if (!token) {
        setStatus("login");
        setMessage(
          "Your payment session is saved. Please login to verify your payment."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/payments/verify-session?session_id=${encodeURIComponent(sessionId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          setStatus("login");
          setMessage("Your login session has expired. Please login again.");
          return;
        }

        throw new Error(
          result.message || "Payment verification failed."
        );
      }

      if (result.paymentStatus === "Paid") {
        setStatus("success");
        setMessage(
          "Your payment has been verified successfully. Your booking is confirmed!"
        );
      } else {
        setStatus("pending");
        setMessage(
          "Your payment is not confirmed yet. Please check again shortly."
        );
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [sessionId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <Navbar />

      <section
        style={{
          minHeight: "75vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "550px",
            padding: "45px 30px",
            borderRadius: "24px",
            textAlign: "center",
            background: "var(--surface-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: "65px", marginBottom: "20px" }}>
            {status === "success"
              ? "🎉"
              : status === "checking"
              ? "⏳"
              : status === "pending"
              ? "⌛"
              : status === "login"
              ? "🔐"
              : "⚠️"}
          </div>

          <h1
            style={{
              fontSize: "30px",
              fontWeight: 800,
              marginBottom: "15px",
            }}
          >
            {status === "success"
              ? "Payment Successful!"
              : status === "checking"
              ? "Verifying Payment..."
              : status === "pending"
              ? "Payment Processing"
              : status === "login"
              ? "Login Required"
              : "Payment Verification"}
          </h1>

          <p
            style={{
              color: "var(--muted)",
              lineHeight: 1.7,
              marginBottom: "30px",
            }}
          >
            {message}
          </p>

          {status === "success" && (
            <Link href="/dashboard/customer" style={buttonStyle}>
              Go to My Dashboard →
            </Link>
          )}

          {status === "pending" && (
            <button
              onClick={verifyPayment}
              style={buttonStyle}
            >
              Check Again
            </button>
          )}

          {status === "login" && (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(
                `/payment-success?session_id=${sessionId}`
              )}`}
              style={buttonStyle}
            >
              Login to Verify →
            </Link>
          )}

          {status === "error" && (
            <button onClick={verifyPayment} style={buttonStyle}>
              Try Again
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

const buttonStyle = {
  display: "inline-block",
  padding: "13px 25px",
  border: "none",
  borderRadius: "30px",
  background: "var(--accent)",
  color: "var(--accent-text)",
  textDecoration: "none",
  fontWeight: 700,
  cursor: "pointer",
};

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "50px", textAlign: "center" }}>
          Verifying payment...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
