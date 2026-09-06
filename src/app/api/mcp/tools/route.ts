import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "developer")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const tools = await prisma.mcpToolConfig.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      enabled: tool.enabled,
      requiredRole: tool.requiredRole,
      requestCount: tool.requestCount,
      errorCount: tool.errorCount,
      averageExecutionMs: tool.requestCount > 0 ? Math.round(tool.totalDurationMs / tool.requestCount) : 0,
    })),
  });
}
