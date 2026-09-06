"use client";

import { useMemo, useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { Bell, BellOff } from "lucide-react";
import type { HeaderNotification } from "./types";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

interface NotificationButtonProps {
  notifications?: HeaderNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export function NotificationButton({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{ width: 40, height: 40, flexShrink: 0 }}
        >
          <Badge badgeContent={unreadCount} color="error" max={9}>
            <Bell size={19} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: "calc(100vw - 32px)",
              mt: 1,
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--header-border)",
            },
          },
        }}
      >
        <Stack sx={{ py: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2, pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={() => onMarkAllAsRead?.()}
                sx={{ textTransform: "none", fontSize: "0.75rem", minWidth: 0 }}
              >
                Mark all as read
              </Button>
            )}
          </Stack>
          <Divider />
          {notifications.length === 0 ? (
            <Stack
              spacing={1}
              sx={{ alignItems: "center", justifyContent: "center", py: 5, px: 3, color: "var(--header-muted)" }}
            >
              <BellOff size={26} />
              <Typography sx={{ fontSize: "0.8125rem", textAlign: "center" }}>
                You&rsquo;re all caught up. No notifications yet.
              </Typography>
            </Stack>
          ) : (
            <Stack sx={{ maxHeight: 360, overflowY: "auto" }}>
              {notifications.map((notification) => (
                <Box
                  key={notification.id}
                  onClick={() => onMarkAsRead?.(notification.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: onMarkAsRead ? "pointer" : "default",
                    bgcolor: notification.read ? "transparent" : "action.hover",
                    borderBottom: "1px solid var(--header-border)",
                    transition: "background-color 0.15s ease",
                    "&:hover": { bgcolor: "action.hover" },
                    "&:last-of-type": { borderBottom: "none" },
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.8125rem", fontWeight: notification.read ? 500 : 700 }}>
                      {notification.title}
                    </Typography>
                    {!notification.read && (
                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "primary.main", mt: 0.6, flexShrink: 0 }} />
                    )}
                  </Stack>
                  {notification.description && (
                    <Typography sx={{ fontSize: "0.75rem", color: "var(--header-muted)", mt: 0.25 }}>
                      {notification.description}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: "0.6875rem", color: "var(--header-muted)", mt: 0.5 }}>
                    {formatTimestamp(notification.timestamp)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Popover>
    </>
  );
}
