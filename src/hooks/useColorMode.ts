"use client";

import { useEffect, useState } from "react";
import { useColorScheme } from "@mui/material/styles";

export function useColorMode() {
  const { mode, setMode, systemMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedMode = mounted ? (mode === "system" ? systemMode : mode) : undefined;

  const toggle = () => {
    setMode(resolvedMode === "dark" ? "light" : "dark");
  };

  return { mode, resolvedMode, mounted, setMode, toggle };
}
