import { getAllowedCommands, isCommandDenied } from "../../../apps/mcp/src/terminal/config";

export type CommandTier = "SAFE" | "REQUIRES_CONFIRMATION" | "ADMIN_ONLY" | "DENIED";

export interface CommandClassification {
  tier: CommandTier;
  reason: string;
}

/** Read-only/informational subcommands — safe to run without an extra confirmation step. */
const SAFE_SUBCOMMANDS: Record<string, string[]> = {
  git: ["status", "log", "diff", "branch", "show", "remote", "rev-parse"],
  npm: ["ls", "list", "outdated", "ping", "view", "-v", "--version"],
  npx: ["--version"],
  node: ["-v", "--version"],
};

/** Subcommands allowed in principle but destructive/irreversible enough to require a stronger, explicit confirmation. */
const ADMIN_ONLY_SUBCOMMANDS: Record<string, string[]> = {
  git: ["push", "reset", "clean", "checkout"],
  npm: ["uninstall", "publish", "dedupe"],
};

/**
 * Classifies a tokenized command line into a security tier. Commands outside
 * the base allowlist (or explicitly denied) are always DENIED regardless of
 * subcommand — this only adds a finer-grained tier on top of the MCP
 * terminal's existing allow/deny lists, it never widens what is permitted.
 */
export function classifyCommand(command: string, args: string[]): CommandClassification {
  const normalized = command.toLowerCase();
  if (isCommandDenied(normalized) || !getAllowedCommands().has(normalized)) {
    return { tier: "DENIED", reason: `"${command}" is not on the allowed command list.` };
  }

  const subcommand = args[0]?.toLowerCase();
  if (subcommand && ADMIN_ONLY_SUBCOMMANDS[normalized]?.includes(subcommand)) {
    return { tier: "ADMIN_ONLY", reason: `"${command} ${subcommand}" is destructive and requires explicit confirmation.` };
  }
  if (subcommand && SAFE_SUBCOMMANDS[normalized]?.includes(subcommand)) {
    return { tier: "SAFE", reason: "Read-only command." };
  }
  return {
    tier: "REQUIRES_CONFIRMATION",
    reason: `"${command}${subcommand ? ` ${subcommand}` : ""}" may modify files or state — confirm to run it.`,
  };
}
