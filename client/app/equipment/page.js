
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import "./equipment.css";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const categories = [
  "All",
  "Construction Equipment",
  "Photography Equipment",
  "Vehicles & Transportation",
  "Agriculture Equipment",
  "Electronics",
  "Event Equipment",
];

function EquipmentPageContent() {
  const searchParams = useSearchParams();

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

  const requestIdRef = useRef(0);

  // Read category from homepage URL.
  useEffect(() => {
    const selectedCategory = searchParams.get("category");

    if (selectedCategory && categories.includes(selectedCategory)) {
      setCategory(selectedCategory);
    }
  }, [searchParams]);

  // Fetch equipment from backend.
  const fetchEquipment = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const minimum = minPrice === "" ? null : Number(minPrice);
      const maximum = maxPrice === "" ? null : Number(maxPrice);

      if (
        (minimum !== null &&
          (!Number.isFinite(minimum) || minimum < 0)) ||
        (maximum !== null &&
          (!Number.isFinite(maximum) || maximum < 0))
      ) {
        throw new Error("Please enter valid non-negative prices.");
      }

      if (
        minimum !== null &&
        maximum !== null &&
        minimum > maximum
      ) {
        throw new Error(
          "Minimum price cannot be greater than maximum price."
        );
      }

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (category !== "All") {
        params.set("category", category);
      }

      if (rentalType !== "All") {
        params.set("rentalType", rentalType);
      }

      if (minPrice !== "") {
        params.set("minPrice", minPrice);
      }

      if (maxPrice !== "") {
        params.set("maxPrice", maxPrice);
      }

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
        throw new Error(
          result.message || "Failed to load equipment."
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid equipment data received from server.");
      }

      // Ignore outdated requests.
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setEquipment(result.data);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      console.error("Equipment loading error:", err);

      setEquipment([]);
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
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

  // Debounced API requests.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEquipment();
    }, 350);

    return () => {
      clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [fetchEquipment]);

  // Reset every filter.
  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setRentalType("All");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("All");
    setSort("newest");
    setError("");
  };

  // Count active filters.
  const activeFilterCount = [
    search.trim() !== "",
    category !== "All",
    rentalType !== "All",
    minPrice !== "",
    maxPrice !== "",
    availability !== "All",
  ].filter(Boolean).length;

  // Format prices.
  const formatPrice = (price) => {
    const amount = Number(price);

    if (!Number.isFinite(amount)) return "0";

    return amount.toLocaleString("en-BD");
  };

  return (
    <main className="equipment-page">
      <Navbar />

      {/* PAGE BANNER */}
      <section className="equipment-banner">
        <span>OUR COLLECTION</span>

        <h1>Find your perfect equipment.</h1>

        <p>
          Explore quality equipment for your projects,
          business and everyday needs.
        </p>
      </section>

      {/* EQUIPMENT CONTAINER */}
      <section className="equipment-container">

        {/* SEARCH AND FILTER TOOLBAR */}
        <div className="equipment-toolbar">
          <input
            type="search"
            placeholder="Search equipment, brand or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search equipment"
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={rentalType}
            onChange={(event) => setRentalType(event.target.value)}
            aria-label="Filter by rental type"
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
            onChange={(event) => setMinPrice(event.target.value)}
            aria-label="Minimum rental price"
          />

          <input
            type="number"
            min="0"
            placeholder="Max price"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            aria-label="Maximum rental price"
          />

          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            aria-label="Filter by availability"
          >
            <option value="All">All Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort equipment"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
          >
            Reset Filters
          </button>
        </div>

        {/* ACTIVE FILTER INFORMATION */}
        <div
          className="equipment-result-heading"
          aria-live="polite"
        >
          <div>
            <h2>Available Equipment</h2>

            <span>
              {loading
                ? "Searching equipment..."
                : `${equipment.length} items found`}
            </span>
          </div>

          {activeFilterCount > 0 && (
            <span>
              {activeFilterCount} active{" "}
              {activeFilterCount === 1 ? "filter" : "filters"}
            </span>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div
            className="equipment-message"
            role="status"
          >
            Loading equipment...
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div
            className="equipment-message error-message"
            role="alert"
          >
            <h3>Unable to load equipment</h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchEquipment}
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && equipment.length === 0 && (
          <div className="equipment-message">
            <h3>No equipment found.</h3>

            <p>
              Try changing your search or filters to find
              the equipment you need.
            </p>

            <button
              type="button"
              onClick={resetFilters}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* EQUIPMENT LIST */}
        <div className="equipment-list-grid">
          {!loading &&
            !error &&
            equipment.map((item) => (
              <article
                className="listing-card"
                key={item._id}
              >
                {/* EQUIPMENT IMAGE */}
                <div className="listing-image">
                  <img
                    src={
                      item.imageUrl || "/images/placeholder.png"
                    }
                    alt={item.equipmentName || "Equipment"}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/images/placeholder.png";
                    }}
                  />

                  <span>
                    {Number(item.availableQuantity) > 0
                      ? "AVAILABLE"
                      : "UNAVAILABLE"}
                  </span>
                </div>

                {/* EQUIPMENT INFORMATION */}
                <div className="listing-content">
                  <small>{item.category}</small>

                  <h3>{item.equipmentName}</h3>

                  <p>
                    {item.location || "Location not specified"}
                  </p>

                  <p>
                    Available Quantity:{" "}
                    {Number(item.availableQuantity) || 0}
                  </p>

                  {/* PRICE AND DETAILS */}
                  <div className="listing-bottom">
                    <div>
                      <strong>
                        ৳{formatPrice(item.rentalPrice)}
                      </strong>

                      <small>
                        {" "}
                        / {item.rentalType || "Daily"}
                      </small>
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

// Suspense boundary for useSearchParams().
export default function EquipmentPage() {
  return (
    <Suspense
      fallback={
        <main className="equipment-page">
          <Navbar />
          <div className="equipment-message" role="status">
            Loading equipment...
          </div>
        </main>
      }
    >
      <EquipmentPageContent />
    </Suspense>
  );
}
