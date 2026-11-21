
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { useToast } from "../../components/ToastProvider";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const categories = [
  "Construction Equipment",
  "Photography Equipment",
  "Vehicles & Transportation",
  "Agriculture Equipment",
  "Electronics",
  "Event Equipment",
];

const initialForm = {
  equipmentName: "",
  description: "",
  category: "",
  location: "",
  rentalPrice: "",
  rentalType: "Daily",
  availableQuantity: "",
  condition: "",
  brand: "",
  model: "",
  imageUrl: "",
  rentalTerms: "",
};

const cardStyle = {
  background: "var(--surface-card, #151515)",
  border: "1px solid var(--border, #292929)",
  borderRadius: "14px",
  padding: "24px",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  background: "var(--background, #080808)",
  color: "var(--foreground, #fff)",
  border: "1px solid var(--border, #333)",
  borderRadius: "8px",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "9px",
  color: "var(--foreground, #ccc)",
  fontSize: "14px",
  fontWeight: "600",
};

const buttonStyle = {
  background: "var(--accent, #c9f269)",
  color: "var(--accent-text, #080808)",
  border: "none",
  padding: "13px 22px",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "inline-block",
  textAlign: "center",
  textDecoration: "none",
};

const secondaryButtonStyle = {
  background: "var(--surface, #252525)",
  color: "var(--foreground, #fff)",
  border: "1px solid var(--border, #444)",
  padding: "11px 18px",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
};

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

