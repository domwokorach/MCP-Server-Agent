"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Bot, Copy, MemoryStick, MonitorSmartphone, Play, RefreshCw, RotateCcw, Square, Trash2, Wrench } from "lucide-react";
import { MetricCard, SectionCard, StatusChip, LinkButton } from "@/components/ui";
import type { McpLogEntry, McpRuntimeStatus } from "@/services/mcpRuntimeService";
import { McpTerminal } from "./McpTerminal";

interface McpOverview {
  tools: { total: number; enabled: number; requests: number; errors: number };
  security: { activeSessions: number; connectedAgents: number; rateLimitEvents: number };
  terminal: { enabled: boolean; events: number };
  recentAudit: Array<{ id: string; action: string; actorType: string; success: boolean; createdAt: string }>;
}

const initialStatus: McpRuntimeStatus = {
  state: "offline",
  apiStatus: "online",
  websocketStatus: "SSE connected",
  uptimeSeconds: 0,
  pid: null,
  transport: "STDIO + Streamable HTTP",
  endpoint: "/api/mcp",
  connectedClients: 0,
  activeAgents: 0,
  connectedDevices: 0,
  toolCount: 9,
  requestCount: 0,
  errorCount: 0,
  memoryBytes: 0,
  controlsEnabled: false,
};

function formatUptime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

export function McpConsole() {
  const [status, setStatus] = useState(initialStatus);
  const [logs, setLogs] = useState<McpLogEntry[]>([]);
  const [overview, setOverview] = useState<McpOverview | null>(null);
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState<string>();

  const refresh = useCallback(async () => {
    const [statusResponse, logsResponse, overviewResponse] = await Promise.all([
      fetch("/api/mcp/status"),
      fetch("/api/system/logs"),
      fetch("/api/mcp/overview"),
    ]);
    if (!statusResponse.ok || !logsResponse.ok) throw new Error("Unable to load MCP management data.");
    setStatus(await statusResponse.json());
    setLogs(await logsResponse.json());
    if (overviewResponse.ok) setOverview(await overviewResponse.json());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh).catch((error: Error) => setMessage(error.message));
    const events = new EventSource("/api/system/events");
    events.addEventListener("status", (event) => setStatus(JSON.parse(event.data) as McpRuntimeStatus));
    events.onerror = () => setMessage("Live updates are reconnecting.");
    return () => events.close();
  }, [refresh]);

  const control = async (action: "start" | "stop" | "restart" | "clear") => {
    setPending(action);
    setMessage(undefined);
    try {
      const endpoint = action === "clear" ? "/api/system/logs" : `/api/mcp/${action}`;
      const response = await fetch(endpoint, { method: "POST", headers: { "x-mcp-csrf": "1" } });
      if (!response.ok) throw new Error((await response.json() as { message?: string }).message ?? "Management action failed.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Management action failed.");
    } finally {
      setPending(undefined);
    }
  };

  const copyEndpoint = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${status.endpoint}`);
    setMessage("MCP endpoint copied.");
  };

  return (
    <Stack spacing={2.5}>
      {message && <Alert severity={message.includes("copied") ? "success" : "info"} onClose={() => setMessage(undefined)}>{message}</Alert>}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <StatusChip status={status.state} />
          <Chip label="API online" color="success" size="small" variant="outlined" />
          <Chip label={status.websocketStatus} color="info" size="small" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button variant="contained" startIcon={<Play size={20} />} disabled={!status.controlsEnabled || status.state === "online" || Boolean(pending)} onClick={() => void control("start")}>Start server</Button>
          <Button variant="outlined" color="inherit" startIcon={<Square size={20} />} disabled={!status.controlsEnabled || status.state === "offline" || Boolean(pending)} onClick={() => void control("stop")}>Stop</Button>
          <Button variant="outlined" startIcon={<RotateCcw size={20} />} disabled={!status.controlsEnabled || Boolean(pending)} onClick={() => void control("restart")}>Restart</Button>
          <Tooltip title="Copy MCP URL"><IconButton aria-label="Copy MCP URL" onClick={() => void copyEndpoint()}><Copy size={20} /></IconButton></Tooltip>
          <Tooltip title="Refresh"><IconButton aria-label="Refresh MCP status" onClick={() => void refresh()}><RefreshCw size={20} /></IconButton></Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Connected devices" value={status.connectedDevices} icon={<MonitorSmartphone size={24} />} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Active agents" value={status.activeAgents} icon={<Bot size={24} />} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="MCP tools" value={status.toolCount} icon={<Wrench size={24} />} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Memory" value={`${Math.round(status.memoryBytes / 1024 / 1024)} MB`} icon={<MemoryStick size={24} />} /></Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <SectionCard title="Server details" subtitle="Streamable HTTP endpoint with a managed STDIO worker.">
            <Stack spacing={1.5}>
              {[
                ["MCP endpoint", status.endpoint],
                ["Transport", status.transport],
                ["Uptime", formatUptime(status.uptimeSeconds)],
                ["PID", status.pid?.toString() ?? "Not running"],
                ["Connected clients", status.connectedClients.toString()],
                ["Requests / errors", `${status.requestCount} / ${status.errorCount}`],
              ].map(([label, value]) => (
                <Stack key={label} direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>{value}</Typography>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionCard title="Live terminal" subtitle="Read-only operational events with secret redaction." action={<Tooltip title="Clear logs"><IconButton aria-label="Clear logs" size="small" disabled={Boolean(pending)} onClick={() => void control("clear")}><Trash2 size={20} /></IconButton></Tooltip>} noPadding>
            <McpTerminal logs={logs} />
          </SectionCard>
        </Grid>
      </Grid>
      {!status.controlsEnabled && <Alert severity="warning">Set MCP_MANAGEMENT_TOKEN before enabling production management controls.</Alert>}

      {overview && (
        <SectionCard
          title="Security & tool health"
          subtitle="Gateway activity across every registered MCP tool."
          action={<LinkButton href="/dashboard/mcp/tools">Manage tools</LinkButton>}
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard label="Enabled tools" value={`${overview.tools.enabled}/${overview.tools.total}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard label="Tool requests" value={overview.tools.requests} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard label="Failed requests" value={overview.tools.errors} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard label="Active sessions" value={overview.security.activeSessions} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard label="Connected agents" value={overview.security.connectedAgents} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard label="Rate-limit events" value={overview.security.rateLimitEvents} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MetricCard label="Terminal events" value={overview.terminal.events} />
            </Grid>
          </Grid>
          <Stack spacing={1} sx={{ mt: 2.5 }}>
            <Typography variant="subtitle2">Recent audit activity</Typography>
            {overview.recentAudit.length === 0 && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>No activity recorded yet.</Typography>
            )}
            {overview.recentAudit.map((entry) => (
              <Stack key={entry.id} direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {entry.action} · {entry.actorType}
                </Typography>
                <Chip
                  label={entry.success ? "ok" : "failed"}
                  color={entry.success ? "success" : "error"}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            ))}
          </Stack>
        </SectionCard>
      )}
      <Box sx={{ display: "none" }} aria-hidden />
    </Stack>
  );
}
