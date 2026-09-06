"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, CheckCircle2, CircleAlert, CircleDashed, Plug, RefreshCw, ShieldCheck, Unplug, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <dl className="divide-y divide-border">
      {fields.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="break-all text-sm font-medium text-foreground sm:text-right">{value}</dd>
        </div>
      ))}
    </dl>
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

export function DeviceDetail({ initialDevice, tasks, activity }: {
  initialDevice: Device;
  tasks: AgentTask[];
  activity: ActivityEvent[];
}) {
  const router = useRouter();
  const [device, setDevice] = useState(initialDevice);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
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

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><DeviceTypeIcon type={device.type} size={26} /></div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight">{device.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><StatusIcon className="size-4" /><span>{device.status} · {device.os} {device.osVersion}</span></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {device.status === "offline" ? (
              <Button disabled={!!pending} onClick={() => void runAction("connect")}><Plug size={17} />Connect</Button>
            ) : (
              <Button variant="outline" disabled={!!pending || device.status === "disabled"} onClick={() => setConfirmDisconnect(true)}><Unplug size={17} />Disconnect</Button>
            )}
            <Button variant="ghost" disabled={!!pending || device.status === "disabled"} onClick={() => void runAction("reconnect")}><RefreshCw size={17} />Reconnect</Button>
            <Button variant="ghost" onClick={() => router.push("/dashboard/devices")}>All devices</Button>
          </div>
        </div>
      </SectionCard>

      <Tabs value={tab} onValueChange={(value) => setTab(value as (typeof tabs)[number])}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border p-0">
          {tabs.map((label) => <TabsTrigger key={label} value={label} className="flex-none rounded-none px-3 py-2.5 text-xs sm:text-sm">{label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="Overview" className="mt-5">
          <div className="grid gap-5 md:grid-cols-12">
            <SectionCard title="Connection overview" subtitle="Current console connection and companion application health." className="md:col-span-7">
              <FieldList fields={[["Status", device.status], ["Last activity", formatDateTime(device.lastActivity)], ["Last seen", formatDateTime(device.lastSeen)], ["Companion app", device.appVersion]]} />
            </SectionCard>
            <SectionCard title="Device profile" className="md:col-span-5">
              <FieldList fields={[["Type", device.type], ["Operating system", `${device.os} ${device.osVersion}`], ["Device ID", device.deviceId], ["Permitted IP", device.permittedIp]]} />
            </SectionCard>
          </div>
        </TabsContent>
        <TabsContent value="Agent" className="mt-5">
          <div className="grid gap-5 md:grid-cols-12">
            <SectionCard title="Agent connection" subtitle="Scoped to approved tasks; it cannot operate the device directly." className="md:col-span-5">
              <FieldList fields={[["Connection", device.agentConnection], ["Active tasks", device.activeTasks], ["Last agent check-in", formatRelativeTime(device.lastActivity)]]} />
            </SectionCard>
            <SectionCard title="Recent agent work" className="md:col-span-7">
              {deviceTasks.length ? <div className="space-y-4">{deviceTasks.map((task) => <div key={task.id}><p className="text-sm font-medium">{task.instruction}</p><p className="mt-1 text-xs text-muted-foreground">{task.status} · {formatDateTime(task.createdAt)}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No agent work has been assigned to this device.</p>}
            </SectionCard>
          </div>
        </TabsContent>
        <TabsContent value="MCP" className="mt-5">
          <div className="grid gap-5 md:grid-cols-2">
            <SectionCard title="MCP connection" subtitle="The MCP gateway exposes only the approved task surface.">
              <FieldList fields={[["Connection", device.mcpConnection], ["Gateway", "Connected Devices MCP"], ["Endpoint", "/api/mcp"], ["Last heartbeat", formatRelativeTime(device.lastSeen)]]} />
            </SectionCard>
            <SectionCard title="Available scope">
              <ul className="space-y-3 text-sm text-muted-foreground"><li>Read connection health and companion version</li><li>Queue approved agent tasks</li><li>Report task and connection activity</li></ul>
            </SectionCard>
          </div>
        </TabsContent>
        <TabsContent value="Tasks" className="mt-5">
          <SectionCard title="Task history" subtitle="Tasks are recorded with their lifecycle state.">
            {deviceTasks.length ? <div className="divide-y divide-border">{deviceTasks.map((task) => <div key={task.id} className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">{task.instruction}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{task.id} · {formatDateTime(task.createdAt)}</p></div><StatusChip status={task.status} /></div>)}</div> : <p className="text-sm text-muted-foreground">No tasks are recorded for this device.</p>}
          </SectionCard>
        </TabsContent>
        <TabsContent value="Activity" className="mt-5">
          <SectionCard title="Connection activity" subtitle="Recent device, MCP, and agent events.">
            <div className="space-y-4">
              {(deviceActivity.length ? deviceActivity : [{ id: "current", message: "Connection status last checked", severity: "info" as const, source: device.name, timestamp: device.lastSeen }]).map((event) => (
                <div key={event.id} className="flex gap-3"><Activity className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-sm">{event.message}</p><p className="mt-1 text-xs text-muted-foreground">{event.source} · {formatDateTime(event.timestamp)}</p></div></div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
        <TabsContent value="Security" className="mt-5">
          <div className="grid gap-5 md:grid-cols-2">
            <SectionCard title="Network approval" subtitle="Connections are limited to the approved network identity.">
              <FieldList fields={[["Permitted IP address", device.permittedIp], ["Pairing approval", "Approved"], ["Last seen", formatDateTime(device.lastSeen)]]} />
            </SectionCard>
            <SectionCard title="Access boundaries">
              <div className="flex gap-3 text-sm leading-6 text-muted-foreground"><ShieldCheck className="size-5 shrink-0 text-success" /><p>The console manages connection metadata and approved agent tasks. It does not expose direct device control.</p></div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog open={confirmDisconnect} title={`Disconnect ${device.name}?`} description="The console will end its MCP and agent sessions. You can reconnect this device later." confirmLabel="Disconnect" loading={pending === "disconnect"} onConfirm={() => void runAction("disconnect")} onClose={() => setConfirmDisconnect(false)} />
      {notice && <Alert className={`fixed right-4 bottom-4 z-50 w-[min(24rem,calc(100vw-2rem))] shadow-xl ${notice.severity === "success" ? "border-success/30 bg-success/10 text-success" : ""}`} variant={notice.severity === "error" ? "destructive" : "default"}><AlertDescription className={notice.severity === "success" ? "text-success" : ""}>{notice.message}</AlertDescription><Button variant="ghost" size="icon-xs" className="absolute top-2 right-2" onClick={() => setNotice(null)} aria-label="Dismiss message">×</Button></Alert>}
    </div>
  );
}
