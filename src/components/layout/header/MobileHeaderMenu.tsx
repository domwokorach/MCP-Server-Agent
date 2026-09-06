"use client";

import { useState } from "react";
import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { MoreVertical, HelpCircle, Moon, Sun } from "lucide-react";
import { useColorMode } from "@/hooks/useColorMode";
import type { HeaderPrimaryAction } from "./types";

interface MobileHeaderMenuProps {
  primaryAction?: HeaderPrimaryAction;
  onHelpClick?: () => void;
}

export function MobileHeaderMenu({ primaryAction, onHelpClick }: MobileHeaderMenuProps) {
  const { resolvedMode, mounted, toggle } = useColorMode();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const close = () => setAnchorEl(null);
  const isDark = mounted && resolvedMode === "dark";

  return (
    <>
      <IconButton
        aria-label="More actions"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ width: 40, height: 40, flexShrink: 0 }}
      >
        <MoreVertical size={19} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {primaryAction &&
          (primaryAction.href ? (
            <MenuItem key="primary" component={Link} href={primaryAction.href} onClick={close}>
              <ListItemIcon>{primaryAction.icon}</ListItemIcon>
              <ListItemText primary={primaryAction.label} />
            </MenuItem>
          ) : (
            <MenuItem
              key="primary"
              onClick={() => {
                primaryAction.onClick?.();
                close();
              }}
            >
              <ListItemIcon>{primaryAction.icon}</ListItemIcon>
              <ListItemText primary={primaryAction.label} />
            </MenuItem>
          ))}
        {primaryAction && <Divider />}
        <MenuItem
          onClick={() => {
            onHelpClick?.();
            close();
          }}
        >
          <ListItemIcon>
            <HelpCircle size={18} />
          </ListItemIcon>
          <ListItemText primary="Help" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            toggle();
            close();
          }}
          disabled={!mounted}
        >
          <ListItemIcon>{isDark ? <Sun size={18} /> : <Moon size={18} />}</ListItemIcon>
          <ListItemText primary={isDark ? "Light mode" : "Dark mode"} />
        </MenuItem>
      </Menu>
    </>
  );
}
