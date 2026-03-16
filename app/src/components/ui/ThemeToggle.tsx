"use client";

import { Moon, Sun } from "lucide-react";
import { useUI } from "@/lib/context/UIContext";

export function ThemeToggle() {
  const { theme, setTheme } = useUI();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-lg hover:bg-base-200 transition"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
