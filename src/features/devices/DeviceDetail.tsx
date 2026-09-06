"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { Activity, CheckCircle2, CircleAlert, CircleDashed, Plug, RefreshCw, ShieldCheck, Unplug, WifiOff } from "lucide-react";

import { ConfirmDialog, SectionCard, StatusChip } from "@/components/ui";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import type { ActivityEvent, AgentTask, Device, DeviceStatus } from "@/types";
import { DeviceTypeIcon } from "./DeviceTypeIcon";

type ConnectionAction = "connect" | "disconnect" | "reconnect";
type DeviceResult = { success: boolean; message: string; device?: Device };

const tabs = ["Overview", "Agent", "MCP", "Tasks", "Activity", "Security"] as const;
const statusIcons: Record<DeviceStatus, typeof CheckCircle2> = {
  online: CheckCircle2,
  offline: WifiOff,
  connecting: RefreshCw,
  reconnecting: RefreshCw,
  busy: CircleDashed,
  error: CircleAlert,
  disabled: Unplug,
};

function FieldList({ fields }: { fields: Array<[string, string | number]> }) {
  return (
    <Stack divider={<Divider flexItem />} spacing={0}>
      {fields.map(([label, value]) => (
        <Stack key={label} direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ justifyContent: "space-between", py: 1.25 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

async function performAction(id: string, action: ConnectionAction): Promise<DeviceResult> {
  const response = await fetch(`/api/devices/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mcp-csrf": "1" },
    body: JSON.stringify({ action }),
  });
  return response.json();
}

export function DeviceDetail({
  initialDevice,
  tasks,
  activity,
}: {
  initialDevice: Device;
  tasks: AgentTask[];
  activity: ActivityEvent[];
}) {
  const router = useRouter();
  const [device, setDevice] = useState(initialDevice);
  const [tab, setTab] = useState(0);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [pending, setPending] = useState<ConnectionAction | null>(null);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const deviceTasks = useMemo(() => tasks.filter((task) => task.deviceId === device.id), [device.id, tasks]);
  const deviceActivity = useMemo(() => activity.filter((event) => event.source === initialDevice.name), [activity, initialDevice.name]);
  const StatusIcon = statusIcons[device.status];

  const runAction = async (action: ConnectionAction) => {
    setPending(action);
    const result = await performAction(device.id, action);
    setPending(null);
    setConfirmDisconnect(false);
    if (result.device) setDevice(result.device);
    setNotice({ severity: result.success ? "success" : "error", message: result.message });
  };

  const overview = (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 7 }}>
        <SectionCard title="Connection overview" subtitle="Current console connection and companion application health.">
          <FieldList fields={[
            ["Status", device.status],
            ["Last activity", formatDateTime(device.lastActivity)],
            ["Last seen", formatDateTime(device.lastSeen)],
            ["Companion app", device.appVersion],
          ]} />
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <SectionCard title="Device profile">
          <FieldList fields={[
            ["Type", device.type],
            ["Operating system", `${device.os} ${device.osVersion}`],
            ["Device ID", device.deviceId],
            ["Permitted IP", device.permittedIp],
          ]} />
        </SectionCard>
      </Grid>
    </Grid>
  );
  const agent = (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 5 }}>
        <SectionCard title="Agent connection" subtitle="Scoped to approved tasks; it cannot operate the device directly.">
          <FieldList fields={[
            ["Connection", device.agentConnection],
            ["Active tasks", device.activeTasks],
            ["Last agent check-in", formatRelativeTime(device.lastActivity)],
          ]} />
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <SectionCard title="Recent agent work">
          {deviceTasks.length ? <Stack spacing={1.5}>{deviceTasks.map((task) => <Box key={task.id}><Typography variant="body2" sx={{ fontWeight: 600 }}>{task.instruction}</Typography><Typography variant="caption" color="text.secondary">{task.status} · {formatDateTime(task.createdAt)}</Typography></Box>)}</Stack> : <Typography color="text.secondary">No agent work has been assigned to this device.</Typography>}
        </SectionCard>
      </Grid>
    </Grid>
  );
  const mcp = (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionCard title="MCP connection" subtitle="The MCP gateway exposes only the approved task surface.">
          <FieldList fields={[
            ["Connection", device.mcpConnection],
            ["Gateway", "Connected Devices MCP"],
            ["Endpoint", "/api/mcp"],
            ["Last heartbeat", formatRelativeTime(device.lastSeen)],
          ]} />
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionCard title="Available scope">
          <Stack spacing={1}>
            <Typography variant="body2">• Read connection health and companion version</Typography>
            <Typography variant="body2">• Queue approved agent tasks</Typography>
            <Typography variant="body2">• Report task and connection activity</Typography>
          </Stack>
        </SectionCard>
      </Grid>
    </Grid>
  );
  const taskHistory = (
    <SectionCard title="Task history" subtitle="Tasks are recorded with their lifecycle state.">
      {deviceTasks.length ? <Stack spacing={0}>{deviceTasks.map((task) => <Stack key={task.id} direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{task.instruction}</Typography><Typography variant="caption" color="text.secondary">{task.id} · {formatDateTime(task.createdAt)}</Typography></Box><StatusChip status={task.status} /></Stack>)}</Stack> : <Typography color="text.secondary">No tasks are recorded for this device.</Typography>}
    </SectionCard>
  );
  const activityHistory = (
    <SectionCard title="Connection activity" subtitle="Recent device, MCP, and agent events.">
      <Stack spacing={2}>
        {(deviceActivity.length ? deviceActivity : [{ id: "current", message: "Connection status last checked", severity: "info" as const, source: device.name, timestamp: device.lastSeen }]).map((event) => (
          <Stack key={event.id} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
            <Activity size={18} color="var(--mui-palette-primary-main)" />
            <Box><Typography variant="body2">{event.message}</Typography><Typography variant="caption" color="text.secondary">{event.source} · {formatDateTime(event.timestamp)}</Typography></Box>
          </Stack>
        ))}
      </Stack>
    </SectionCard>
  );
  const security = (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionCard title="Network approval" subtitle="Connections are limited to the approved network identity.">
          <FieldList fields={[["Permitted IP address", device.permittedIp], ["Pairing approval", "Approved"], ["Last seen", formatDateTime(device.lastSeen)]]} />
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionCard title="Access boundaries">
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}><ShieldCheck size={22} color="var(--mui-palette-success-main)" /><Typography variant="body2">The console manages connection metadata and approved agent tasks. It does not expose direct device control.</Typography></Stack>
        </SectionCard>
      </Grid>
    </Grid>
  );

  return (
    <Stack spacing={3}>
      <SectionCard>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box sx={{ p: 1.25, borderRadius: "var(--radius-md)", bgcolor: "action.hover", display: "flex" }}><DeviceTypeIcon type={device.type} size={28} color="var(--mui-palette-primary-main)" /></Box>
            <Box><Typography variant="h5">{device.name}</Typography><Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}><StatusIcon size={16} /><Typography variant="body2">{device.status} · {device.os} {device.osVersion}</Typography></Stack></Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {device.status === "offline" ? <Button variant="contained" startIcon={<Plug size={18} />} disabled={!!pending} onClick={() => runAction("connect")}>Connect</Button> : <Button variant="outlined" startIcon={<Unplug size={18} />} disabled={!!pending || device.status === "disabled"} onClick={() => setConfirmDisconnect(true)}>Disconnect</Button>}
            <Button variant="text" startIcon={<RefreshCw size={18} />} disabled={!!pending || device.status === "disabled"} onClick={() => runAction("reconnect")}>Reconnect</Button>
            <Button variant="text" onClick={() => router.push("/dashboard/devices")}>All devices</Button>
          </Stack>
        </Stack>
      </SectionCard>
      <Box sx={{ borderBottom: 1, borderColor: "divider", overflowX: "auto" }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile>{tabs.map((label) => <Tab key={label} label={label} />)}</Tabs>
      </Box>
      {[overview, agent, mcp, taskHistory, activityHistory, security][tab]}
      <ConfirmDialog open={confirmDisconnect} title={`Disconnect ${device.name}?`} description="The console will end its MCP and agent sessions. You can reconnect this device later." confirmLabel="Disconnect" loading={pending === "disconnect"} onConfirm={() => runAction("disconnect")} onClose={() => setConfirmDisconnect(false)} />
      <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)}><Alert variant="filled" severity={notice?.severity} onClose={() => setNotice(null)}>{notice?.message}</Alert></Snackbar>
    </Stack>
  );
}
