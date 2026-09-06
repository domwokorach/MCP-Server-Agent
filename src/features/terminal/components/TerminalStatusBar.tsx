import { Badge } from "@/components/ui/badge";

interface TerminalStatusBarProps {
  cwd: string;
  busy: boolean;
  allowedCommands: string[];
}

export function TerminalStatusBar({ cwd, busy, allowedCommands }: TerminalStatusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      <Badge className={busy ? "border-warning/30 bg-warning/10 text-warning" : "border-success/30 bg-success/10 text-success"}>
        <span className="size-1.5 rounded-full bg-current" />{busy ? "Running…" : "MCP Connected"}
      </Badge>
      <span className="font-mono text-muted-foreground">{cwd}</span>
      <span className="text-muted-foreground">Allowed: {allowedCommands.join(", ") || "none"}</span>
    </div>
  );
}
