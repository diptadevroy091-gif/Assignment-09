
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

  const styles = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
    warning: "bg-yellow-500 text-black",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ⓘ",
    warning: "⚠",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 rounded-xl px-5 py-4 text-white shadow-2xl ${styles[toast.type] || styles.success}`}
        >
          <span className="text-xl font-bold">
            {icons[toast.type] || icons.success}
          </span>

          <p className="text-sm font-medium">
            {toast.message}
          </p>

          <button
            onClick={closeToast}
            className="ml-2 text-lg opacity-80 hover:opacity-100"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