export default function OwnerDashboard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("equipora-token") ||
        localStorage.getItem("token")
      : null;

  const fetchMyEquipment = async (token = getToken(), showErrorToast = true) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch(
        `${API_BASE}/api/equipment/my-equipment`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const result = await readResponse(response);

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid equipment data received from server.");
      }

      setEquipment(result.data);
    } catch (error) {
      setLoadError(error.message || "Could not load your equipment.");

      if (showErrorToast) {
        showToast(
          error.message || "Could not load your equipment.",
          "error"
        );
      }
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

      if (currentUser.role !== "Owner") {
        router.replace(
          currentUser.role === "Admin"
            ? "/dashboard/admin"
            : "/dashboard/customer"
        );
        return;
      }

      setUser(currentUser);
      fetchMyEquipment(token);
    } catch {
      localStorage.removeItem("equipora-token");
      localStorage.removeItem("token");
      localStorage.removeItem("equipora-user");
      router.replace("/login");
    }
    // Authentication is checked once when the dashboard mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const statistics = useMemo(() => {
    const total = equipment.length;

    const approved = equipment.filter(
      (item) => item.status === "Approved"
    ).length;

    const pending = equipment.filter(
      (item) => item.status === "Pending"
    ).length;

    const rejected = equipment.filter(
      (item) => item.status === "Rejected"
    ).length;

    return { total, approved, pending, rejected };
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return equipment.filter((item) => {
      const matchesSearch =
        !search ||
        [
          item.equipmentName,
          item.category,
          item.location,
          item.brand,
          item.model,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [equipment, searchTerm, statusFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);

    setForm({
      equipmentName: item.equipmentName || "",
      description: item.description || "",
      category: item.category || "",
      location: item.location || "",
      rentalPrice: String(item.rentalPrice ?? ""),
      rentalType: item.rentalType || "Daily",
      availableQuantity: String(item.availableQuantity ?? ""),
      condition: item.condition || "",
      brand: item.brand || "",
      model: item.model || "",
      imageUrl: item.imageUrl || "",
      rentalTerms: item.rentalTerms || "",
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    if (submitting) return;

    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const price = Number(form.rentalPrice);
    const quantity = Number(form.availableQuantity);

    if (!Number.isFinite(price) || price <= 0) {
      showToast("Please enter a valid rental price.", "error");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      showToast("Available quantity must be at least 1.", "error");
      return;
    }

    const token = getToken();

    if (!token) {
      showToast("Please login again.", "error");
      router.replace("/login");
      return;
    }

    setSubmitting(true);

    try {
      const equipmentData = {
        ...form,
        equipmentName: form.equipmentName.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        rentalTerms: form.rentalTerms.trim(),
        rentalPrice: price,
        availableQuantity: quantity,
      };

      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${API_BASE}/api/equipment/my-equipment/${editingId}`
        : `${API_BASE}/api/equipment`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(equipmentData),
      });

      const result = await readResponse(response);

      showToast(
        result.message ||
          (isEditing
            ? "Equipment updated successfully!"
            : "Equipment added successfully!"),
        "success"
      );

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);

      await fetchMyEquipment(token, false);
    } catch (error) {
      showToast(
        error.message || "Equipment could not be saved.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    if (deletingId) return;
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || deletingId) return;

    const item = itemToDelete;
    const token = getToken();

    if (!token) {
      showToast("Please login again.", "error");
      router.replace("/login");
      return;
    }

    setDeletingId(item._id);

    try {
      const response = await fetch(
        `${API_BASE}/api/equipment/my-equipment/${item._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await readResponse(response);

      setItemToDelete(null);

      if (editingId === item._id) {
        setShowForm(false);
        setEditingId(null);
        setForm(initialForm);
      }

      showToast(
        result.message || "Equipment deleted successfully!",
        "success"
      );

      await fetchMyEquipment(token, false);
    } catch (error) {
      showToast(
        error.message || "Equipment could not be deleted.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "#9be7a5";
    if (status === "Rejected") return "#ff8585";
    return "#ffd479";
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <main
          style={{
            minHeight: "100vh",
            background: "var(--background, #080808)",
            color: "var(--foreground, #fff)",
            display: "grid",
            placeItems: "center",
          }}
        >
          Loading Owner Dashboard...
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
          padding: "35px 6%",
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        <section style={{ marginTop: "20px" }}>
          <p
            style={{
              color: "var(--accent, #c9f269)",
              letterSpacing: "2px",
              fontSize: "12px",
            }}
          >
            EQUIPMENT OWNER PANEL
          </p>

          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 46px)",
              marginBottom: "12px",
            }}
          >
            Welcome, {user.name || "Owner"}!
          </h1>

          <p style={{ color: "var(--muted, #999)", lineHeight: 1.7 }}>
            Manage your equipment rental business from your dashboard.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "22px",
            }}
          >
            <Link href="/dashboard/owner/analytics" style={buttonStyle}>
              📊 Owner Analytics →
            </Link>

            <Link
              href="/dashboard/owner/equipment"
              style={secondaryButtonStyle}
            >
              🛠️ My Equipment
            </Link>

            <Link
              href="/dashboard/owner/rentals"
              style={secondaryButtonStyle}
            >
              📋 My Equipment Rentals
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginTop: "30px",
            }}
          >
            <div style={cardStyle}>
              <p style={{ color: "var(--muted, #999)" }}>Account Type</p>
              <h2 style={{ color: "var(--accent, #c9f269)" }}>
                Equipment Owner
              </h2>
            </div>

            <div style={cardStyle}>
              <p style={{ color: "var(--muted, #999)" }}>Owner Name</p>
              <h2>{user.name || "Owner"}</h2>
            </div>

            <div style={cardStyle}>
              <p style={{ color: "var(--muted, #999)" }}>Owner Email</p>
              <h3 style={{ overflowWrap: "anywhere" }}>{user.email}</h3>
            </div>
          </div>
        </section>

        {/* Equipment Statistics */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "35px",
          }}
        >
          {[
            {
              label: "Total Equipment",
              value: statistics.total,
              color: "var(--accent, #c9f269)",
            },
            {
              label: "Approved",
              value: statistics.approved,
              color: "#9be7a5",
            },
            {
              label: "Pending",
              value: statistics.pending,
              color: "#ffd479",
            },
            {
              label: "Rejected",
              value: statistics.rejected,
              color: "#ff8585",
            },
          ].map((stat) => (
            <div key={stat.label} style={cardStyle}>
              <p style={{ color: "var(--muted, #999)", marginTop: 0 }}>
                {stat.label}
              </p>
              <h2
                style={{
                  color: stat.color,
                  fontSize: "32px",
                  marginBottom: 0,
                }}
              >
                {stat.value}
              </h2>
            </div>
          ))}
        </section>

        {/* Equipment Management */}
        <section style={{ marginTop: "45px" }}>
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
              <h2 style={{ fontSize: "27px", marginBottom: "8px" }}>
                My Equipment
              </h2>
              <p style={{ color: "var(--muted, #999)", margin: 0 }}>
                Manage the equipment you have submitted.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => fetchMyEquipment()}
                style={secondaryButtonStyle}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh List"}
              </button>

              <button
                onClick={showForm ? closeForm : openAddForm}
                style={buttonStyle}
                disabled={submitting}
              >
                {showForm ? "Close Form" : "+ Add Equipment"}
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div
            style={{
              ...cardStyle,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "15px",
              marginBottom: "22px",
            }}
          >
            <div>
              <label style={labelStyle}>Search Equipment</label>
              <input
                style={inputStyle}
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, category, brand..."
              />
            </div>

            <div>
              <label style={labelStyle}>Filter by Status</label>
              <select
                style={inputStyle}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div style={{ ...cardStyle, marginBottom: "30px" }}>
              <h2 style={{ marginTop: 0, marginBottom: "25px" }}>
                {editingId ? "Edit Equipment" : "Add New Equipment"}
              </h2>

              {editingId && (
                <p style={{ color: "#ffd479", lineHeight: 1.6 }}>
                  Note: After editing, this equipment will return to Pending
                  status and require admin approval again.
                </p>
              )}

              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {[
                    ["equipmentName", "Equipment Name", "e.g. Canon Camera", "text"],
                    ["brand", "Brand", "e.g. Canon", "text"],
                    ["model", "Model", "e.g. EOS 90D", "text"],
                    ["location", "Location", "e.g. Dhaka, Bangladesh", "text"],
                    ["rentalPrice", "Rental Price", "Enter price", "number"],
                    ["availableQuantity", "Available Quantity", "Enter quantity", "number"],
                    ["condition", "Condition", "e.g. Excellent / Good", "text"],
                    ["imageUrl", "Image URL", "https://example.com/image.jpg", "url"],
                  ].map(([name, label, placeholder, type]) => (
                    <div key={name}>
                      <label style={labelStyle}>{label} *</label>
                      <input
                        style={inputStyle}
                        type={type}
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        min={type === "number" ? "0" : undefined}
                        step={name === "rentalPrice" ? "0.01" : undefined}
                        required
                      />
                    </div>
                  ))}

                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select
                      style={inputStyle}
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Rental Type *</label>
                    <select
                      style={inputStyle}
                      name="rentalType"
                      value={form.rentalType}
                      onChange={handleChange}
                      required
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <label style={labelStyle}>Description *</label>
                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: "100px",
                      resize: "vertical",
                    }}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe your equipment..."
                    required
                  />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <label style={labelStyle}>Rental Terms *</label>
                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: "100px",
                      resize: "vertical",
                    }}
                    name="rentalTerms"
                    value={form.rentalTerms}
                    onChange={handleChange}
                    placeholder="Write your rental terms and conditions..."
                    required
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "22px",
                  }}
                >
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...buttonStyle,
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                        ? "Update Equipment"
                        : "Submit Equipment"}
                  </button>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={submitting}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading / Error / Empty States */}
          {loading ? (
            <div style={cardStyle}>
              <p style={{ color: "var(--accent, #c9f269)" }}>
                Loading your equipment...
              </p>
            </div>
          ) : loadError ? (
            <div style={{ ...cardStyle, textAlign: "center" }}>
              <h3>Could Not Load Equipment</h3>
              <p style={{ color: "var(--muted, #999)" }}>{loadError}</p>
              <button
                onClick={() => fetchMyEquipment()}
                style={buttonStyle}
              >
                Try Again
              </button>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                textAlign: "center",
                padding: "45px 20px",
              }}
            >
              <h3>
                {equipment.length === 0
                  ? "No Equipment Found"
                  : "No Matching Equipment"}
              </h3>

              <p style={{ color: "var(--muted, #999)", lineHeight: 1.7 }}>
                {equipment.length === 0
                  ? "You have not added any equipment yet. Click the Add Equipment button to submit your first item."
                  : "Try another search term or change the status filter."}
              </p>

              {equipment.length === 0 ? (
                <button onClick={openAddForm} style={buttonStyle}>
                  + Add Your First Equipment
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                  }}
                  style={secondaryButtonStyle}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p
                style={{
                  color: "var(--muted, #999)",
                  marginBottom: "18px",
                }}
              >
                Showing {filteredEquipment.length} of {equipment.length} equipment
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "22px",
                }}
              >
                {filteredEquipment.map((item) => (
                  <article
                    key={item._id}
                    style={{
                      ...cardStyle,
                      padding: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={item.imageUrl || "/placeholder.png"}
                      alt={item.equipmentName || "Equipment"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/placeholder.png";
                      }}
                      style={{
                        width: "100%",
                        height: "190px",
                        objectFit: "cover",
                        background: "#222",
                      }}
                    />

                    <div style={{ padding: "20px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--accent, #c9f269)",
                            letterSpacing: "1px",
                          }}
                        >
                          {item.category}
                        </span>

                        <span
                          style={{
                            color: getStatusColor(item.status),
                            background: "#252525",
                            padding: "6px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          {item.status || "Pending"}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: "21px",
                          marginBottom: "8px",
                        }}
                      >
                        {item.equipmentName}
                      </h3>

                      <p
                        style={{
                          color: "var(--muted, #999)",
                          fontSize: "13px",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.description}
                      </p>

                      <div
                        style={{
                          borderTop: "1px solid var(--border, #333)",
                          marginTop: "16px",
                          paddingTop: "15px",
                        }}
                      >
                        <p style={{ margin: "7px 0" }}>
                          <strong style={{ color: "var(--accent, #c9f269)" }}>
                            ৳{item.rentalPrice}
                          </strong>{" "}
                          / {item.rentalType}
                        </p>

                        <p
                          style={{
                            margin: "7px 0",
                            color: "var(--muted, #999)",
                          }}
                        >
                          Location: {item.location}
                        </p>

                        <p
                          style={{
                            margin: "7px 0",
                            color: "var(--muted, #999)",
                          }}
                        >
                          Quantity: {item.availableQuantity}
                        </p>

                        <p
                          style={{
                            margin: "7px 0",
                            color: "var(--muted, #999)",
                          }}
                        >
                          Brand: {item.brand || "N/A"} {item.model || ""}
                        </p>

                        <p
                          style={{
                            margin: "7px 0",
                            color: "var(--muted, #999)",
                          }}
                        >
                          Condition: {item.condition || "N/A"}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "20px",
                        }}
                      >
                        <button
                          onClick={() => handleEdit(item)}
                          style={{
                            ...buttonStyle,
                            flex: 1,
                            padding: "11px",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          disabled={Boolean(deletingId)}
                          style={{
                            flex: 1,
                            background: "#381919",
                            color: "#ff9999",
                            border: "1px solid #713333",
                            padding: "11px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            opacity: deletingId ? 0.6 : 1,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div
          onClick={() => {
            if (!deletingId) setItemToDelete(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99998,
            background: "rgba(0,0,0,0.75)",
            display: "grid",
            placeItems: "center",
            padding: "20px",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "28px",
              borderRadius: "18px",
              background: "var(--surface-card, #151515)",
              color: "var(--foreground, #fff)",
              border: "1px solid var(--border, #333)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "rgba(224,82,82,0.15)",
                color: "#ef6464",
                display: "grid",
                placeItems: "center",
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "18px",
              }}
            >
              !
            </div>

            <h2 style={{ margin: "0 0 12px", fontSize: "23px" }}>
              Delete Equipment?
            </h2>

            <p style={{ color: "var(--muted, #999)", lineHeight: 1.7 }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--foreground, #fff)" }}>
                {itemToDelete.equipmentName}
              </strong>
              ? This action cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "25px",
              }}
            >
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setItemToDelete(null)}
                style={{ ...secondaryButtonStyle, flex: 1 }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {deletingId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
