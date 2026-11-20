
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { useToast } from "../../../components/ToastProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [confirmUser, setConfirmUser] = useState(null);

  const cardStyle = {
    background: "var(--surface-card, #151515)",
    border: "1px solid var(--border, #292929)",
    borderRadius: "14px",
  };

  const buttonStyle = {
    border: "1px solid var(--border, #444)",
    borderRadius: "8px",
    padding: "9px 13px",
    fontWeight: "600",
    cursor: "pointer",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid var(--border, #333)",
    background: "var(--background, #080808)",
    color: "var(--foreground, #fff)",
    outline: "none",
    boxSizing: "border-box",
  };

  const getToken = () =>
    localStorage.getItem("equipora-token") ||
    localStorage.getItem("token");

  const isCurrentAdmin = (targetUser) => {
    if (!admin || !targetUser) return false;

    const sameId =
      String(targetUser._id) === String(admin._id);

    const sameEmail =
      (targetUser.email || "").toLowerCase() ===
      (admin.email || "").toLowerCase();

    return sameId || sameEmail;
  };

  const fetchUsers = async (token) => {
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load users.");
      }

      setUsers(result.data || []);
    } catch (error) {
      showToast(error.message || "Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    const savedUser = localStorage.getItem("equipora-user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const currentUser = JSON.parse(savedUser);

      if (currentUser.role !== "Admin") {
        router.replace(
          currentUser.role === "Owner"
            ? "/dashboard/owner"
            : "/dashboard/customer"
        );
        return;
      }

      setAdmin(currentUser);
      fetchUsers(token);
    } catch {
      localStorage.removeItem("equipora-token");
      localStorage.removeItem("equipora-user");
      router.replace("/login");
    }
  }, [router]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (user.name || "").toLowerCase().includes(searchText) ||
        (user.email || "").toLowerCase().includes(searchText);

      const matchesRole =
        roleFilter === "All" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (targetUser, newRole) => {
    if (isCurrentAdmin(targetUser)) {
      showToast("You cannot change your own Admin role.", "warning");
      return;
    }

    if (targetUser.role === newRole) return;

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setUpdatingId(targetUser._id);

      const response = await fetch(
        `${API_BASE}/api/users/${targetUser._id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Role update failed.");
      }

      setUsers((previous) =>
        previous.map((item) =>
          item._id === targetUser._id
            ? { ...item, role: result.data.role }
            : item
        )
      );

      showToast(result.message || "User role updated!", "success");
    } catch (error) {
      showToast(error.message || "Could not update role.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBlockClick = (targetUser) => {
    if (isCurrentAdmin(targetUser)) {
      showToast("You cannot block your own Admin account.", "warning");
      return;
    }

    setConfirmUser(targetUser);
  };

  const confirmBlockAction = async () => {
    if (!confirmUser) return;

    const targetUser = confirmUser;

    if (isCurrentAdmin(targetUser)) {
      setConfirmUser(null);
      showToast("You cannot block your own Admin account.", "warning");
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const nextStatus = !targetUser.isBlocked;

    try {
      setUpdatingId(targetUser._id);

      const response = await fetch(
        `${API_BASE}/api/users/${targetUser._id}/block`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isBlocked: nextStatus }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "User status update failed.");
      }

      setUsers((previous) =>
        previous.map((item) =>
          item._id === targetUser._id
            ? { ...item, isBlocked: result.data.isBlocked }
            : item
        )
      );

      setConfirmUser(null);

      showToast(
        result.message ||
          (nextStatus ? "User blocked!" : "User unblocked!"),
        "success"
      );
    } catch (error) {
      showToast(error.message || "Could not update user status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const roleColor = (role) => {
    if (role === "Admin") return "#c4a7ff";
    if (role === "Owner") return "#83c8ff";
    return "#9be7a5";
  };

  if (!admin) {
    return (
      <>
        <Navbar />
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "var(--background, #080808)",
            color: "var(--foreground, #fff)",
          }}
        >
          Loading Admin Users...
        </main>
      </>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background, #080808)",
        color: "var(--foreground, #fff)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
          padding: "35px 5%",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          {/* Same Back Button Design as All Rentals and Analytics */}
          <Link
            href="/dashboard/admin"
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              border: "1px solid var(--border, #e5e7eb)",
              background: "var(--surface-card, #ffffff)",
              color: "var(--foreground, #171717)",
              fontWeight: "700",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ← Back to Admin Dashboard
          </Link>

          <p
            style={{
              color: "var(--accent, #c9f269)",
              letterSpacing: "2px",
              fontSize: "12px",
              marginTop: "25px",
            }}
          >
            ADMIN CONTROL CENTER
          </p>

          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)" }}>
            All Users
          </h1>

          <p style={{ color: "var(--muted, #999)", lineHeight: 1.7 }}>
            Manage registered users, update account roles and control access.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            { title: "Total Users", value: users.length },
            {
              title: "Customers",
              value: users.filter((u) => u.role === "Customer").length,
            },
            {
              title: "Owners",
              value: users.filter((u) => u.role === "Owner").length,
            },
            {
              title: "Admins",
              value: users.filter((u) => u.role === "Admin").length,
            },
            {
              title: "Blocked Users",
              value: users.filter((u) => u.isBlocked).length,
            },
          ].map((stat) => (
            <div key={stat.title} style={{ ...cardStyle, padding: "20px" }}>
              <p style={{ color: "var(--muted, #999)", margin: 0 }}>
                {stat.title}
              </p>
              <h2
                style={{
                  fontSize: "30px",
                  color: "var(--accent, #c9f269)",
                  marginBottom: 0,
                }}
              >
                {stat.value}
              </h2>
            </div>
          ))}
        </div>

        <section style={{ ...cardStyle, padding: "22px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "22px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: "24px" }}>
                User Management
              </h2>
              <p style={{ margin: 0, color: "var(--muted, #999)" }}>
                {filteredUsers.length} users found
              </p>
            </div>

            <button
              onClick={() => fetchUsers(getToken())}
              disabled={loading}
              style={{
                ...buttonStyle,
                background: "var(--accent, #c9f269)",
                color: "var(--accent-text, #080808)",
              }}
            >
              {loading ? "Refreshing..." : "Refresh Users"}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            <input
              style={inputStyle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
            />

            <select
              style={inputStyle}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Customer">Customer</option>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {loading ? (
            <div style={{ padding: "35px", textAlign: "center" }}>
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                padding: "45px 15px",
                textAlign: "center",
                color: "var(--muted, #999)",
              }}
            >
              <h3>No Users Found</h3>
              <p>Try changing your search or role filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "850px",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border, #333)" }}>
                    {[
                      "USER",
                      "EMAIL",
                      "ROLE",
                      "REGISTERED",
                      "STATUS",
                      "ACTIONS",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "15px 12px",
                          color: "var(--muted, #999)",
                          fontSize: "11px",
                          letterSpacing: "1px",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((targetUser) => {
                    const isSelf = isCurrentAdmin(targetUser);
                    const isUpdating = updatingId === targetUser._id;

                    return (
                      <tr
                        key={targetUser._id}
                        style={{
                          borderBottom: "1px solid var(--border, #292929)",
                        }}
                      >
                        <td style={{ padding: "17px 12px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <img
                              src={
                                targetUser.photoURL ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  targetUser.name || "User"
                                )}&background=252525&color=ffffff`
                              }
                              alt={targetUser.name || "User"}
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />

                            <div>
                              <strong>
                                {targetUser.name || "Unnamed User"}
                              </strong>

                              {isSelf && (
                                <div
                                  style={{
                                    color: "var(--accent, #c9f269)",
                                    fontSize: "11px",
                                    marginTop: "4px",
                                  }}
                                >
                                  You — Protected Admin
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "17px 12px",
                            color: "var(--muted, #aaa)",
                          }}
                        >
                          {targetUser.email}
                        </td>

                        <td style={{ padding: "17px 12px" }}>
                          <select
                            value={targetUser.role || "Customer"}
                            disabled={isSelf || isUpdating}
                            onChange={(e) =>
                              handleRoleChange(targetUser, e.target.value)
                            }
                            style={{
                              ...inputStyle,
                              width: "125px",
                              padding: "8px",
                              color: roleColor(targetUser.role),
                              fontWeight: "bold",
                              opacity: isSelf ? 0.5 : 1,
                              cursor: isSelf ? "not-allowed" : "pointer",
                            }}
                          >
                            <option value="Customer">Customer</option>
                            <option value="Owner">Owner</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>

                        <td
                          style={{
                            padding: "17px 12px",
                            color: "var(--muted, #aaa)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(targetUser.createdAt)}
                        </td>

                        <td style={{ padding: "17px 12px" }}>
                          <span
                            style={{
                              padding: "6px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              background: targetUser.isBlocked
                                ? "rgba(239,68,68,0.15)"
                                : "rgba(34,197,94,0.12)",
                              color: targetUser.isBlocked
                                ? "#ff8585"
                                : "#9be7a5",
                            }}
                          >
                            {targetUser.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>

                        <td style={{ padding: "17px 12px" }}>
                          <button
                            disabled={isSelf || isUpdating}
                            onClick={() => handleBlockClick(targetUser)}
                            style={{
                              ...buttonStyle,
                              background: targetUser.isBlocked
                                ? "#17452c"
                                : "#381919",
                              color: targetUser.isBlocked
                                ? "#9be7a5"
                                : "#ff9999",
                              borderColor: targetUser.isBlocked
                                ? "#286b42"
                                : "#713333",
                              opacity: isSelf ? 0.5 : 1,
                              cursor: isSelf ? "not-allowed" : "pointer",
                            }}
                          >
                            {isSelf
                              ? "Protected"
                              : isUpdating
                                ? "Updating..."
                                : targetUser.isBlocked
                                  ? "Unblock"
                                  : "Block"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {confirmUser && (
        <div
          onClick={() => {
            if (!updatingId) setConfirmUser(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,0.75)",
            display: "grid",
            placeItems: "center",
            padding: "20px",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "28px",
              borderRadius: "16px",
              background: "var(--surface-card, #151515)",
              border: "1px solid var(--border, #333)",
              color: "var(--foreground, #fff)",
            }}
          >
            <h2>
              {confirmUser.isBlocked ? "Unblock User?" : "Block User?"}
            </h2>

            <p style={{ color: "var(--muted, #999)", lineHeight: 1.7 }}>
              Are you sure you want to{" "}
              <strong>
                {confirmUser.isBlocked ? "unblock" : "block"}
              </strong>{" "}
              {confirmUser.name || confirmUser.email}?
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => setConfirmUser(null)}
                disabled={Boolean(updatingId)}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  background: "var(--surface, #252525)",
                  color: "var(--foreground, #fff)",
                }}
              >
                Cancel
              </button>

              <button
                onClick={confirmBlockAction}
                disabled={Boolean(updatingId)}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  background: confirmUser.isBlocked ? "#16803d" : "#dc2626",
                  color: "#fff",
                  border: "none",
                }}
              >
                {updatingId ? "Please wait..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
