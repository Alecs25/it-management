import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";

interface UIContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Force light theme globally.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    setMounted(true);
  }, []);

  const setTheme = (_newTheme: Theme) => {
    // Keep function for API compatibility, but ignore writes.
    document.documentElement.setAttribute("data-theme", "light");
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <UIContext.Provider value={{ sidebarOpen, setSidebarOpen, theme, setTheme }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within UIProvider");
  }
  return context;
}
