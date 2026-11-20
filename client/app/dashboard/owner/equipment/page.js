
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { useToast } from "../../../components/ToastProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function OwnerEquipmentPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const getToken = () =>
    localStorage.getItem("equipora-token") ||
    localStorage.getItem("token");

  const fetchEquipment = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/equipment/my-equipment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        showToast("You are not authorized to view this page.", "error");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to load equipment.");
      }

      const items =
        result.data ||
        result.equipment ||
        result.equipments ||
        [];

      setEquipment(Array.isArray(items) ? items : []);
    } catch (error) {
      showToast(error.message || "Could not load equipment.", "error");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const confirmDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_BASE}/api/equipment/my-equipment/${deleteItem._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete equipment.");
      }

      setEquipment((previous) =>
        previous.filter((item) => item._id !== deleteItem._id)
      );

      showToast("Equipment deleted successfully!", "success");
      setDeleteItem(null);
    } catch (error) {
      showToast(error.message || "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "#16a34a";
    if (status === "Rejected") return "#dc2626";
    return "#d97706";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background, #080808)",
        color: "var(--foreground, #fff)",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding: "45px 20px 80px",
        }}
      >
        {/* Back to Owner Dashboard */}
        <Link
          href="/dashboard/owner"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 18px",
            marginBottom: "25px",
            background: "var(--surface-card, #151515)",
            color: "var(--foreground, #fff)",
            border: "1px solid var(--border, #333)",
            borderRadius: "9px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "700",
            transition: "all 0.2s ease",
          }}
        >
          ← Back to Owner Dashboard
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                color: "#a3e635",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "2px",
              }}
            >
              OWNER CONTROL CENTER
            </p>

            <h1 style={{ fontSize: "32px", margin: "8px 0" }}>
              My Equipment
            </h1>

            <p style={{ color: "var(--muted, #999)", fontSize: "14px" }}>
              Manage, update and monitor your listed equipment.
            </p>
          </div>

          <Link
            href="/dashboard/owner"
            style={{
              background: "#ccff00",
              color: "#111",
              padding: "12px 20px",
              borderRadius: "8px",
              fontWeight: "800",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            + Add Equipment
          </Link>
        </div>

        {/* Equipment Count */}
        <div
          style={{
            background: "var(--surface-card, #151515)",
            border: "1px solid var(--border, #333)",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "25px",
          }}
        >
          <p style={{ color: "var(--muted, #999)", fontSize: "13px" }}>
            TOTAL LISTED EQUIPMENT
          </p>

          <h2 style={{ fontSize: "30px", margin: "8px 0 0" }}>
            {equipment.length}
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 10px" }}>
            Loading your equipment...
          </div>
        ) : equipment.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "var(--surface-card, #151515)",
              border: "1px solid var(--border, #333)",
              borderRadius: "14px",
            }}
          >
            <div style={{ fontSize: "45px" }}>🛠️</div>

            <h2 style={{ margin: "15px 0 8px" }}>
              No Equipment Found
            </h2>

            <p style={{ color: "var(--muted, #999)", marginBottom: "20px" }}>
              You have not listed any equipment yet.
            </p>

            <Link
              href="/dashboard/owner"
              style={{
                display: "inline-block",
                background: "#ccff00",
                color: "#111",
                padding: "12px 20px",
                borderRadius: "8px",
                fontWeight: "800",
                textDecoration: "none",
              }}
            >
              Add Your First Equipment
            </Link>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              background: "var(--surface-card, #151515)",
              border: "1px solid var(--border, #333)",
              borderRadius: "14px",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "850px",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "var(--surface, #202020)" }}>
                  {[
                    "Equipment",
                    "Category",
                    "Price",
                    "Quantity",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "17px 15px",
                        fontSize: "12px",
                        color: "var(--muted, #aaa)",
                        borderBottom: "1px solid var(--border, #333)",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {equipment.map((item) => (
                  <tr key={item._id}>
                    <td
                      style={{
                        padding: "16px 15px",
                        borderBottom: "1px solid var(--border, #333)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <img
                          src={item.imageUrl || "/images/placeholder.png"}
                          alt={item.equipmentName}
                          style={{
                            width: "55px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "7px",
                          }}
                        />

                        <span style={{ fontWeight: "700" }}>
                          {item.equipmentName}
                        </span>
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "16px 15px",
                        borderBottom: "1px solid var(--border, #333)",
                      }}
                    >
                      {item.category || "—"}
                    </td>

                    <td
                      style={{
                        padding: "16px 15px",
                        borderBottom: "1px solid var(--border, #333)",
                      }}
                    >
                      ৳{Number(item.rentalPrice || 0).toLocaleString()} /{" "}
                      {item.rentalType || "—"}
                    </td>

                    <td
                      style={{
                        padding: "16px 15px",
                        borderBottom: "1px solid var(--border, #333)",
                      }}
                    >
                      {item.availableQuantity ?? 0}
                    </td>

                    <td
                      style={{
                        padding: "16px 15px",
                        borderBottom: "1px solid var(--border, #333)",
                      }}
                    >
                      <span
                        style={{
                          color: getStatusColor(item.status),
                          fontWeight: "800",
                          fontSize: "13px",
                        }}
                      >
                        {item.status || "Pending"}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "16px 15px",
                        borderBottom: "1px solid var(--border, #333)",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Link
                          href={`/equipment/${item._id}`}
                          style={{
                            color: "#a3e635",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: "700",
                          }}
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/owner?edit=${item._id}`}
                          style={{
                            color: "#60a5fa",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: "700",
                          }}
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => setDeleteItem(item)}
                          disabled={deleting}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#f87171",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "700",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "var(--surface-card, #181818)",
              border: "1px solid var(--border, #444)",
              borderRadius: "14px",
              padding: "25px",
            }}
          >
            <h2 style={{ marginBottom: "12px" }}>
              Delete Equipment?
            </h2>

            <p style={{ color: "var(--muted, #aaa)", lineHeight: 1.6 }}>
              Are you sure you want to delete{" "}
              <strong>{deleteItem.equipmentName}</strong>? This action cannot
              be undone.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "25px",
              }}
            >
              <button
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
                style={{
                  padding: "10px 16px",
                  borderRadius: "7px",
                  border: "1px solid var(--border, #555)",
                  background: "transparent",
                  color: "var(--foreground, white)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  padding: "10px 16px",
                  borderRadius: "7px",
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
