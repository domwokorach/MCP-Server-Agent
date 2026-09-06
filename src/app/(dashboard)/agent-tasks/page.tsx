import type { Metadata } from "next";
import { DashboardHeader, PageContainer } from "@/components/layout";
import { AgentTasksList } from "@/features/agent-tasks/AgentTasksList";
import { NewTaskDialog } from "@/features/agent-tasks/NewTaskDialog";
import { listDevices } from "@/services/deviceService";

export const metadata: Metadata = { title: "Agent Tasks — My Agent Platform" };

export default async function AgentTasksPage() {
  const devices = await listDevices();

  return (
    <>
      <DashboardHeader
        title="Agent Tasks"
        description="Monitor and manage MCP agent workloads"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Agent Tasks" }]}
        primaryActionSlot={<NewTaskDialog devices={devices} />}
      />
      <PageContainer>
        <AgentTasksList />
      </PageContainer>
    </>
  );
}
