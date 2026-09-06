import type { NextRequest } from "next/server";
import { requireManagementAccess } from "@/lib/api-security";
import { mcpRuntime } from "@/services/mcpRuntimeService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireManagementAccess(request);
  if (denied) return denied;
  return Response.json(mcpRuntime.getLogs());
}

export async function POST(request: NextRequest) {
  const denied = await requireManagementAccess(request, true);
  if (denied) return denied;
  mcpRuntime.clearLogs();
  return new Response(null, { status: 204 });
}
