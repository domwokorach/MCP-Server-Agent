"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Link2,
  LoaderCircle,
  Pencil,
  Plug,
  RefreshCw,
  Search,
  Trash2,
  Unplug,
  WifiOff,
} from "lucide-react";

import { ConfirmDialog, EmptyState } from "@/components/ui";
import { formatRelativeTime } from "@/lib/format";
import type { Device, DeviceStatus, DeviceType } from "@/types";
import { DeviceTypeIcon } from "./DeviceTypeIcon";

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

const statusMeta: Record<DeviceStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  online: { label: "Online", color: "success.main", Icon: CheckCircle2 },
  offline: { label: "Offline", color: "text.secondary", Icon: WifiOff },
  connecting: { label: "Connecting", color: "info.main", Icon: LoaderCircle },
  reconnecting: { label: "Reconnecting", color: "warning.main", Icon: RefreshCw },
  busy: { label: "Busy", color: "warning.main", Icon: CircleDashed },
  error: { label: "Error", color: "error.main", Icon: CircleAlert },
  disabled: { label: "Disabled", color: "text.secondary", Icon: Unplug },
};

function ConnectionLabel({ label, value }: { label: string; value: Device["mcpConnection"] }) {
  const connected = value === "connected";
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
      <CheckCircle2 size={15} color={connected ? "var(--mui-palette-success-main)" : "var(--text-muted)"} />
      <Typography variant="caption" color="text.secondary" noWrap>
        {label}: {value}
      </Typography>
    </Stack>
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

function DeviceCard({
  device,
  onChanged,
  onRemoved,
}: {
  device: Device;
  onChanged: (device: Device) => void;
  onRemoved: (id: string) => void;
}) {
  const [confirmation, setConfirmation] = useState<"disconnect" | "remove" | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState(device.name);
  const [pendingAction, setPendingAction] = useState<DeviceAction | null>(null);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const meta = statusMeta[device.status];
  const StatusIcon = meta.Icon;

  const runAction = async (action: DeviceAction, nextName?: string) => {
    setPendingAction(action);
    const result = await requestDeviceAction(device.id, action, nextName);
    setPendingAction(null);
    setConfirmation(null);
    if (result.success && result.device) onChanged(result.device);
    if (result.success && result.removedId) onRemoved(result.removedId);
    setNotice({ severity: result.success ? "success" : "error", message: result.message });
    if (result.success && action === "rename") setRenameOpen(false);
  };

  return (
    <>
      <Card sx={{ height: "100%", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, flexGrow: 1 }}>
          <Stack spacing={2.25}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
              <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: "center" }}>
                <Box sx={{ p: 1, borderRadius: "var(--radius-md)", bgcolor: "action.hover", display: "flex" }}>
                  <DeviceTypeIcon type={device.type} size={22} color="var(--mui-palette-primary-main)" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="h2" variant="h6" noWrap>{device.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{device.os} {device.osVersion}</Typography>
                </Box>
              </Stack>
              <Chip icon={<StatusIcon size={15} />} label={meta.label} size="small" variant="outlined" sx={{ color: meta.color, borderColor: meta.color }} />
            </Stack>

            <Grid container rowSpacing={1.25} columnSpacing={2}>
              {[
                ["Device ID", device.deviceId],
                ["Permitted IP", device.permittedIp],
                ["App version", device.appVersion],
                ["Active tasks", String(device.activeTasks)],
              ].map(([label, value]) => (
                <Grid key={label} size={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
                  <Typography variant="body2" noWrap title={value} sx={{ fontWeight: 600 }}>{value}</Typography>
                </Grid>
              ))}
            </Grid>

            <Stack spacing={0.75}>
              <ConnectionLabel label="MCP" value={device.mcpConnection} />
              <ConnectionLabel label="Agent" value={device.agentConnection} />
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ color: "text.secondary", flexWrap: "wrap" }}>
              <Typography variant="caption">Active {formatRelativeTime(device.lastActivity)}</Typography>
              <Typography variant="caption">Seen {formatRelativeTime(device.lastSeen)}</Typography>
            </Stack>
          </Stack>
        </CardContent>
        <CardActions sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, pt: 0, gap: 0.75, flexWrap: "wrap" }}>
          <Button component={Link} href={`/dashboard/devices/${device.id}`} size="small">Details</Button>
          {device.status === "offline" ? (
            <Button size="small" variant="contained" startIcon={<Plug size={16} />} disabled={!!pendingAction} onClick={() => runAction("connect")}>Connect</Button>
          ) : (
            <Button size="small" variant="outlined" startIcon={<Unplug size={16} />} disabled={!!pendingAction || device.status === "disabled"} onClick={() => setConfirmation("disconnect")}>Disconnect</Button>
          )}
          <Button size="small" variant="text" startIcon={<RefreshCw size={15} />} disabled={!!pendingAction || device.status === "disabled"} onClick={() => runAction("reconnect")}>Reconnect</Button>
          <Button size="small" variant="text" aria-label={`Rename ${device.name}`} onClick={() => setRenameOpen(true)}><Pencil size={16} /></Button>
          <Button size="small" color="error" aria-label={`Remove ${device.name}`} onClick={() => setConfirmation("remove")}><Trash2 size={16} /></Button>
        </CardActions>
      </Card>

      <ConfirmDialog
        open={confirmation === "disconnect"}
        title={`Disconnect ${device.name}?`}
        description="The console will end its MCP and agent sessions. You can reconnect this device later."
        confirmLabel="Disconnect"
        loading={pendingAction === "disconnect"}
        onConfirm={() => runAction("disconnect")}
        onClose={() => setConfirmation(null)}
      />
      <ConfirmDialog
        open={confirmation === "remove"}
        title={`Remove ${device.name}?`}
        description="This removes the device from this console and revokes its current console connection."
        confirmLabel="Remove device"
        destructive
        loading={pendingAction === "remove"}
        onConfirm={() => runAction("remove")}
        onClose={() => setConfirmation(null)}
      />
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Rename device</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Device name" value={name} onChange={(event) => setName(event.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={pendingAction === "rename"} onClick={() => runAction("rename", name)}>
            {pendingAction === "rename" ? "Saving…" : "Save name"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)}>
        <Alert severity={notice?.severity} onClose={() => setNotice(null)} variant="filled">{notice?.message}</Alert>
      </Snackbar>
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
      const matchesQuery = !normalized || [device.name, device.os, device.osVersion, device.deviceId].some((value) => value.toLowerCase().includes(normalized));
      return matchesFilter && matchesQuery;
    });
  }, [devices, filter, query]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {filters.map((item) => <Button key={item.value} size="small" variant={filter === item.value ? "contained" : "outlined"} onClick={() => setFilter(item.value)} sx={{ whiteSpace: "nowrap" }}>{item.label}</Button>)}
        </Stack>
        <TextField
          size="small"
          placeholder="Search name, OS, or device ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> } }}
          sx={{ width: { xs: "100%", md: 320 } }}
        />
      </Stack>
      {filtered.length === 0 ? (
        <EmptyState icon={<Link2 size="inherit" />} title={devices.length ? "No matching devices" : "No connected devices"} description={devices.length ? "Try another filter or search term." : "Pair a mobile, desktop, or laptop to begin."} />
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((device) => <Grid key={device.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}><DeviceCard device={device} onChanged={(updated) => setDevices((items) => items.map((item) => item.id === updated.id ? updated : item))} onRemoved={(id) => setDevices((items) => items.filter((item) => item.id !== id))} /></Grid>)}
        </Grid>
      )}
    </Stack>
  );
}
