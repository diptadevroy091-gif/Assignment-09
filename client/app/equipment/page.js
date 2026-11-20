
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import "./equipment.css";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [rentalType, setRentalType] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("All");
  const [sort, setSort] = useState("newest");

  const categories = [
    "All",
    "Construction Equipment",
    "Photography Equipment",
    "Vehicles & Transportation",
    "Agriculture Equipment",
    "Electronics",
    "Event Equipment",
  ];

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (category !== "All") params.set("category", category);
      if (rentalType !== "All") params.set("rentalType", rentalType);
      if (minPrice !== "") params.set("minPrice", minPrice);
      if (maxPrice !== "") params.set("maxPrice", maxPrice);
      if (availability !== "All") {
        params.set("availability", availability);
      }

      params.set("sort", sort);

      const response = await fetch(
        `${API_URL}/api/equipment?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load equipment");
      }

      setEquipment(result.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    category,
    rentalType,
    minPrice,
    maxPrice,
    availability,
    sort,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEquipment();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchEquipment]);

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setRentalType("All");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("All");
    setSort("newest");
  };

  return (
    <main className="equipment-page">
      <Navbar />

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
            value={rentalType}
            onChange={(e) => setRentalType(e.target.value)}
          >
            <option value="All">All Rental Types</option>
            <option value="Hourly">Hourly</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>

          <input
            type="number"
            min="0"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />

          <input
            type="number"
            min="0"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="All">All Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>

          <button type="button" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>

        <div className="equipment-result-heading">
          <h2>Available Equipment</h2>
          <span>{equipment.length} items found</span>
        </div>

        {loading && (
          <div className="equipment-message">
            Loading equipment...
          </div>
        )}

        {!loading && error && (
          <div className="equipment-message error-message">
            {error}
            <p>Make sure your backend server is running.</p>
            <button onClick={fetchEquipment}>Try Again</button>
          </div>
        )}

        {!loading && !error && equipment.length === 0 && (
          <div className="equipment-message">
            No equipment found. Try changing your filters.
          </div>
        )}

        <div className="equipment-list-grid">
          {!loading &&
            !error &&
            equipment.map((item) => (
              <article className="listing-card" key={item._id}>
                <div className="listing-image">
                  <img
                    src={item.imageUrl || "/images/placeholder.png"}
                    alt={item.equipmentName}
                  />
                  <span>APPROVED</span>
                </div>

                <div className="listing-content">
                  <small>{item.category}</small>
                  <h3>{item.equipmentName}</h3>
                  <p>{item.location}</p>

                  <p>
                    Available Quantity: {item.availableQuantity}
                  </p>

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
