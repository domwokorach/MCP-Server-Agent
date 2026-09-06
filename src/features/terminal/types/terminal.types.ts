export interface TerminalLine {
  id: string;
  kind: "input" | "stdout" | "stderr" | "system" | "error";
  text: string;
  timestamp: string;
}

export interface TerminalExecuteResponse {
  ok?: boolean;
  cwd?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  truncated?: boolean;
  timedOut?: boolean;
  requiresConfirmation?: boolean;
  tier?: "REQUIRES_CONFIRMATION" | "ADMIN_ONLY";
  message?: string;
  error?: { code: string; message: string };
}

export interface TerminalBootstrap {
  enabled: boolean;
  role: string;
  canUseTerminal: boolean;
  allowedCommands: string[];
  defaultCwd: string;
}

export interface PendingConfirmation {
  line: string;
  tier: string;
  message: string;
}
