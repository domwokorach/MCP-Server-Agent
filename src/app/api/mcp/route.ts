import type { NextRequest } from "next/server";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { mcpHttpHandler } from "../../../../apps/mcp/src/transports/http";
import { mcpRuntime } from "@/services/mcpRuntimeService";
import { authenticateMcpRequest } from "@/lib/mcp-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This is the platform's single "Authenticated MCP Endpoint" — every remote
// HTTP tool call must pass through session/API-key authentication and rate
// limiting here before it ever reaches the MCP tool router.
async function handle(request: NextRequest) {
  const ip = clientIp(request);
  if (rateLimit("mcp:http:ip", ip, 120, 60_000).limited) {
    return Response.json({ message: "Too many requests." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const identity = await authenticateMcpRequest(request);
  if (!identity) {
    await logAudit({ actorType: "system", action: "mcp.http_unauthenticated", ipAddress: ip, success: false });
    return Response.json({ message: "Authentication required." }, { status: 401 });
  }

  if (rateLimit("mcp:http:identity", identity.userId, 120, 60_000).limited) {
    return Response.json({ message: "Too many requests." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  mcpRuntime.recordRequest();
  const authInfo: AuthInfo = {
    token: identity.type,
    clientId: identity.userId,
    scopes: [identity.role],
    extra: { type: identity.type, userId: identity.userId, role: identity.role, label: identity.label },
  };
  return mcpHttpHandler.fetch(request, { authInfo });
}

export { handle as GET, handle as POST };

