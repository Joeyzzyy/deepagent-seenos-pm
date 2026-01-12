"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light"; // 只保留白天模式

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // 设置为白天模式
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    setMounted(true);
  }, []);

  // Prevent flash
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
