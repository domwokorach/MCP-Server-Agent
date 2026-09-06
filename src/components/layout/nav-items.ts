import { Bot, Link2, LayoutDashboard, MonitorSmartphone, Server, Settings, Terminal, Wrench, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Devices", href: "/dashboard/devices", icon: MonitorSmartphone },
  { label: "Pair Device", href: "/dashboard/devices/pair", icon: Link2 },
  { label: "Agent Tasks", href: "/agent-tasks", icon: Bot },
  { label: "MCP Console", href: "/dashboard/mcp", icon: Server },
  { label: "Terminal", href: "/dashboard/terminal", icon: Terminal },
  { label: "MCP Tools", href: "/dashboard/mcp/tools", icon: Wrench },
  { label: "Settings", href: "/settings", icon: Settings },
];
