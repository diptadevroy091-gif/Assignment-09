
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "../components/ToastProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("equipora-token");

      if (!token) {
        showToast("Please login to view your profile.", "error");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load profile.");
        }

        setUser(result.data);

        localStorage.setItem(
          "equipora-user",
          JSON.stringify(result.data)
        );
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [showToast]);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <p style={{ color: "var(--muted)" }}>
          Loading your profile...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <h2 className="text-xl font-bold">
          Profile unavailable
        </h2>

        <Link
          href="/login"
          className="primary-btn rounded-lg px-5 py-3"
        >
          Login Now
        </Link>

        <Link
          href="/"
          className="text-sm font-semibold"
          style={{ color: "var(--muted)" }}
        >
          ← Back to Home
        </Link>
      </main>
    );
  }

  const initial = user.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="mx-auto max-w-3xl">

        {/* Page Heading */}
        <div className="mb-8">
          <p
            className="text-sm font-semibold tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            ACCOUNT SETTINGS
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            My Profile
          </h1>

          <p
            className="mt-2"
            style={{ color: "var(--muted)" }}
          >
            View and manage your Equipora account information.
          </p>
        </div>

        {/* Profile Card */}
        <section
          className="overflow-hidden rounded-2xl border"
          style={{
            background: "var(--surface-card)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          {/* User Information */}
          <div
            className="flex flex-col items-center gap-4 border-b p-8 sm:flex-row"
            style={{ borderColor: "var(--border)" }}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-24 w-24 rounded-full border-4 object-cover"
                style={{ borderColor: "var(--accent)" }}
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {initial}
              </div>
            )}

            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">
                {user.name}
              </h2>

              <p
                className="mt-1"
                style={{ color: "var(--muted)" }}
              >
                {user.email}
              </p>

              <span
                className="mt-3 inline-block rounded-full px-4 py-1 text-sm font-semibold"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid gap-6 p-8 sm:grid-cols-2">

            <div>
              <p
                className="text-sm"
                style={{ color: "var(--muted)" }}
              >
                Full Name
              </p>

              <p className="mt-1 font-semibold">
                {user.name || "Not added"}
              </p>
            </div>

            <div>
              <p
                className="text-sm"
                style={{ color: "var(--muted)" }}
              >
                Email Address
              </p>

              <p className="mt-1 break-all font-semibold">
                {user.email}
              </p>
            </div>

            <div>
              <p
                className="text-sm"
                style={{ color: "var(--muted)" }}
              >
                Phone Number
              </p>

              <p className="mt-1 font-semibold">
                {user.phone || "Not added"}
              </p>
            </div>

            <div>
              <p
                className="text-sm"
                style={{ color: "var(--muted)" }}
              >
                Address
              </p>

              <p className="mt-1 font-semibold">
                {user.address || "Not added"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex flex-col gap-3 border-t p-6 sm:flex-row sm:justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <Link
              href="/"
              className="rounded-xl border px-6 py-3 text-center font-semibold transition hover:opacity-80"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              ← Back to Home
            </Link>

            <Link
              href="/profile/edit"
              className="primary-btn rounded-xl px-6 py-3 text-center font-semibold"
            >
              ✏️ Edit Profile
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
