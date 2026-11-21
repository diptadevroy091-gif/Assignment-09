
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./auth.css";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const readResponse = async (response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid response received from server.");
  }
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    photoURL: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const photoURL = form.photoURL.trim();
    const password = form.password;

    if (name.length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (name.length > 80) {
      setError("Name cannot exceed 80 characters.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (photoURL) {
      try {
        const parsedURL = new URL(photoURL);

        if (!["http:", "https:"].includes(parsedURL.protocol)) {
          throw new Error();
        }
      } catch {
        setError("Please enter a valid profile photo URL.");
        return;
      }
    }

    if (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password)
    ) {
      setError(
        "Password must contain at least 6 characters, one uppercase and one lowercase letter."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          photoURL,
          password,
        }),
      });

      const result = await readResponse(response);

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Registration failed. Please try again."
        );
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setForm({
        name: "",
        email: "",
        photoURL: "",
        password: "",
      });

      router.push("/login");
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-left">
        <Link href="/" className="brand auth-brand">
          <span className="brand-icon">E</span>
          equipora<span className="brand-dot">.</span>
        </Link>

        <div className="auth-left-content">
          <span className="auth-eyebrow">JOIN THE COMMUNITY</span>

          <h1>
            Make room
            <br />
            for <span>better work.</span>
          </h1>

          <p>
            Create your Equipora account and discover a smarter
            way to rent and manage equipment.
          </p>
        </div>

        <div className="auth-left-footer">
          © 2026 Equipora. Built for better work.
        </div>
      </div>

      <div className="auth-right">
        <Link href="/" className="auth-back">
          ← Back to home
        </Link>

        <div className="auth-form-container">
          <span className="auth-eyebrow">GET STARTED</span>

          <h2>
            Create account<span>.</span>
          </h2>

          <p className="auth-subtitle">
            Fill in your details to join Equipora.
          </p>

          {error && (
            <div className="auth-error" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          {success && (
            <div
              className="auth-success"
              role="status"
              aria-live="polite"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="name">Full name</label>

            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              maxLength={80}
              required
              disabled={loading}
            />

            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
              disabled={loading}
            />

            <label htmlFor="photoURL">
              Profile photo URL (optional)
            </label>

            <input
              id="photoURL"
              type="url"
              name="photoURL"
              placeholder="https://example.com/photo.jpg"
              value={form.photoURL}
              onChange={handleChange}
              disabled={loading}
            />

            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p className="password-hint">
              Minimum 6 characters, including uppercase and lowercase
              letters.
            </p>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create my account ↗"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?
            <Link href="/login"> Sign in</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
