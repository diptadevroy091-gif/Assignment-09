
"use client";

import { useEffect } from "react";

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("equipora-theme") || "light";

    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return <>{children}</>;
}
