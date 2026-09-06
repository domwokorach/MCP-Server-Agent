import type { Metadata } from "next";
import { DashboardHeader, PageContainer } from "@/components/layout";
import { McpConsole } from "@/features/mcp/McpConsole";

export const metadata: Metadata = { title: "MCP Console — My Agent Platform" };

export default function McpDashboardPage() {
  return (
    <>
      <DashboardHeader
        title="MCP Console"
        description="Operate the Model Context Protocol server and monitor live platform activity."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "MCP Console" }]}
      />
      <PageContainer>
        <McpConsole />
      </PageContainer>
    </>
  );
}
