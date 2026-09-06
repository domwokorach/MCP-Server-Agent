import path from "node:path";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOriginCsrf } from "@/lib/api-security";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { classifyCommand } from "@/lib/terminal/command-policy";
import { TerminalInputError, tokenizeCommandLine } from "@/lib/terminal/tokenize";
import { runToolPipeline } from "../../../../../apps/mcp/src/pipelines/run-tool";
import { terminalExecuteInputSchema } from "../../../../../apps/mcp/src/schemas/tool-inputs";
import { getAllowedCommands, getAllowedPaths, isTerminalEnabled, resolveAllowedCwd } from "../../../../../apps/mcp/src/terminal/config";
import { terminalExecuteTool } from "../../../../../apps/mcp/src/tools/terminal-execute";
import type { Identity } from "../../../../../apps/mcp/src/policies/identity";
import type { TerminalResult } from "../../../../../apps/mcp/src/terminal/executor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This is the "Terminal Service" from the architecture diagram — the only
// bridge between the browser and the MCP terminal tool. It never lets the
// browser talk to the MCP process directly: every command is authenticated,
// role-checked, CSRF-checked, rate-limited, classified against a command
// policy tier, and then executed through the *same* MCP security gateway
// pipeline (`runToolPipeline`) used by STDIO/HTTP MCP clients, so audit logs
// and tool stats stay consistent regardless of caller.
const requestSchema = z.object({
  line: z.string().trim().min(1).max(600),
  cwd: z.string().trim().min(1).max(300),
  confirm: z.boolean().optional(),
});

/** Bootstrap info for the terminal UI: whether the tool is enabled, whether this user may use it, and the allowlists to display. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });

  const allowedPaths = getAllowedPaths();
  return Response.json({
    enabled: isTerminalEnabled(),
    role: user.role,
    canUseTerminal: hasRole(user.role, "admin"),
    allowedCommands: Array.from(getAllowedCommands()).sort(),
    defaultCwd: allowedPaths[0] ?? process.cwd(),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });
  if (!hasRole(user.role, "admin")) {
    return Response.json({ message: "The terminal requires the admin role." }, { status: 403 });
  }

  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const ip = clientIp(request);
  if (
    rateLimit("terminal:execute:user", user.id, 30, 60_000).limited ||
    rateLimit("terminal:execute:ip", ip, 60, 60_000).limited
  ) {
    return Response.json({ message: "Too many terminal requests. Slow down." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  if (!isTerminalEnabled()) {
    return Response.json(
      { message: "The terminal tool is disabled. An administrator must set MCP_TERMINAL_ENABLED=true." },
      { status: 503 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }
  const { line, cwd, confirm } = parsed.data;

  // `cd` only ever changes the client-tracked working directory — no process is spawned for it.
  const cdMatch = /^cd(?:\s+(.+))?$/.exec(line.trim());
  if (cdMatch) {
    const target = cdMatch[1]?.trim() || ".";
    const nextCwd = resolveAllowedCwd(path.join(/* turbopackIgnore: true */ cwd, target));
    if (!nextCwd) {
      return Response.json({ ok: false, error: { code: "FORBIDDEN", message: `"${target}" is outside the allowed paths.` } }, { status: 403 });
    }
    await logAudit({
      actorType: "user",
      userId: user.id,
      action: "terminal.cwd_changed",
      targetType: "terminal",
      metadata: { cwd: nextCwd },
      ipAddress: ip,
    });
    return Response.json({ ok: true, cwd: nextCwd, stdout: "", stderr: "", exitCode: 0 });
  }

  let tokens: { command: string; args: string[] };
  try {
    tokens = tokenizeCommandLine(line);
  } catch (error) {
    const message = error instanceof TerminalInputError ? error.message : "Invalid command.";
    return Response.json({ ok: false, error: { code: "FORBIDDEN", message } }, { status: 400 });
  }

  const classification = classifyCommand(tokens.command, tokens.args);
  if (classification.tier === "DENIED") {
    return Response.json({ ok: false, error: { code: "FORBIDDEN", message: classification.reason } }, { status: 403 });
  }
  if (classification.tier !== "SAFE" && !confirm) {
    return Response.json({ requiresConfirmation: true, tier: classification.tier, message: classification.reason }, { status: 409 });
  }

  const validated = terminalExecuteInputSchema.safeParse({ command: tokens.command, args: tokens.args, cwd });
  if (!validated.success) {
    return Response.json({ ok: false, error: { code: "VALIDATION_ERROR", message: validated.error.issues[0]?.message ?? "Invalid command." } }, { status: 400 });
  }

  const identity: Identity = { type: "user", userId: user.id, role: user.role, label: user.email };
  const outcome = await runToolPipeline({
    identity,
    name: terminalExecuteTool.name,
    description: terminalExecuteTool.description,
    requiredRole: terminalExecuteTool.requiredRole,
    input: validated.data,
    execute: () => terminalExecuteTool.handler(validated.data, { identity }),
  });

  if (!outcome.ok) {
    const status =
      outcome.error?.code === "RATE_LIMITED" || outcome.error?.code === "CONCURRENCY_LIMIT"
        ? 429
        : outcome.error?.code === "FORBIDDEN" || outcome.error?.code === "TOOL_DISABLED"
          ? 403
          : 500;
    return Response.json(outcome, { status });
  }
  // The browser terminal uses a purpose-built REST representation, while the
  // MCP transport keeps its gateway envelope. `outcome.data` has already
  // passed through output redaction and audit logging in runToolPipeline.
  return Response.json({ ok: true, cwd, ...(outcome.data as TerminalResult) });
}
