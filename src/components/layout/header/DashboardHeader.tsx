"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardChrome } from "../DashboardChromeContext";
import { PageTitle } from "./PageTitle";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderActions } from "./HeaderActions";
import type { HeaderBreadcrumb, HeaderNotification, HeaderPrimaryAction, HeaderUser } from "./types";

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: HeaderBreadcrumb[];
  primaryAction?: HeaderPrimaryAction;
  primaryActionSlot?: ReactNode;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  notifications?: HeaderNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onHelpClick?: () => void;
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
    <header
      className={`dark relative isolate ${sticky ? "sticky top-0" : ""} z-30 overflow-hidden border-b border-border`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/images/mcp-banner.png')] bg-cover bg-center bg-no-repeat"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-slate-950/92 via-slate-950/85 to-slate-950/75" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/10 backdrop-blur-md" />

      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-h-11 items-center gap-2 sm:gap-4">
          {chrome && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              onClick={chrome.openMobileNav}
              className="shrink-0 md:hidden"
            >
              <Menu size={21} />
            </Button>
          )}

          <div className="min-w-0 flex-1">
            <PageTitle title={title} breadcrumbs={breadcrumbs} />
          </div>

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
        </div>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
    </header>
  );
}
