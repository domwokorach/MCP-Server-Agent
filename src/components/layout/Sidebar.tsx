"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { LogOut } from "lucide-react";
import { logout } from "@/services/authService";
import { useRouter } from "next/navigation";

export const SIDEBAR_WIDTH = "var(--sidebar-width)";
export const SIDEBAR_WIDTH_COMPACT = "var(--sidebar-width-compact)";

interface SidebarProps {
  compact?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ compact, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    window.dispatchEvent(new Event("auth:logout"));
    onNavigate?.();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className={compact ? "px-3 py-6" : "px-5 py-6"}>
        <div className={`flex items-center gap-3 ${compact ? "justify-center" : ""}`}>
          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm" aria-hidden>
            <span className="size-2 rounded-sm bg-current" />
          </div>
          {!compact && (
            <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
              Agent Platform
            </span>
          )}
        </div>
      </div>
      <nav aria-label="Primary" className={`flex flex-1 flex-col gap-1 ${compact ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={compact ? item.label : undefined}
              className={`flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors ${
                compact ? "justify-center px-3" : "gap-3 px-3"
              } ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="size-5 shrink-0" strokeWidth={2} />
              {!compact && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={`border-t border-sidebar-border p-3 ${compact ? "px-2" : ""}`}>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className={`flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${
            compact ? "justify-center" : "gap-3"
          }`}
          title={compact ? "Log out" : undefined}
        >
          <LogOut className="size-5 shrink-0" />
          {!compact && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}
