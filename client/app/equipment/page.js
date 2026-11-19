
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./equipment.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`${API_URL}/api/equipment`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load equipment");
        }

        setEquipment(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  const categories = [
    "All",
    "Construction Equipment",
    "Photography Equipment",
    "Vehicles & Transportation",
    "Agriculture Equipment",
    "Electronics",
    "Event Equipment",
  ];

  const filteredEquipment = useMemo(() => {
    let result = equipment.filter((item) => {
      const text = search.toLowerCase();

      const matchesSearch =
        item.equipmentName?.toLowerCase().includes(text) ||
        item.brand?.toLowerCase().includes(text) ||
        item.location?.toLowerCase().includes(text);

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sort === "low") {
      result.sort((a, b) => a.rentalPrice - b.rentalPrice);
    } else if (sort === "high") {
      result.sort((a, b) => b.rentalPrice - a.rentalPrice);
    } else {
      result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    return result;
  }, [equipment, search, category, sort]);

  return (
    <main className="equipment-page">
      <nav className="equipment-nav">
        <Link href="/" className="brand">
          <span className="brand-icon">E</span>
          equipora<span className="brand-dot">.</span>
        </Link>

        <div>
          <Link href="/">Home</Link>
          <Link href="/equipment">Equipment</Link>
          <Link href="/login">Login</Link>
        </div>
      </nav>

      <section className="equipment-banner">
        <span>OUR COLLECTION</span>
        <h1>Find your perfect equipment.</h1>
        <p>
          Explore quality equipment for your projects,
          business and everyday needs.
        </p>
      </section>

      <section className="equipment-container">
        <div className="equipment-toolbar">
          <input
            type="search"
            placeholder="Search equipment, brand or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>

        <div className="equipment-result-heading">
          <h2>Available Equipment</h2>
          <span>{filteredEquipment.length} items found</span>
        </div>

        {loading && (
          <div className="equipment-message">
            Loading equipment...
          </div>
        )}

        {error && (
          <div className="equipment-message error-message">
            {error}
            <p>Make sure your backend server is running.</p>
          </div>
        )}

        {!loading && !error && filteredEquipment.length === 0 && (
          <div className="equipment-message">
            No equipment found. Try another search.
          </div>
        )}

        <div className="equipment-list-grid">
          {filteredEquipment.map((item) => (
            <article className="listing-card" key={item._id}>
              <div className="listing-image">
                <img
                  src={item.imageUrl}
                  alt={item.equipmentName}
                />
                <span>APPROVED</span>
              </div>

              <div className="listing-content">
                <small>{item.category}</small>
                <h3>{item.equipmentName}</h3>
                <p>{item.location}</p>

                <div className="listing-bottom">
                  <div>
                    <strong>৳{item.rentalPrice}</strong>
                    <small> / {item.rentalType}</small>
                  </div>

                  <Link href={`/equipment/${item._id}`}>
                    View Details ↗
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
