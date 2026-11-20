
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  // Show Toast
  const showToast = useCallback((message, type = "success") => {
    setToast({
      id: Date.now(),
      message,
      type,
    });
  }, []);

  // Close Toast
  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto close after 3.5 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const toastStyles = {
    success: {
      background: "#16a34a",
      color: "#ffffff",
      icon: "✓",
    },
    error: {
      background: "#dc2626",
      color: "#ffffff",
      icon: "✕",
    },
    info: {
      background: "#2563eb",
      color: "#ffffff",
      icon: "ⓘ",
    },
    warning: {
      background: "#eab308",
      color: "#111111",
      icon: "⚠",
    },
  };

  const currentStyle =
    toastStyles[toast?.type] || toastStyles.success;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* GLOBAL TOAST NOTIFICATION */}
      {toast && (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          aria-live="polite"
          style={{
            position: "fixed",
            top: "calc(env(safe-area-inset-top, 0px) + 100px)",
            right: "20px",
            zIndex: 99999,
            width: "max-content",
            maxWidth: "min(420px, calc(100vw - 32px))",
            minWidth: "min(280px, calc(100vw - 32px))",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "15px 18px",
            borderRadius: "12px",
            background: currentStyle.background,
            color: currentStyle.color,
            boxShadow: "0 12px 35px rgba(0, 0, 0, 0.30)",
            fontFamily: "Arial, sans-serif",
            boxSizing: "border-box",
          }}
        >
          {/* ICON */}
          <span
            style={{
              fontSize: "21px",
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            {currentStyle.icon}
          </span>

          {/* MESSAGE */}
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: "600",
              lineHeight: "1.5",
              flex: 1,
              overflowWrap: "anywhere",
            }}
          >
            {toast.message}
          </p>

          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={closeToast}
            aria-label="Close notification"
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              fontSize: "23px",
              cursor: "pointer",
              padding: "0 2px",
              lineHeight: 1,
              opacity: 0.85,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
