import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { NotificationButton } from "./NotificationButton";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import { MobileHeaderMenu } from "./MobileHeaderMenu";
import type { HeaderNotification, HeaderPrimaryAction, HeaderUser } from "./types";

interface HeaderActionsProps {
  primaryAction?: HeaderPrimaryAction;
  primaryActionSlot?: ReactNode;
  notifications?: HeaderNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onHelpClick?: () => void;
  user?: HeaderUser | null;
  onLogout?: () => void | Promise<void>;
}

const primaryActionSx = {
  height: { sm: 40, md: 44 },
  borderRadius: "var(--radius-md)",
  px: 2.25,
  boxShadow: "none",
  whiteSpace: "nowrap",
  "&:hover": { boxShadow: "none" },
} as const;

function PrimaryActionButton({ action }: { action: HeaderPrimaryAction }) {
  if (action.href) {
    return (
      <Button component={Link} href={action.href} variant="contained" startIcon={action.icon} sx={primaryActionSx}>
        {action.label}
      </Button>
    );
  }
  return (
    <Button variant="contained" startIcon={action.icon} onClick={action.onClick} sx={primaryActionSx}>
      {action.label}
    </Button>
  );
}

export function HeaderActions({
  primaryAction,
  primaryActionSlot,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onHelpClick,
  user,
  onLogout,
}: HeaderActionsProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
      {primaryActionSlot}
      {!primaryActionSlot && primaryAction && (
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <PrimaryActionButton action={primaryAction} />
        </Box>
      )}

      <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}>
        <NotificationButton
          notifications={notifications}
          onMarkAsRead={onMarkNotificationRead}
          onMarkAllAsRead={onMarkAllNotificationsRead}
        />
        <Tooltip title="Help">
          <IconButton aria-label="Help" onClick={onHelpClick} sx={{ width: 40, height: 40 }}>
            <HelpCircle size={19} />
          </IconButton>
        </Tooltip>
        <ThemeToggle />
      </Box>

      <Box sx={{ display: { xs: "flex", sm: "none" }, alignItems: "center", gap: 0.25 }}>
        <NotificationButton
          notifications={notifications}
          onMarkAsRead={onMarkNotificationRead}
          onMarkAllAsRead={onMarkAllNotificationsRead}
        />
        <MobileHeaderMenu primaryAction={primaryActionSlot ? undefined : primaryAction} onHelpClick={onHelpClick} />
      </Box>

      {user && <ProfileMenu user={user} onLogout={onLogout} />}
    </Box>
  );
}
