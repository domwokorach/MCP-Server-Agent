"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

export const SIDEBAR_WIDTH = "var(--sidebar-width)";
export const SIDEBAR_WIDTH_COMPACT = "var(--sidebar-width-compact)";

interface SidebarProps {
  compact?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ compact, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ px: compact ? 1.5 : 3, py: 3.5 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            justifyContent: compact ? "center" : "flex-start"
          }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              bgcolor: "primary.main",
              flexShrink: 0,
            }}
            aria-hidden
          />
          {!compact && (
            <Typography variant="subtitle1" noWrap sx={{
              fontWeight: 700
            }}>
              Agent Platform
            </Typography>
          )}
        </Stack>
      </Box>
      <List component="nav" aria-label="Primary" sx={{ px: compact ? 1 : 2, flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={onNavigate}
              selected={active}
              sx={{
                borderRadius: "var(--radius-sm)",
                mb: 0.5,
                minHeight: 48,
                justifyContent: compact ? "center" : "flex-start",
                px: compact ? 1.5 : 2,
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: compact ? 0 : 36, justifyContent: "center" }}>
                <Icon size={20} strokeWidth={2} />
              </ListItemIcon>
              {!compact && (
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { variant: "body2", sx: { fontWeight: active ? 600 : 500 } } }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Stack>
  );
}
