import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MetricCard, SectionCard, StatusChip, EmptyState } from "@/components/ui";
import { listDevices } from "@/services/deviceService";
import { listAgentTasks } from "@/services/agentTaskService";
import { listActivity } from "@/services/activityService";
import { formatRelativeTime } from "@/lib/format";
import { Bot, Laptop, Monitor, Smartphone, Wifi, WifiOff } from "lucide-react";

export async function DashboardOverview() {
  const [devices, tasks, activity] = await Promise.all([
    listDevices(),
    listAgentTasks(),
    listActivity(),
  ]);

  const mobileDevices = devices.filter((d) => d.type === "mobile").length;
  const desktopLaptopDevices = devices.filter((d) => d.type === "desktop" || d.type === "laptop").length;
  const onlineDevices = devices.filter((d) => d.status === "online" || d.status === "busy").length;
  const offlineDevices = devices.filter((d) => d.status === "offline").length;
  const connectedMcp = devices.filter((d) => d.mcpConnection === "connected").length;
  const activeAgents = devices.filter((d) => d.agentConnection === "connected").length;

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard label="Total devices" value={devices.length} icon={<Monitor size={24} />} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard label="Mobile" value={mobileDevices} icon={<Smartphone size={24} />} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard label="Desktop / laptop" value={desktopLaptopDevices} icon={<Laptop size={24} />} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard label="Online" value={onlineDevices} icon={<Wifi size={24} />} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard label="Offline" value={offlineDevices} icon={<WifiOff size={24} />} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard label="MCP connected" value={connectedMcp} icon={<Monitor size={24} />} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <MetricCard label="Active agents" value={activeAgents} icon={<Bot size={24} />} />
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <SectionCard title="Recent agent tasks" subtitle="Latest instructions sent to your devices.">
          {tasks.length === 0 ? (
            <EmptyState title="No agent tasks yet" description="Send a task from a device page to see it here." />
          ) : (
            <Stack spacing={1.5}>
              {tasks.slice(0, 5).map((task) => (
                <Stack key={task.id} direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 1 }}>
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                      {task.instruction}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {task.deviceName} · {formatRelativeTime(task.createdAt)}
                    </Typography>
                  </Stack>
                  <StatusChip status={task.status} />
                </Stack>
              ))}
            </Stack>
          )}
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <SectionCard
          title="Recent activity"
          subtitle="Live device and agent events."
          action={<Wifi size={20} color="var(--text-muted)" />}
        >
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <Stack spacing={1.5}>
              {activity.slice(0, 5).map((event) => (
                <Stack key={event.id} direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                  <StatusChip status={event.severity} />
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {event.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {event.source} · {formatRelativeTime(event.timestamp)}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </SectionCard>
      </Grid>
    </Grid>
  );
}
