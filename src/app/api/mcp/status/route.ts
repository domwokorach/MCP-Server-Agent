import type { NextRequest } from "next/server";
import { requireManagementAccess } from "@/lib/api-security";
import { mcpRuntime } from "@/services/mcpRuntimeService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireManagementAccess(request);
  if (denied) return denied;
  // Reaching this route already proves the caller is an administrator or has
  // the configured management credential, so the dashboard may enable its
  // controls without ever exposing that credential to the browser.
  return Response.json({ ...mcpRuntime.getStatus(), controlsEnabled: true });
}
