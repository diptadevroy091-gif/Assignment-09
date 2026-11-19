
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navbarRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <nav className="navbar" ref={navbarRef}>
      <Link href="/" className="brand" onClick={closeMenu}>
        <span className="brand-icon">E</span>
        <span>
          equipora<span className="brand-dot">.</span>
        </span>
      </Link>

      <div className={`nav-links ${menuOpen ? "menu-open" : ""}`}>
        <Link href="/" onClick={closeMenu}>Home</Link>
        <Link href="/equipment" onClick={closeMenu}>Equipment</Link>
        <Link href="/#categories" onClick={closeMenu}>Categories</Link>
        <Link href="/#about" onClick={closeMenu}>About</Link>

        <div className="mobile-menu-actions">
          <ThemeToggle />

          <Link href="/login" className="login-link" onClick={closeMenu}>
            Log in
          </Link>

          <Link href="/register" className="signup-btn" onClick={closeMenu}>
            Get Started ↗
          </Link>
        </div>
      </div>

      <div className="nav-actions">
        <ThemeToggle />

        <Link href="/login" className="login-link">
          Log in
        </Link>

        <Link href="/register" className="signup-btn">
          Get Started ↗
        </Link>
      </div>

      <button
        type="button"
        className={`hamburger ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}
