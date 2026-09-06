"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Link2,
  Pencil,
  Plug,
  RefreshCw,
  Search,
  Trash2,
  Unplug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, EmptyState, StatusChip } from "@/components/ui";
import { formatRelativeTime } from "@/lib/format";
import type { Device, DeviceType } from "@/types";
import { DeviceTypeIcon } from "./DeviceTypeIcon";
import { toast } from "sonner";

type Filter = "all" | DeviceType | "online" | "offline";
type DeviceAction = "connect" | "disconnect" | "reconnect" | "rename" | "remove";
type DeviceActionResult = { success: boolean; message: string; device?: Device; removedId?: string };

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
  { value: "laptop", label: "Laptop" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

function ConnectionLabel({ label, value }: { label: string; value: Device["mcpConnection"] }) {
  const connected = value === "connected";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <CheckCircle2 className={`size-3.5 shrink-0 ${connected ? "text-success" : "text-muted-foreground"}`} />
      <span className="truncate text-xs text-muted-foreground">{label}: {value}</span>
    </div>
  );
}

async function requestDeviceAction(deviceId: string, action: DeviceAction, name?: string): Promise<DeviceActionResult> {
  const response = await fetch(`/api/devices/${encodeURIComponent(deviceId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mcp-csrf": "1" },
    body: JSON.stringify({ action, name }),
  });
  return response.json();
}

function DeviceCard({ device, onChanged, onRemoved }: {
  device: Device;
  onChanged: (device: Device) => void;
  onRemoved: (id: string) => void;
}) {
  const [confirmation, setConfirmation] = useState<"disconnect" | "remove" | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState(device.name);
  const [pendingAction, setPendingAction] = useState<DeviceAction | null>(null);

  const runAction = async (action: DeviceAction, nextName?: string) => {
    setPendingAction(action);
    const result = await requestDeviceAction(device.id, action, nextName);
    setPendingAction(null);
    setConfirmation(null);
    if (result.success && result.device) onChanged(result.device);
    if (result.success && result.removedId) onRemoved(result.removedId);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    if (result.success && action === "rename") setRenameOpen(false);
  };

  return (
    <>
      <Card className="h-full rounded-2xl border border-border py-0 shadow-sm">
        <CardContent className="space-y-5 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><DeviceTypeIcon type={device.type} size={21} /></div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{device.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{device.os} {device.osVersion}</p>
              </div>
            </div>
            <StatusChip status={device.status === "error" ? "error" : device.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              ["Device ID", device.deviceId],
              ["Permitted IP", device.permittedIp],
              ["App version", device.appVersion],
              ["Active tasks", String(device.activeTasks)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1 truncate font-mono text-xs font-medium" title={value}>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-2">
            <ConnectionLabel label="MCP" value={device.mcpConnection} />
            <ConnectionLabel label="Agent" value={device.agentConnection} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Active {formatRelativeTime(device.lastActivity)}</span>
            <span>Seen {formatRelativeTime(device.lastSeen)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 px-5 pb-5">
          <Button render={<Link href={`/dashboard/devices/${device.id}`} />} nativeButton={false} variant="ghost" size="sm">Details</Button>
          {device.status === "offline" ? (
            <Button size="sm" disabled={!!pendingAction} onClick={() => void runAction("connect")}><Plug size={15} />Connect</Button>
          ) : (
            <Button size="sm" variant="outline" disabled={!!pendingAction || device.status === "disabled"} onClick={() => setConfirmation("disconnect")}><Unplug size={15} />Disconnect</Button>
          )}
          <Button size="icon-sm" variant="ghost" aria-label={`Reconnect ${device.name}`} disabled={!!pendingAction || device.status === "disabled"} onClick={() => void runAction("reconnect")}><RefreshCw size={16} /></Button>
          <Button size="icon-sm" variant="ghost" aria-label={`Rename ${device.name}`} onClick={() => setRenameOpen(true)}><Pencil size={16} /></Button>
          <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${device.name}`} onClick={() => setConfirmation("remove")}><Trash2 size={16} /></Button>
        </CardFooter>
      </Card>

      <ConfirmDialog open={confirmation === "disconnect"} title={`Disconnect ${device.name}?`} description="The console will end its MCP and agent sessions. You can reconnect this device later." confirmLabel="Disconnect" loading={pendingAction === "disconnect"} onConfirm={() => void runAction("disconnect")} onClose={() => setConfirmation(null)} />
      <ConfirmDialog open={confirmation === "remove"} title={`Remove ${device.name}?`} description="This removes the device from this console and revokes its current console connection." confirmLabel="Remove device" destructive loading={pendingAction === "remove"} onConfirm={() => void runAction("remove")} onClose={() => setConfirmation(null)} />
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename device</DialogTitle><DialogDescription>Update the name shown in this console.</DialogDescription></DialogHeader>
          <Input autoFocus maxLength={80} value={name} onChange={(event) => setName(event.target.value)} aria-label="Device name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button disabled={pendingAction === "rename"} onClick={() => void runAction("rename", name)}>{pendingAction === "rename" ? "Saving…" : "Save name"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DeviceConsole({ initialDevices }: { initialDevices: Device[] }) {
  const [devices, setDevices] = useState(initialDevices);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return devices.filter((device) => {
      const matchesFilter = filter === "all" || device.type === filter || device.status === filter;
      return matchesFilter && (!normalized || [device.name, device.os, device.osVersion, device.deviceId].some((value) => value.toLowerCase().includes(normalized)));
    });
  }, [devices, filter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
          {filters.map((item) => (
            <Button key={item.value} size="sm" variant={filter === item.value ? "default" : "ghost"} onClick={() => setFilter(item.value)} className="rounded-lg">
              {item.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, OS, or device ID" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" />
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<Link2 />} title={devices.length ? "No matching devices" : "No connected devices"} description={devices.length ? "Try another filter or search term." : "Pair a mobile, desktop, or laptop to begin."} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((device) => (
            <DeviceCard key={device.id} device={device} onChanged={(updated) => setDevices((items) => items.map((item) => item.id === updated.id ? updated : item))} onRemoved={(id) => setDevices((items) => items.filter((item) => item.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
