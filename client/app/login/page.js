
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./auth.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed!");
      }

      localStorage.setItem("equipora-token", result.token);
      localStorage.setItem(
        "equipora-user",
        JSON.stringify(result.data)
      );

      if (result.data.role === "Admin") {
        router.push("/dashboard/admin");
      } else if (result.data.role === "Owner") {
        router.push("/dashboard/owner");
      } else {
        router.push("/dashboard/customer");
      }
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
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>
            Good things
            <br />
            start with
            <br />
            <span>the right tools.</span>
          </h1>
          <p>
            Your next project is waiting. Sign in and
            discover equipment that gets the job done.
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
          <span className="auth-eyebrow">YOUR ACCOUNT</span>
          <h2>Welcome back<span>.</span></h2>
          <p className="auth-subtitle">
            Enter your details to access your account.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
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

            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
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

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in to your account ↗"}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account?
            <Link href="/register"> Create account</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
