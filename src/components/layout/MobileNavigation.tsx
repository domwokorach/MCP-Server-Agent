"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="left" className="w-[17.5rem] border-sidebar-border bg-sidebar p-0 sm:max-w-none" showCloseButton={false}>
        <Sidebar onNavigate={onClose} />
      </SheetContent>
    </Sheet>
  );
}
