import type { ReactNode } from "react";

export interface HeaderBreadcrumb {
  label: string;
  href?: string;
}

export interface HeaderPrimaryAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
}

export interface HeaderNotification {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  read?: boolean;
}

export interface HeaderUser {
  name: string;
  email?: string;
  avatarUrl?: string;
}
