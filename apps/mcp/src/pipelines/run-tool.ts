import type { Role } from "@prisma/client";
import { hasRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, redact } from "@/lib/audit";
import type { Identity } from "../policies/identity";
import { assertToolEnabled, ensureToolRegistered, recordToolUsage } from "../policies/registry";
import { GatewayError, acquireConcurrencySlot, assertPayloadSize, withTimeout } from "../policies/limits";

export interface ToolCallOutcome {
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}

interface RunToolOptions {
  identity: Identity;
  name: string;
  description: string;
  requiredRole: Role;
  input: unknown;
  signal?: AbortSignal;
  execute: () => Promise<unknown>;
}

/**
 * The MCP Security Gateway: every registered tool call flows through this one
 * pipeline — rate limiting, role authorization, the admin-managed tool
 * allowlist, payload/concurrency/timeout limits, execution, output
 * redaction, and a structured audit log entry. Tools never implement any of
 * this themselves (see `server/gateway-tool.ts`).
 */
export async function runToolPipeline(options: RunToolOptions): Promise<ToolCallOutcome> {
  const { identity, name, description, requiredRole, input, signal, execute } = options;
  const identityKey = identity.userId ?? identity.label;
  const startedAt = Date.now();

  await ensureToolRegistered(name, description, requiredRole);

  const auditBase = {
    actorType: identity.type,
    userId: identity.userId ?? null,
    action: `mcp.tool.${name}`,
    targetType: "mcp_tool",
    targetId: name,
  };

  const fail = async (code: GatewayError["code"] | "VALIDATION_ERROR", message: string) => {
    await logAudit({ ...auditBase, success: false, metadata: { code, input: redact(input) } });
    return { ok: false, error: { code, message } } satisfies ToolCallOutcome;
  };

  if (!hasRole(identity.role, requiredRole)) {
    return fail("FORBIDDEN", `Role "${identity.role}" is not permitted to call "${name}".`);
  }

  try {
    await assertToolEnabled(name);
    assertPayloadSize(input);

    if (rateLimit(`mcp:tool:${name}`, identityKey, 60, 60_000).limited) {
      throw new GatewayError("RATE_LIMITED", "Rate limit exceeded for this tool. Try again shortly.");
    }

    const release = acquireConcurrencySlot(identityKey);
    let result: unknown;
    try {
      result = await withTimeout(execute(), undefined, signal);
    } finally {
      release();
    }

    const durationMs = Date.now() - startedAt;
    await recordToolUsage(name, durationMs, true);
    await logAudit({ ...auditBase, success: true, metadata: { input: redact(input), durationMs } });
    return { ok: true, data: redact(result) };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    await recordToolUsage(name, durationMs, false);
    if (error instanceof GatewayError) {
      return fail(error.code, error.message);
    }
    console.error(`[mcp] tool "${name}" failed`, error);
    return fail("INTERNAL_ERROR", "The tool failed to execute.");
  }
}
