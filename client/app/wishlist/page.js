
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { useToast } from "../components/ToastProvider";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export default function WishlistPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // Fetch favorites from MongoDB
  const fetchFavorites = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("equipora-token") ||
        localStorage.getItem("token");

      if (!token) {
        showToast("Please login to view your wishlist.", "info");
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/favorites/my-favorites`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        showToast("Please login again.", "error");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load favorites.");
      }

      console.log("Wishlist API response:", result);

      setFavorites(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Wishlist loading error:", error);
      showToast(error.message || "Could not load wishlist.", "error");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Remove favorite
  const handleRemove = async (item) => {
    const equipment = item.equipmentId;
    const equipmentId = equipment?._id;

    if (!equipmentId) {
      showToast("Equipment information is missing.", "error");
      return;
    }

    const token =
      localStorage.getItem("equipora-token") ||
      localStorage.getItem("token");

    try {
      setRemovingId(equipmentId);

      const response = await fetch(
        `${API_URL}/api/favorites/${equipmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to remove favorite.");
      }

      setFavorites((previous) =>
        previous.filter(
          (favorite) => favorite.equipmentId?._id !== equipmentId
        )
      );

      showToast(
        `${equipment.equipmentName} removed from your wishlist.`,
        "success"
      );
    } catch (error) {
      showToast(error.message || "Could not remove favorite.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background, #080808)",
        color: "var(--foreground, #ffffff)",
      }}
    >
      <Navbar />

      <section
        style={{
          padding: "55px 6% 80px",
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        <span
          style={{
            color: "var(--accent, #c9f269)",
            letterSpacing: "2px",
            fontWeight: "600",
          }}
        >
          YOUR COLLECTION
        </span>

        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", margin: "15px 0" }}>
          My Wishlist
          <span style={{ color: "var(--accent, #c9f269)" }}>.</span>
        </h1>

        <p style={{ color: "var(--muted, #999999)", marginBottom: "35px" }}>
          All the equipment you have saved for later.
        </p>

        {loading ? (
          <p style={{ textAlign: "center", padding: "50px" }}>
            Loading your wishlist...
          </p>
        ) : favorites.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "65px 20px",
              background: "var(--surface-card, #151515)",
              border: "1px solid var(--border, #292929)",
              borderRadius: "16px",
            }}
          >
            <div style={{ fontSize: "55px", marginBottom: "15px" }}>♡</div>

            <h2>Your wishlist is empty.</h2>

            <p
              style={{
                color: "var(--muted, #999999)",
                margin: "15px 0 25px",
              }}
            >
              Explore equipment and save your favorites here.
            </p>

            <Link
              href="/equipment"
              style={{
                display: "inline-block",
                background: "var(--accent, #c9f269)",
                color: "var(--accent-text, #080808)",
                padding: "13px 23px",
                borderRadius: "30px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Browse Equipment ↗
            </Link>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: "22px" }}>
              <strong>{favorites.length}</strong> saved items
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                gap: "25px",
              }}
            >
              {favorites.map((item) => {
                const equipment = item.equipmentId;

                if (!equipment || !equipment._id) return null;

                return (
                  <article
                    key={item._id}
                    style={{
                      overflow: "hidden",
                      borderRadius: "14px",
                      border: "1px solid var(--border, #292929)",
                      background: "var(--surface-card, #151515)",
                    }}
                  >
                    <div
                      style={{
                        height: "210px",
                        backgroundImage: equipment.imageUrl
                          ? `url("${equipment.imageUrl}")`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#252525",
                      }}
                    />

                    <div style={{ padding: "20px" }}>
                      <span
                        style={{
                          color: "var(--accent, #c9f269)",
                          textTransform: "uppercase",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {equipment.category}
                      </span>

                      <h3 style={{ margin: "12px 0", fontSize: "19px" }}>
                        {equipment.equipmentName}
                      </h3>

                      <p
                        style={{
                          marginBottom: "18px",
                          color: "var(--muted, #999999)",
                        }}
                      >
                        <strong style={{ color: "var(--foreground)" }}>
                          ৳
                          {Number(equipment.rentalPrice || 0).toLocaleString()}
                        </strong>{" "}
                        / {equipment.rentalType}
                      </p>

                      <p
                        style={{
                          color: "var(--muted, #999999)",
                          fontSize: "13px",
                          marginBottom: "18px",
                        }}
                      >
                        📍 {equipment.location || "Location not specified"}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Link
                          href={`/equipment/${equipment._id}`}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "11px",
                            borderRadius: "8px",
                            background: "var(--accent, #c9f269)",
                            color: "var(--accent-text, #080808)",
                            textDecoration: "none",
                            fontWeight: "bold",
                          }}
                        >
                          View Details
                        </Link>

                        <button
                          type="button"
                          disabled={removingId === equipment._id}
                          onClick={() => handleRemove(item)}
                          style={{
                            padding: "11px 14px",
                            borderRadius: "8px",
                            border: "1px solid #ef4444",
                            background: "transparent",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          {removingId === equipment._id
                            ? "Removing..."
                            : "♥ Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
