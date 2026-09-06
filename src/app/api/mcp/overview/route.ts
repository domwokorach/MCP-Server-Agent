import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { mcpRuntime } from "@/services/mcpRuntimeService";
import { getRateLimitEventCount } from "@/lib/rate-limit";
import { isTerminalEnabled } from "../../../../../apps/mcp/src/terminal/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "developer")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const [tools, activeSessions, recentAudit, terminalEvents, distinctAgents] = await Promise.all([
    prisma.mcpToolConfig.findMany(),
    prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.auditLog.count({ where: { targetId: "terminal_execute" } }),
    prisma.auditLog.findMany({
      where: { action: { startsWith: "mcp.tool." }, actorType: "agent" },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const toolRequests = tools.reduce((sum, tool) => sum + tool.requestCount, 0);
  const toolErrors = tools.reduce((sum, tool) => sum + tool.errorCount, 0);

  return NextResponse.json({
    mcp: mcpRuntime.getStatus(),
    stdio: { available: true, role: process.env.MCP_STDIO_ROLE || "developer" },
    http: { endpoint: "/mcp", authenticated: true },
    terminal: { enabled: isTerminalEnabled(), events: terminalEvents },
    tools: { total: tools.length, enabled: tools.filter((t) => t.enabled).length, requests: toolRequests, errors: toolErrors },
    security: { activeSessions, connectedAgents: distinctAgents.length, rateLimitEvents: getRateLimitEventCount() },
    recentAudit: recentAudit.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actorType: entry.actorType,
      success: entry.success,
      createdAt: entry.createdAt,
    })),
  });
}
