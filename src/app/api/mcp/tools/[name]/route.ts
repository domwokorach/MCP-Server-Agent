import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";

const patchSchema = z.object({ enabled: z.boolean() });

export async function PATCH(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "admin")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid request." }, { status: 400 });

  const { name } = await context.params;
  const tool = await prisma.mcpToolConfig
    .update({ where: { name }, data: { enabled: parsed.data.enabled } })
    .catch(() => null);
  if (!tool) return NextResponse.json({ message: "Tool not found." }, { status: 404 });

  await logAudit({
    actorType: "user",
    userId: user.id,
    action: parsed.data.enabled ? "mcp.tool_enabled" : "mcp.tool_disabled",
    targetType: "mcp_tool",
    targetId: name,
  });

  return NextResponse.json({ tool });
}
