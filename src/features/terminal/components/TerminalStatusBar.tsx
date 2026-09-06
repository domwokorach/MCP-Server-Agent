import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

interface TerminalStatusBarProps {
  cwd: string;
  busy: boolean;
  allowedCommands: string[];
}

export function TerminalStatusBar({ cwd, busy, allowedCommands }: TerminalStatusBarProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
      <Chip size="small" color={busy ? "warning" : "success"} label={busy ? "Running…" : "● MCP Connected"} />
      <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
        {cwd}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Allowed: {allowedCommands.join(", ") || "none"}
      </Typography>
    </Stack>
  );
}
