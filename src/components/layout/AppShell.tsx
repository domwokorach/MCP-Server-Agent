"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { DashboardChromeProvider } from "./DashboardChromeContext";
import { DashboardRealtimeProvider } from "@/components/realtime/DashboardRealtimeProvider";
import type { HeaderUser } from "./header/types";

export function AppShell({ children, user = null }: { children: ReactNode; user?: HeaderUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      <nav
        aria-label="Sidebar navigation"
        className="hidden shrink-0 border-r border-sidebar-border bg-sidebar md:block md:w-[var(--sidebar-width-compact)] lg:w-[var(--sidebar-width)]"
      >
        <div className="sticky top-0 h-dvh">
          <div className="h-full lg:hidden">
            <Sidebar compact />
          </div>
          <div className="hidden h-full lg:block">
            <Sidebar />
          </div>
        </div>
      </nav>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <DashboardChromeProvider value={{ openMobileNav: () => setMobileOpen(true), user }}>
        <DashboardRealtimeProvider>
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </DashboardRealtimeProvider>
      </DashboardChromeProvider>
    </div>
  );
}
