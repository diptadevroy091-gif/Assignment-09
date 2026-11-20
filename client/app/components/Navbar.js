
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useToast } from "./ToastProvider";

/* ======================================
   ACCOUNT / PROFILE MENU
====================================== */

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef(null);

  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

  const dashboardPath =
    user?.role === "Admin"
      ? "/dashboard/admin"
      : user?.role === "Owner"
        ? "/dashboard/owner"
        : "/dashboard/customer";

  useEffect(() => {
    const closeOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const closeEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <div className="equipora-account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-trigger"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        {user?.photoURL && !imageError ? (
          <img
            src={user.photoURL}
            alt="Profile"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="account-avatar-fallback">
            {initial}
          </span>
        )}

        <span className="account-trigger-name">
          {user?.name || "My Account"}
        </span>

        <span className="account-chevron">
          {open ? "⌃" : "⌄"}
        </span>
      </button>

      {open && (
        <div className="account-dropdown">
          <div className="account-dropdown-header">
            <p className="account-dropdown-name">
              {user?.name || "User"}
            </p>

            <p className="account-dropdown-email">
              {user?.email}
            </p>

            <span className="account-dropdown-role">
              {user?.role || "Customer"}
            </span>
          </div>

          <div className="account-dropdown-links">
            <Link
              href={dashboardPath}
              onClick={closeMenu}
              className="account-dropdown-link"
            >
              📊 My Dashboard
            </Link>

            {user?.role === "Customer" && (
              <Link
                href="/wishlist"
                onClick={closeMenu}
                className="account-dropdown-link"
              >
                ❤️ My Wishlist
              </Link>
            )}

            <Link
              href="/profile"
              onClick={closeMenu}
              className="account-dropdown-link"
            >
              👤 My Profile
            </Link>

            <Link
              href="/profile/edit"
              onClick={closeMenu}
              className="account-dropdown-link"
            >
              ✏️ Edit Profile
            </Link>

            <button
              type="button"
              className="account-dropdown-logout"
              onClick={() => {
                closeMenu();
                onLogout();
              }}
            >
              ↪ Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================
   MOBILE GUEST HAMBURGER MENU
====================================== */

function GuestMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const closeEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <div className="equipora-guest-mobile-menu" ref={menuRef}>
      <button
        type="button"
        className="hamburger-button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
      >
        <span className={`hamburger-line ${open ? "line-one open" : ""}`} />
        <span className={`hamburger-line ${open ? "line-two open" : ""}`} />
        <span className={`hamburger-line ${open ? "line-three open" : ""}`} />
      </button>

      {open && (
        <div className="guest-dropdown">
          <Link href="/" onClick={closeMenu}>
            Home
          </Link>

          <Link href="/equipment" onClick={closeMenu}>
            Equipment
          </Link>

          <Link href="/#categories" onClick={closeMenu}>
            Categories
          </Link>

          <Link href="/#about" onClick={closeMenu}>
            About
          </Link>

          <div className="guest-dropdown-divider" />

          <Link href="/login" onClick={closeMenu}>
            Log in
          </Link>

          <Link
            href="/register"
            onClick={closeMenu}
            className="guest-signup"
          >
            Get Started ↗
          </Link>
        </div>
      )}
    </div>
  );
}

/* ======================================
   MAIN NAVBAR
====================================== */

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const isDashboard = pathname?.startsWith("/dashboard");

  // LOAD USER
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("equipora-user");

        setUser(savedUser ? JSON.parse(savedUser) : null);
      } catch (error) {
        console.error("Could not load user information:", error);
        setUser(null);
      } finally {
        setLoaded(true);
      }
    };

    loadUser();

    window.addEventListener("storage", loadUser);
    window.addEventListener("equipora-auth-changed", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("equipora-auth-changed", loadUser);
    };
  }, [pathname]);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("equipora-token");
    localStorage.removeItem("equipora-user");

    setUser(null);

    window.dispatchEvent(new Event("equipora-auth-changed"));

    showToast("Logged out successfully!", "success");

    router.push("/");
    router.refresh();
  };

  return (
    <nav
      className={`navbar ${isDashboard ? "dashboard-navbar" : ""}`}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
      }}
    >
      {/* BRAND */}
      <Link href="/" className="brand">
        <span className="brand-icon">E</span>

        <span>
          equipora<span className="brand-dot">.</span>
        </span>
      </Link>

      {/* DESKTOP NAVIGATION */}
      {!isDashboard && loaded && (
        <div className="equipora-desktop-links">
          <Link href="/">Home</Link>

          <Link href="/equipment">Equipment</Link>

          <Link href="/#categories">Categories</Link>

          <Link href="/#about">About</Link>

          {!user && (
            <>
              <Link
                href="/login"
                className="equipora-login-link"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="equipora-signup-link"
              >
                Get Started ↗
              </Link>
            </>
          )}
        </div>
      )}

      {/* RIGHT SIDE ACTIONS */}
      <div className="equipora-navbar-actions">
        <ThemeToggle />

        {loaded && (
          <>
            {user ? (
              <AccountMenu
                user={user}
                onLogout={handleLogout}
              />
            ) : (
              !isDashboard && <GuestMenu />
            )}
          </>
        )}
      </div>
    </nav>
  );
}
