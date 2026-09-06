"use client";

import { Moon, Sun } from "lucide-react";
import { useColorMode } from "@/hooks/useColorMode";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedMode, mounted, toggle } = useColorMode();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            onClick={toggle}
            aria-label="Toggle color mode"
            disabled={!mounted}
            variant="ghost"
            size="icon"
            className="shrink-0"
          />
        }
      >
        {mounted && resolvedMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </TooltipTrigger>
      <TooltipContent>{resolvedMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}</TooltipContent>
    </Tooltip>
  );
}
