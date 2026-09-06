import { Badge } from "./badge";

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

const statusConfig: Record<Status, { label: string; className: string }> = {
  online: { label: "Online", className: "border-success/30 bg-success/10 text-success" },
  offline: { label: "Offline", className: "border-border bg-muted text-muted-foreground" },
  connecting: { label: "Connecting", className: "border-info/30 bg-info/10 text-info" },
  reconnecting: { label: "Reconnecting", className: "border-warning/30 bg-warning/10 text-warning" },
  busy: { label: "Busy", className: "border-warning/30 bg-warning/10 text-warning" },
  disabled: { label: "Disabled", className: "border-border bg-muted text-muted-foreground" },
  pending: { label: "Pending", className: "border-border bg-muted text-muted-foreground" },
  running: { label: "Running", className: "border-info/30 bg-info/10 text-info" },
  completed: { label: "Completed", className: "border-success/30 bg-success/10 text-success" },
  failed: { label: "Failed", className: "border-destructive/30 bg-destructive/10 text-destructive" },
  info: { label: "Info", className: "border-info/30 bg-info/10 text-info" },
  success: { label: "Success", className: "border-success/30 bg-success/10 text-success" },
  warning: { label: "Warning", className: "border-warning/30 bg-warning/10 text-warning" },
  error: { label: "Error", className: "border-destructive/30 bg-destructive/10 text-destructive" },
};

interface StatusChipProps {
  status: Status;
  size?: "small" | "medium";
}

export function StatusChip({ status, size = "small" }: StatusChipProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`${config.className} ${size === "medium" ? "h-6 px-2.5 text-sm" : ""}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}
