
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

  const showToast = useCallback((message, type = "success") => {
    setToast({
      id: Date.now(),
      message,
      type,
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const toastConfig = {
    success: {
      icon: "✓",
      title: "Success",
      background: "#16a34a",
    },
    error: {
      icon: "✕",
      title: "Error",
      background: "#dc2626",
    },
    warning: {
      icon: "!",
      title: "Warning",
      background: "#d97706",
    },
    info: {
      icon: "i",
      title: "Information",
      background: "#2563eb",
    },
  };

  const current = toastConfig[toast?.type] || toastConfig.success;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          aria-live="polite"
          style={{
            position: "fixed",
            top: "calc(env(safe-area-inset-top, 0px) + 24px)",
            right: "20px",
            zIndex: 999999,
            width: "min(390px, calc(100vw - 32px))",
            padding: "16px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "13px",
            background: "var(--surface-card, #ffffff)",
            color: "var(--foreground, #111111)",
            border: "1px solid var(--border, #e5e7eb)",
            boxShadow: "0 15px 45px rgba(0,0,0,0.18)",
            animation: "equiporaToastIn 0.3s ease-out",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              width: "42px",
              height: "42px",
              minWidth: "42px",
              borderRadius: "13px",
              display: "grid",
              placeItems: "center",
              background: current.background,
              color: "#ffffff",
              fontSize: "21px",
              fontWeight: "800",
            }}
          >
            {current.icon}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: "0 0 3px",
                fontSize: "13px",
                fontWeight: "800",
                letterSpacing: "0.3px",
              }}
            >
              {current.title}
            </p>

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: "1.5",
                color: "var(--muted, #6b7280)",
                overflowWrap: "anywhere",
              }}
            >
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={closeToast}
            aria-label="Close notification"
            style={{
              border: "none",
              background: "transparent",
              color: "var(--muted, #6b7280)",
              fontSize: "22px",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes equiporaToastIn {
          from {
            opacity: 0;
            transform: translateX(25px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 480px) {
          .equipora-toast {
            right: 16px;
            left: 16px;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
