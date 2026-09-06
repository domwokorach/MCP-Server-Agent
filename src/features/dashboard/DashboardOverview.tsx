import { Bot, Laptop, Monitor, Smartphone, Wifi, WifiOff } from "lucide-react";
import { MetricCard, SectionCard, StatusChip, EmptyState } from "@/components/ui";
import { listDevices } from "@/services/deviceService";
import { listAgentTasks } from "@/services/agentTaskService";
import { listActivity } from "@/services/activityService";
import { formatRelativeTime } from "@/lib/format";

export async function DashboardOverview() {
  const [devices, tasks, activity] = await Promise.all([listDevices(), listAgentTasks(), listActivity()]);
  const mobileDevices = devices.filter((d) => d.type === "mobile").length;
  const desktopLaptopDevices = devices.filter((d) => d.type === "desktop" || d.type === "laptop").length;
  const onlineDevices = devices.filter((d) => d.status === "online" || d.status === "busy").length;
  const offlineDevices = devices.filter((d) => d.status === "offline").length;
  const connectedMcp = devices.filter((d) => d.mcpConnection === "connected").length;
  const activeAgents = devices.filter((d) => d.agentConnection === "connected").length;

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total devices" value={devices.length} icon={<Monitor size={22} />} />
      <MetricCard label="Mobile" value={mobileDevices} icon={<Smartphone size={22} />} />
      <MetricCard label="Desktop / laptop" value={desktopLaptopDevices} icon={<Laptop size={22} />} />
      <MetricCard label="Online" value={onlineDevices} icon={<Wifi size={22} />} />
      <MetricCard label="Offline" value={offlineDevices} icon={<WifiOff size={22} />} />
      <MetricCard label="MCP connected" value={connectedMcp} icon={<Monitor size={22} />} />
      <MetricCard label="Active agents" value={activeAgents} icon={<Bot size={22} />} />
      <SectionCard title="Recent agent tasks" subtitle="Latest instructions sent to your devices." className="sm:col-span-2 xl:col-span-2">
        {tasks.length === 0 ? (
          <EmptyState title="No agent tasks yet" description="Send a task from a device page to see it here." />
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.instruction}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{task.deviceName} · {formatRelativeTime(task.createdAt)}</p>
                </div>
                <StatusChip status={task.status} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      <SectionCard title="Recent activity" subtitle="Live device and agent events." action={<Wifi className="size-4 text-muted-foreground" />} className="sm:col-span-2 xl:col-span-2">
        {activity.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <div className="space-y-3">
            {activity.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <StatusChip status={event.severity} />
                <div className="min-w-0">
                  <p className="truncate text-sm">{event.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.source} · {formatRelativeTime(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
