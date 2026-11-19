
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const token = params.get("token");
      const userString = params.get("user");

      if (!token || !userString) {
        throw new Error("Login information is missing!");
      }

      const user = JSON.parse(userString);

      if (!user.id || !user.role || !user.email) {
        throw new Error("Invalid user information!");
      }

      localStorage.setItem("equipora-token", token);
      localStorage.setItem(
        "equipora-user",
        JSON.stringify(user)
      );

      if (user.role === "Admin") {
        router.replace("/dashboard/admin");
      } else if (user.role === "Owner") {
        router.replace("/dashboard/owner");
      } else {
        router.replace("/dashboard/customer");
      }
    } catch (err) {
      console.error("OAuth Callback Error:", err);
      setError(err.message || "Social login failed!");
    }
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "#080808",
        color: "#ffffff",
        padding: "24px",
        textAlign: "center",
      }}
    >
      {error ? (
        <>
          <h2>Login Failed</h2>
          <p>{error}</p>

          <button
            onClick={() => router.replace("/login")}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Back to Login
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: "38px",
              height: "38px",
              border: "4px solid #444",
              borderTopColor: "#ccff00",
              borderRadius: "50%",
              animation: "equipora-spin 0.8s linear infinite",
            }}
          />

          <style jsx>{`
            @keyframes equipora-spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>

          <h2 style={{ marginTop: "24px" }}>
            Completing your login...
          </h2>

          <p style={{ color: "#999" }}>
            Please wait while we redirect you.
          </p>
        </>
      )}
    </main>
  );
}
