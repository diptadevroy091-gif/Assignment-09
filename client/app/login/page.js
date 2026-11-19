
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

  // Google Login
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  // GitHub Login
  const handleGithubLogin = () => {
    window.location.href = `${API_URL}/api/auth/github`;
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

          <h2>
            Welcome back<span>.</span>
          </h2>

          <p className="auth-subtitle">
            Enter your details to access your account.
          </p>

          {error && <div className="auth-error">{error}</div>}

          {/* Email and Password Login */}
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
              {loading
                ? "Signing in..."
                : "Sign in to your account ↗"}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="social-divider">
            <span></span>
            <p>OR CONTINUE WITH</p>
            <span></span>
          </div>

          {/* Google and GitHub Login */}
          <div className="social-login-buttons">

            <button
              type="button"
              className="social-login-btn google-login-btn"
              onClick={handleGoogleLogin}
            >
              {/* Official Google G Logo */}
              <svg
                viewBox="0 0 48 48"
                width="21"
                height="21"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M43.6 24.5c0-1.5-.1-3-.4-4.4H24v8.3h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.3Z"
                />
                <path
                  fill="#34A853"
                  d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.2c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.4A20 20 0 0 0 24 44Z"
                />
                <path
                  fill="#FBBC05"
                  d="M12.8 27.7a12 12 0 0 1 0-7.4v-5.4H5.9a20 20 0 0 0 0 18.2l6.9-5.4Z"
                />
                <path
                  fill="#EA4335"
                  d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.9 14.9l6.9 5.4c1.6-4.7 6-8.2 11.2-8.2Z"
                />
              </svg>

              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              className="social-login-btn github-login-btn"
              onClick={handleGithubLogin}
            >
              {/* Official GitHub Mark */}
              <svg
                viewBox="0 0 24 24"
                width="21"
                height="21"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.6v-2.1c-3.4.7-4.1-1.4-4.1-1.4-.5-1.3-1.2-1.7-1.2-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6.1 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17 3.3 18 3.6 18 3.6c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.8-2.9 5.8-5.6 6.1.4.4.8 1.1.8 2.2v3.8c0 .3.2.7.8.6A11.1 11.1 0 0 0 12 .9Z" />
              </svg>

              <span>Continue with GitHub</span>
            </button>

          </div>

          <div className="auth-switch">
            Don't have an account?
            <Link href="/register"> Create account</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
