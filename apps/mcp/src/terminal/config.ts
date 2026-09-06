import path from "node:path";

const DENYLIST = new Set([
  "bash",
  "sh",
  "zsh",
  "fish",
  "powershell",
  "powershell.exe",
  "pwsh",
  "cmd",
  "cmd.exe",
  "ssh",
  "scp",
  "sudo",
  "doas",
  "su",
  "rm",
  "rmdir",
  "del",
  "format",
  "mkfs",
  "dd",
  "chmod",
  "chown",
  "curl",
  "wget",
  "nc",
  "netcat",
  "kill",
  "killall",
  "shutdown",
  "reboot",
  "eval",
  "exec",
]);

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isTerminalEnabled(): boolean {
  return process.env.MCP_TERMINAL_ENABLED === "true";
}

export function getAllowedCommands(): Set<string> {
  return new Set(parseList(process.env.MCP_TERMINAL_ALLOWED_COMMANDS || "npm,node,git,npx"));
}

export function getAllowedPaths(): string[] {
  const configured = parseList(process.env.MCP_TERMINAL_ALLOWED_PATHS || "./apps,./packages");
  return configured.map((entry) => path.resolve(/* turbopackIgnore: true */ process.cwd(), entry));
}

export function getTimeoutMs(): number {
  return Number(process.env.MCP_TERMINAL_TIMEOUT_MS) || 15_000;
}

export function getMaxOutputBytes(): number {
  return Number(process.env.MCP_TERMINAL_MAX_OUTPUT_BYTES) || 200_000;
}

export function isCommandDenied(command: string): boolean {
  return DENYLIST.has(command.toLowerCase());
}

/** Only a small, explicit set of environment variables ever reach the spawned process. */
export function getSafeEnv(): NodeJS.ProcessEnv {
  const base: NodeJS.ProcessEnv = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: process.env.NODE_ENV };
  const extra = parseList(process.env.MCP_TERMINAL_ENV_ALLOWLIST);
  for (const key of extra) {
    if (process.env[key] !== undefined) base[key] = process.env[key];
  }
  return base;
}

/** Resolves `requestedCwd` against the allowlisted paths, rejecting traversal outside of them. */
export function resolveAllowedCwd(requestedCwd: string): string | null {
  const resolved = path.resolve(/* turbopackIgnore: true */ process.cwd(), requestedCwd);
  const allowed = getAllowedPaths();
  const isAllowed = allowed.some((base) => resolved === base || resolved.startsWith(`${base}${path.sep}`));
  return isAllowed ? resolved : null;
}
