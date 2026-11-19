
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./auth.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      form.password.length < 6 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password)
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
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed!");
      }

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(err.message);
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
          <h2>Create account<span>.</span></h2>
          <p className="auth-subtitle">
            Fill in your details to join Equipora.
          </p>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="photoURL">Profile photo URL (optional)</label>
            <input
              id="photoURL"
              type="url"
              name="photoURL"
              placeholder="https://example.com/photo.jpg"
              value={form.photoURL}
              onChange={handleChange}
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
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p className="password-hint">
              Minimum 6 characters, including uppercase and lowercase letters.
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
