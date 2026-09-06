"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Copy, MemoryStick, MonitorSmartphone, Play, RefreshCw, RotateCcw, Square, Trash2, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  state: "offline", apiStatus: "online", websocketStatus: "SSE connected", uptimeSeconds: 0, pid: null,
  transport: "STDIO + Streamable HTTP", endpoint: "/api/mcp", connectedClients: 0, activeAgents: 0,
  connectedDevices: 0, toolCount: 9, requestCount: 0, errorCount: 0, memoryBytes: 0, controlsEnabled: false,
};

function formatUptime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function IconAction({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon" aria-label={label} onClick={onClick} disabled={disabled} />}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function McpConsole() {
  const [status, setStatus] = useState(initialStatus);
  const [logs, setLogs] = useState<McpLogEntry[]>([]);
  const [overview, setOverview] = useState<McpOverview | null>(null);
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState<string>();

  const refresh = useCallback(async () => {
    const [statusResponse, logsResponse, overviewResponse] = await Promise.all([
      fetch("/api/mcp/status"), fetch("/api/system/logs"), fetch("/api/mcp/overview"),
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
    <div className="space-y-5">
      {message && (
        <Alert className={message.includes("copied") ? "border-success/30 bg-success/10 text-success" : ""} variant={message.includes("copied") ? "default" : "destructive"}>
          <AlertDescription className={message.includes("copied") ? "text-success" : ""}>{message}</AlertDescription>
          <Button variant="ghost" size="icon-xs" className="absolute top-2 right-2" onClick={() => setMessage(undefined)} aria-label="Dismiss message">×</Button>
        </Alert>
      )}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={status.state} />
          <Badge variant="outline" className="border-success/30 bg-success/10 text-success">API online</Badge>
          <Badge variant="outline" className="border-info/30 bg-info/10 text-info">{status.websocketStatus}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!status.controlsEnabled || status.state === "online" || Boolean(pending)} onClick={() => void control("start")}><Play size={17} />Start server</Button>
          <Button variant="outline" disabled={!status.controlsEnabled || status.state === "offline" || Boolean(pending)} onClick={() => void control("stop")}><Square size={17} />Stop</Button>
          <Button variant="outline" disabled={!status.controlsEnabled || Boolean(pending)} onClick={() => void control("restart")}><RotateCcw size={17} />Restart</Button>
          <IconAction label="Copy MCP URL" onClick={() => void copyEndpoint()}><Copy size={17} /></IconAction>
          <IconAction label="Refresh MCP status" onClick={() => void refresh()}><RefreshCw size={17} /></IconAction>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Connected devices" value={status.connectedDevices} icon={<MonitorSmartphone size={21} />} />
        <MetricCard label="Active agents" value={status.activeAgents} icon={<Bot size={21} />} />
        <MetricCard label="MCP tools" value={status.toolCount} icon={<Wrench size={21} />} />
        <MetricCard label="Memory" value={`${Math.round(status.memoryBytes / 1024 / 1024)} MB`} icon={<MemoryStick size={21} />} />
        <SectionCard title="Server details" subtitle="Streamable HTTP endpoint with a managed STDIO worker." className="xl:col-span-2">
          <dl className="divide-y divide-border">
            {[
              ["MCP endpoint", status.endpoint], ["Transport", status.transport], ["Uptime", formatUptime(status.uptimeSeconds)],
              ["PID", status.pid?.toString() ?? "Not running"], ["Connected clients", status.connectedClients.toString()],
              ["Requests / errors", `${status.requestCount} / ${status.errorCount}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-5 py-3 first:pt-0 last:pb-0">
                <dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-all text-right font-mono text-xs font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
        <SectionCard title="Live terminal" subtitle="Read-only operational events with secret redaction." className="sm:col-span-2 xl:col-span-2" action={<IconAction label="Clear logs" disabled={Boolean(pending)} onClick={() => void control("clear")}><Trash2 size={16} /></IconAction>} noPadding>
          <McpTerminal logs={logs} />
        </SectionCard>
      </div>
      {!status.controlsEnabled && <Alert><AlertDescription>Set MCP_MANAGEMENT_TOKEN before enabling production management controls.</AlertDescription></Alert>}

      {overview && (
        <SectionCard title="Security & tool health" subtitle="Gateway activity across every registered MCP tool." action={<LinkButton href="/dashboard/mcp/tools">Manage tools</LinkButton>}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Enabled tools" value={`${overview.tools.enabled}/${overview.tools.total}`} />
            <MetricCard label="Tool requests" value={overview.tools.requests} />
            <MetricCard label="Failed requests" value={overview.tools.errors} />
            <MetricCard label="Active sessions" value={overview.security.activeSessions} />
            <MetricCard label="Connected agents" value={overview.security.connectedAgents} />
            <MetricCard label="Rate-limit events" value={overview.security.rateLimitEvents} />
            <MetricCard label="Terminal events" value={overview.terminal.events} />
          </div>
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">Recent audit activity</p>
            {overview.recentAudit.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
            {overview.recentAudit.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">{entry.action} · {entry.actorType}</p>
                <Badge variant="outline" className={entry.success ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}>{entry.success ? "ok" : "failed"}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
