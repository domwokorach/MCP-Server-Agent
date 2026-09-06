import type { Metadata } from "next";
import { DashboardHeader, PageContainer } from "@/components/layout";
import { TerminalPanel } from "@/features/terminal/components/TerminalPanel";

export const metadata: Metadata = { title: "MCP Terminal — My Agent Platform" };

export default function TerminalDashboardPage() {
  return (
    <>
      <DashboardHeader
        title="MCP Terminal"
        description="Secure command execution through your MCP server"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Terminal" }]}
      />
      <PageContainer>
        <TerminalPanel />
      </PageContainer>
    </>
  );
}
