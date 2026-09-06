"use client";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Moon, Sun } from "lucide-react";
import { useColorMode } from "@/hooks/useColorMode";

export function ThemeToggle() {
  const { resolvedMode, mounted, toggle } = useColorMode();

  return (
    <Tooltip title={resolvedMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={toggle}
        aria-label="Toggle color mode"
        disabled={!mounted}
        sx={{ width: 40, height: 40, flexShrink: 0 }}
      >
        {mounted && resolvedMode === "dark" ? <Sun size={19} /> : <Moon size={19} />}
      </IconButton>
    </Tooltip>
  );
}
