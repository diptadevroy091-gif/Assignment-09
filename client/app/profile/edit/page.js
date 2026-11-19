
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ToastProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function EditProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    photoURL: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("equipora-token");

      if (!token) {
        showToast("Please login first.", "error");
        setLoading(false);
        router.replace("/login");
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

        const user = result.data;

        setFormData({
          name: user.name || "",
          photoURL: user.photoURL || "",
          phone: user.phone || "",
          address: user.address || "",
        });
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router, showToast]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("equipora-token");

    if (!token) {
      showToast("Please login first.", "error");
      router.replace("/login");
      return;
    }

    if (!formData.name.trim()) {
      showToast("Name is required.", "error");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          photoURL: formData.photoURL.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Profile update failed.");
      }

      const updatedUser = result.data;

      setFormData({
        name: updatedUser.name || "",
        photoURL: updatedUser.photoURL || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
      });

      localStorage.setItem(
        "equipora-user",
        JSON.stringify(updatedUser)
      );

      showToast("Profile updated successfully!", "success");

      router.push("/profile");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <p style={{ color: "var(--muted)" }}>
          Loading profile...
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p
            className="text-sm font-semibold tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            ACCOUNT SETTINGS
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Edit Profile
          </h1>

          <p className="mt-2" style={{ color: "var(--muted)" }}>
            Update your personal information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border p-6 sm:p-8"
          style={{
            background: "var(--surface-card)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border px-4 py-3 outline-none"
              style={{
                background: "var(--input-background)",
                color: "var(--input-text)",
                borderColor: "var(--border)",
              }}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Profile Photo URL
            </label>

            <input
              type="url"
              name="photoURL"
              value={formData.photoURL}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3 outline-none"
              style={{
                background: "var(--input-background)",
                color: "var(--input-text)",
                borderColor: "var(--border)",
              }}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3 outline-none"
              style={{
                background: "var(--input-background)",
                color: "var(--input-text)",
                borderColor: "var(--border)",
              }}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Address
            </label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={4}
              className="w-full resize-none rounded-xl border px-4 py-3 outline-none"
              style={{
                background: "var(--input-background)",
                color: "var(--input-text)",
                borderColor: "var(--border)",
              }}
              placeholder="Enter your address"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/profile"
              className="rounded-xl border px-6 py-3 text-center font-semibold"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="primary-btn rounded-xl px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
