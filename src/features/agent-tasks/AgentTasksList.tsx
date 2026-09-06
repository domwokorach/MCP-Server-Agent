import { Bot } from "lucide-react";
import { SectionCard, StatusChip, EmptyState, ResponsiveTable } from "@/components/ui";
import type { ResponsiveTableColumn } from "@/components/ui";
import { listAgentTasks } from "@/services/agentTaskService";
import { formatDateTime } from "@/lib/format";
import type { AgentTask } from "@/types";

export async function AgentTasksList() {
  const tasks = await listAgentTasks();

  if (tasks.length === 0) {
    return (
      <SectionCard>
        <EmptyState icon={<Bot />} title="No agent tasks yet" description="Send your first instruction to a device to see it here." />
      </SectionCard>
    );
  }

  const columns: ResponsiveTableColumn<AgentTask>[] = [
    { key: "instruction", header: "Instruction", render: (task) => <span className="font-medium">{task.instruction}</span> },
    { key: "device", header: "Device", render: (task) => task.deviceName },
    { key: "status", header: "Status", render: (task) => <StatusChip status={task.status} /> },
    { key: "createdAt", header: "Created", hideOnMobile: true, render: (task) => <span className="text-muted-foreground">{formatDateTime(task.createdAt)}</span> },
  ];

  return (
    <SectionCard noPadding>
      <ResponsiveTable columns={columns} rows={tasks} getRowKey={(task) => task.id} mobileTitle={(task) => task.instruction} />
    </SectionCard>
  );
}
