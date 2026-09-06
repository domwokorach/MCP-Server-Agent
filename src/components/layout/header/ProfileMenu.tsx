"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { User, Settings, ShieldCheck, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import type { HeaderUser } from "./types";

interface ProfileMenuProps {
  user: HeaderUser;
  onLogout?: () => void | Promise<void>;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  const handleLogout = async () => {
    close();
    if (onLogout) {
      await onLogout();
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <Tooltip title={user.name}>
        <ButtonBase onClick={(event) => setAnchorEl(event.currentTarget)} aria-label="Open profile menu" sx={{ borderRadius: "50%", flexShrink: 0 }}>
          <Avatar
            src={user.avatarUrl}
            sx={{ width: 38, height: 38, fontSize: "0.8125rem", fontWeight: 600, bgcolor: "primary.main" }}
          >
            {!user.avatarUrl && initialsFor(user.name)}
          </Avatar>
        </ButtonBase>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 264, mt: 1, borderRadius: "var(--radius-lg)", border: "1px solid var(--header-border)" } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
            {user.name}
          </Typography>
          {user.email && (
            <Typography noWrap sx={{ fontSize: "0.75rem", color: "var(--header-muted)" }}>
              {user.email}
            </Typography>
          )}
        </Box>
        <Divider />
        <MenuItem component={Link} href="/settings" onClick={close}>
          <ListItemIcon>
            <User size={18} />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem component={Link} href="/settings" onClick={close}>
          <ListItemIcon>
            <Settings size={18} />
          </ListItemIcon>
          <ListItemText primary="Account settings" />
        </MenuItem>
        <MenuItem component={Link} href="/settings" onClick={close}>
          <ListItemIcon>
            <ShieldCheck size={18} />
          </ListItemIcon>
          <ListItemText primary="Active sessions" />
        </MenuItem>
        <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "0.875rem" }}>Theme</Typography>
          <ThemeToggle />
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogOut size={18} />
          </ListItemIcon>
          <ListItemText primary="Log out" />
        </MenuItem>
      </Menu>
    </>
  );
}
