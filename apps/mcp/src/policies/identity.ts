import type { Role } from "@prisma/client";
import type { McpRequestContext } from "@modelcontextprotocol/server";

export interface Identity {
  /** "user" — an authenticated dashboard session; "agent" — a remote API-key client; "system" — trusted local STDIO. */
  type: "user" | "agent" | "system";
  userId?: string;
  role: Role;
  /** Human-readable label for audit logs and gateway diagnostics (never a secret). */
  label: string;
}

const DEFAULT_STDIO_ROLE: Role = "developer";

/**
 * Resolves the caller identity for a fresh server instance. HTTP requests carry
 * `authInfo` (populated by the authenticated `/api/mcp` route, see
 * `src/lib/mcp-auth.ts`); STDIO connections have none and are trusted as the
 * locally configured operator role — the same trust boundary any local MCP
 * client (VS Code, Claude Code, Copilot CLI) already has via process/file access.
 */
export function resolveIdentity(ctx: McpRequestContext): Identity {
  const extra = ctx.authInfo?.extra as
    | { type?: Identity["type"]; userId?: string; role?: Role; label?: string }
    | undefined;

  if (extra) {
    return {
      type: extra.type ?? "user",
      userId: extra.userId,
      role: extra.role ?? "user",
      label: extra.label ?? "remote-client",
    };
  }

  const role = (process.env.MCP_STDIO_ROLE as Role) || DEFAULT_STDIO_ROLE;
  return { type: "system", role, label: "local-stdio" };
}
