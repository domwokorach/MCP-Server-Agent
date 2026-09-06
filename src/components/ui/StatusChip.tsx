import Chip from "@mui/material/Chip";
import type { ChipProps } from "@mui/material/Chip";

type Status =
  | "online"
  | "offline"
  | "connecting"
  | "reconnecting"
  | "busy"
  | "disabled"
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "info"
  | "success"
  | "warning"
  | "error";

const statusConfig: Record<Status, { label: string; color: ChipProps["color"] }> = {
  online: { label: "Online", color: "success" },
  offline: { label: "Offline", color: "default" },
  connecting: { label: "Connecting", color: "info" },
  reconnecting: { label: "Reconnecting", color: "warning" },
  busy: { label: "Busy", color: "warning" },
  disabled: { label: "Disabled", color: "default" },
  pending: { label: "Pending", color: "default" },
  running: { label: "Running", color: "info" },
  completed: { label: "Completed", color: "success" },
  failed: { label: "Failed", color: "error" },
  info: { label: "Info", color: "info" },
  success: { label: "Success", color: "success" },
  warning: { label: "Warning", color: "warning" },
  error: { label: "Error", color: "error" },
};

interface StatusChipProps {
  status: Status;
  size?: ChipProps["size"];
}

export function StatusChip({ status, size = "small" }: StatusChipProps) {
  const config = statusConfig[status];
  return <Chip label={config.label} color={config.color} size={size} variant="outlined" />;
}
