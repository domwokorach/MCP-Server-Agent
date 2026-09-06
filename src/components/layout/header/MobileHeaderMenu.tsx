"use client";

import Link from "next/link";
import { HelpCircle, MoreVertical, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useColorMode } from "@/hooks/useColorMode";
import type { HeaderPrimaryAction } from "./types";

interface MobileHeaderMenuProps {
  primaryAction?: HeaderPrimaryAction;
  onHelpClick?: () => void;
}

export function MobileHeaderMenu({ primaryAction, onHelpClick }: MobileHeaderMenuProps) {
  const { resolvedMode, mounted, toggle } = useColorMode();
  const isDark = mounted && resolvedMode === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More actions" />}>
        <MoreVertical size={19} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {primaryAction &&
          (primaryAction.href ? (
            <DropdownMenuItem render={<Link href={primaryAction.href} />}>
              {primaryAction.icon}
              {primaryAction.label}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={primaryAction.onClick}>
              {primaryAction.icon}
              {primaryAction.label}
            </DropdownMenuItem>
          ))}
        {primaryAction && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={onHelpClick}>
          <HelpCircle size={18} />
          Help
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggle} disabled={!mounted}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
