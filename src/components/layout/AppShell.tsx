"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COMPACT } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { DashboardChromeProvider } from "./DashboardChromeContext";
import type { HeaderUser } from "./header/types";

export function AppShell({ children, user = null }: { children: ReactNode; user?: HeaderUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <Box
        component="nav"
        aria-label="Sidebar navigation"
        sx={{
          display: { xs: "none", md: "block" },
          width: { md: SIDEBAR_WIDTH_COMPACT, lg: SIDEBAR_WIDTH },
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ position: "sticky", top: 0, height: "100dvh" }}>
          <Box sx={{ display: { md: "block", lg: "none" }, height: "100%" }}>
            <Sidebar compact />
          </Box>
          <Box sx={{ display: { md: "none", lg: "block" }, height: "100%" }}>
            <Sidebar />
          </Box>
        </Box>
      </Box>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <DashboardChromeProvider value={{ openMobileNav: () => setMobileOpen(true), user }}>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>{children}</Box>
      </DashboardChromeProvider>
    </Box>
  );
}
