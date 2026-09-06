"use client";

import Drawer from "@mui/material/Drawer";
import { Sidebar } from "./Sidebar";

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": { width: 280, boxSizing: "border-box" },
      }}
    >
      <Sidebar onNavigate={onClose} />
    </Drawer>
  );
}
