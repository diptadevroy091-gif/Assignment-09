
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useToast } from "./ToastProvider";

function AccountMenu({
  user,
  onLogout,
  isMobile = false,
  onNavigate,
}) {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

  const closeAccountMenu = () => {
    setOpen(false);

    if (isMobile) {
      onNavigate?.();
    }
  };

  return (
    <div
      className={`account-menu ${
        isMobile
          ? "account-menu-mobile"
          : "account-menu-desktop"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="account-trigger flex items-center gap-2 rounded-full border p-1 pr-3 transition"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        {user?.photoURL && !imageError ? (
          <img
            src={user.photoURL}
            alt="Profile"
            onError={() => setImageError(true)}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
            {initial}
          </span>
        )}

        <span className="max-w-[110px] truncate text-sm font-semibold">
          {user?.name || "My Account"}
        </span>

        <span className="text-xs">
          {open ? "⌃" : "⌄"}
        </span>
      </button>

      {open && (
        <div
          className={`account-dropdown ${
            isMobile
              ? "account-dropdown-mobile"
              : "account-dropdown-desktop"
          }`}
        >
          <div className="account-dropdown-header border-b p-4">
            <p className="account-dropdown-name truncate font-semibold">
              {user?.name || "User"}
            </p>

            <p className="account-dropdown-email mt-1 truncate text-xs">
              {user?.email}
            </p>

            <span className="account-dropdown-role mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold">
              {user?.role || "Customer"}
            </span>
          </div>

          <div className="account-dropdown-links p-2">
            <Link
              href="/profile"
              onClick={closeAccountMenu}
              className="account-dropdown-link block rounded-lg px-4 py-3 text-sm transition"
            >
              👤 My Profile
            </Link>

            <Link
              href="/profile/edit"
              onClick={closeAccountMenu}
              className="account-dropdown-link block rounded-lg px-4 py-3 text-sm transition"
            >
              ✏️ Edit Profile
            </Link>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="account-dropdown-logout w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition"
            >
              ↪ Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navbarRef = useRef(null);

  const router = useRouter();
  const { showToast } = useToast();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* Load logged-in user */
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("equipora-user");

        setUser(savedUser ? JSON.parse(savedUser) : null);
      } catch (error) {
        console.error("Could not load user information:", error);
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  /* Logout */
  const handleLogout = () => {
    localStorage.removeItem("equipora-token");
    localStorage.removeItem("equipora-user");

    setUser(null);
    closeMenu();

    showToast("Logged out successfully!", "success");

    router.push("/");
    router.refresh();
  };

  /* Close mobile menu when clicking outside */
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
      {/* BRAND */}
      <Link
        href="/"
        className="brand"
        onClick={closeMenu}
      >
        <span className="brand-icon">E</span>

        <span>
          equipora<span className="brand-dot">.</span>
        </span>
      </Link>

      {/* NAVIGATION LINKS */}
      <div
        className={`nav-links ${
          menuOpen ? "menu-open" : ""
        }`}
      >
        <Link href="/" onClick={closeMenu}>
          Home
        </Link>

        <Link href="/equipment" onClick={closeMenu}>
          Equipment
        </Link>

        {/* MOBILE PROFILE - AFTER EQUIPMENT */}
        {user && (
          <div className="mobile-profile-option">
            <AccountMenu
              user={user}
              onLogout={handleLogout}
              isMobile={true}
              onNavigate={closeMenu}
            />
          </div>
        )}

        <Link href="/#categories" onClick={closeMenu}>
          Categories
        </Link>

        <Link href="/#about" onClick={closeMenu}>
          About
        </Link>

        {/* MOBILE MENU ACTIONS */}
        <div className="mobile-menu-actions">
          <ThemeToggle />

          {!user && (
            <>
              <Link
                href="/login"
                className="login-link"
                onClick={closeMenu}
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="signup-btn"
                onClick={closeMenu}
              >
                Get Started ↗
              </Link>
            </>
          )}
        </div>
      </div>

      {/* DESKTOP ACTIONS */}
      <div className="nav-actions">
        <ThemeToggle />

        {user ? (
          <AccountMenu
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <Link href="/login" className="login-link">
              Log in
            </Link>

            <Link href="/register" className="signup-btn">
              Get Started ↗
            </Link>
          </>
        )}
      </div>

      {/* MOBILE HAMBURGER */}
      <button
        type="button"
        className={`hamburger ${
          menuOpen ? "active" : ""
        }`}
        onClick={() =>
          setMenuOpen((previous) => !previous)
        }
        aria-label={
          menuOpen ? "Close menu" : "Open menu"
        }
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}
