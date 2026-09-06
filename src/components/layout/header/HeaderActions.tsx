"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

function PrimaryActionButton({ action }: { action: HeaderPrimaryAction }) {
  if (action.href) {
    return (
      <Link href={action.href} className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-xl px-4")}>
        {action.icon}
        {action.label}
      </Link>
    );
  }
  return (
    <Button size="lg" className="h-10 rounded-xl px-4" onClick={action.onClick}>
      {action.icon}
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
    <div className="flex shrink-0 items-center gap-1">
      {primaryActionSlot}
      {!primaryActionSlot && primaryAction && <div className="hidden sm:block"><PrimaryActionButton action={primaryAction} /></div>}

      <div className="hidden items-center gap-1 sm:flex">
        <NotificationButton
          notifications={notifications}
          onMarkAsRead={onMarkNotificationRead}
          onMarkAllAsRead={onMarkAllNotificationsRead}
        />
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Help" onClick={onHelpClick} />}>
            <HelpCircle size={18} />
          </TooltipTrigger>
          <TooltipContent>Help</TooltipContent>
        </Tooltip>
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-1 sm:hidden">
        <NotificationButton
          notifications={notifications}
          onMarkAsRead={onMarkNotificationRead}
          onMarkAllAsRead={onMarkAllNotificationsRead}
        />
        <MobileHeaderMenu primaryAction={primaryActionSlot ? undefined : primaryAction} onHelpClick={onHelpClick} />
      </div>

      {user && <ProfileMenu user={user} onLogout={onLogout} />}
    </div>
  );
}
