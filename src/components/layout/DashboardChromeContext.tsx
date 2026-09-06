"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { HeaderUser } from "./header/types";

interface DashboardChromeValue {
  openMobileNav: () => void;
  user: HeaderUser | null;
}

const DashboardChromeContext = createContext<DashboardChromeValue | null>(null);

export function DashboardChromeProvider({
  value,
  children,
}: {
  value: DashboardChromeValue;
  children: ReactNode;
}) {
  return <DashboardChromeContext.Provider value={value}>{children}</DashboardChromeContext.Provider>;
}

/** Lets a `DashboardHeader` reach the sidebar toggle and signed-in user without prop drilling through every page. Returns null when rendered outside `AppShell`. */
export function useDashboardChrome() {
  return useContext(DashboardChromeContext);
}
