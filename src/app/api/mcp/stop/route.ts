import type { NextRequest } from "next/server";
import { requireManagementAccess } from "@/lib/api-security";
import { mcpRuntime } from "@/services/mcpRuntimeService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const denied = await requireManagementAccess(request, true);
  if (denied) return denied;
  return Response.json(await mcpRuntime.stop());
}
