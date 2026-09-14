"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { useIsClient } from "@/shared/hooks/use-is-client";
import { THEME_STORAGE_KEY } from "@/shared/lib/theme";

export type ColorTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyTheme(theme: ColorTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function storedTheme(): ColorTheme {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [theme, setThemeState] = useState<ColorTheme>("light");
  const [loaded, setLoaded] = useState(false);

  if (isClient && !loaded) {
    setLoaded(true);
    setThemeState(storedTheme());
  }

  const value = useMemo<ThemeContextValue>(() => {
    function setTheme(next: ColorTheme) {
      setThemeState(next);
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      applyTheme(next);
    }
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
