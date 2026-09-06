"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  mounted: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "agent-platform-theme";

function systemMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === "system" ? systemMode() : mode;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  const changeMode = (nextMode: ThemeMode) => {
    window.localStorage.setItem(storageKey, nextMode);
    setResolvedMode(applyTheme(nextMode));
    setMode(nextMode);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(storageKey);
      const initialMode: ThemeMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
      setResolvedMode(applyTheme(initialMode));
      setMode(initialMode);
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => mode === "system" && setResolvedMode(applyTheme(mode));
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [mode, mounted]);

  const value: ThemeContextValue = {
    mode,
    resolvedMode,
    mounted,
    setMode: changeMode,
    toggle: () => changeMode(resolvedMode === "dark" ? "light" : "dark"),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used within ThemeProvider.");
  return theme;
}
