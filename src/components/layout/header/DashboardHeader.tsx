"use client";

import type { ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { Menu } from "lucide-react";
import { useDashboardChrome } from "../DashboardChromeContext";
import { PageTitle } from "./PageTitle";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderActions } from "./HeaderActions";
import type { HeaderBreadcrumb, HeaderNotification, HeaderPrimaryAction, HeaderUser } from "./types";

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: HeaderBreadcrumb[];
  /** Declarative CTA rendered as a styled button (desktop/tablet) or folded into the mobile overflow menu. */
  primaryAction?: HeaderPrimaryAction;
  /** Escape hatch for a fully custom trigger (e.g. a dialog-opening button) that always stays visible. Takes precedence over `primaryAction`. */
  primaryActionSlot?: ReactNode;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  notifications?: HeaderNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onHelpClick?: () => void;
  /** Overrides the signed-in user resolved from `AppShell` context; pass `null` to hide the profile menu. */
  user?: HeaderUser | null;
  onLogout?: () => void | Promise<void>;
  sticky?: boolean;
}

export function DashboardHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  primaryActionSlot,
  onSearch,
  searchPlaceholder,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onHelpClick,
  user,
  onLogout,
  sticky = true,
}: DashboardHeaderProps) {
  const chrome = useDashboardChrome();
  const resolvedUser = user !== undefined ? user : (chrome?.user ?? null);

  return (
    <AppBar
      position={sticky ? "sticky" : "static"}
      elevation={0}
      sx={{
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        bgcolor: "var(--header-bg)",
        backgroundImage: "none",
        borderBottom: "1px solid var(--header-border)",
        color: "var(--header-title)",
      }}
    >
      <Stack sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 1, sm: 1.25 } }}>
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 2 },
            minHeight: { xs: 56, sm: 60, md: 64 },
          }}
        >
          {chrome && (
            <IconButton
              edge="start"
              aria-label="Open navigation menu"
              onClick={chrome.openMobileNav}
              sx={{ display: { xs: "inline-flex", md: "none" }, flexShrink: 0, ml: -1 }}
            >
              <Menu size={22} />
            </IconButton>
          )}

          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <PageTitle title={title} breadcrumbs={breadcrumbs} />
          </Box>

          <HeaderSearch placeholder={searchPlaceholder} onSearch={onSearch} />

          <HeaderActions
            primaryAction={primaryAction}
            primaryActionSlot={primaryActionSlot}
            notifications={notifications}
            onMarkNotificationRead={onMarkNotificationRead}
            onMarkAllNotificationsRead={onMarkAllNotificationsRead}
            onHelpClick={onHelpClick}
            user={resolvedUser}
            onLogout={onLogout}
          />
        </Box>

        {description && (
          <Typography
            sx={{
              color: "var(--header-muted)",
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
              mt: 0.5,
              maxWidth: 640,
            }}
          >
            {description}
          </Typography>
        )}
      </Stack>
    </AppBar>
  );
}
