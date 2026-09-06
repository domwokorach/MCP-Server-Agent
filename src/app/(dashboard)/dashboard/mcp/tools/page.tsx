import type { Metadata } from "next";
import { DashboardHeader, PageContainer } from "@/components/layout";
import { SectionCard } from "@/components/ui";
import { ToolsTable } from "@/features/mcp/ToolsTable";

export const metadata: Metadata = { title: "MCP Tools — My Agent Platform" };

export default function McpToolsPage() {
  return (
    <>
      <DashboardHeader
        title="MCP tool management"
        description="Enable or disable approved tools without changing agent integrations. Admin only."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "MCP Console", href: "/dashboard/mcp" },
          { label: "Tools" },
        ]}
      />
      <PageContainer>
        <SectionCard title="Registered tools" subtitle="Request counts, error rates, and average execution time per tool.">
          <ToolsTable />
        </SectionCard>
      </PageContainer>
    </>
  );
}
