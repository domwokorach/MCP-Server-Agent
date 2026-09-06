import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GatewayError } from "./limits";

/** Ensures a registry row exists for a tool, seeding it with the code-defined defaults on first run. */
export async function ensureToolRegistered(name: string, description: string, requiredRole: Role): Promise<void> {
  await prisma.mcpToolConfig.upsert({
    where: { name },
    update: { description, requiredRole },
    create: { name, description, requiredRole },
  });
}

/** Throws when the tool has been disabled by an administrator via the tool management dashboard. */
export async function assertToolEnabled(name: string): Promise<void> {
  const config = await prisma.mcpToolConfig.findUnique({ where: { name } });
  if (config && !config.enabled) {
    throw new GatewayError("TOOL_DISABLED", `Tool "${name}" is currently disabled by an administrator.`);
  }
}

export async function recordToolUsage(name: string, durationMs: number, success: boolean): Promise<void> {
  await prisma.mcpToolConfig
    .update({
      where: { name },
      data: {
        requestCount: { increment: 1 },
        errorCount: success ? undefined : { increment: 1 },
        totalDurationMs: { increment: Math.max(0, Math.round(durationMs)) },
      },
    })
    .catch(() => {
      // Registry row not seeded yet (race with ensureToolRegistered) — safe to drop this sample.
    });
}
