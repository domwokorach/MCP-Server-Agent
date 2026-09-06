import type { NextRequest } from "next/server";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { mcpHttpHandler } from "../../apps/mcp/src/transports/http";
import { logAudit } from "@/lib/audit";
import { authenticateMcpRequest } from "@/lib/mcp-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publishRealtimeEvent } from "@/lib/realtime";
import { mcpRuntime } from "@/services/mcpRuntimeService";

const MAX_MCP_REQUEST_BYTES = 128 * 1024;

function rejectUnexpectedOrigin(request: NextRequest): Response | undefined {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ message: "Cross-origin MCP requests are not allowed." }, { status: 403 });
  }
}

export async function handleMcpHttpRequest(request: NextRequest): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ message: "Only POST is supported by this Streamable HTTP endpoint." }, { status: 405 });
  }
  const unexpectedOrigin = rejectUnexpectedOrigin(request);
  if (unexpectedOrigin) return unexpectedOrigin;

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > MAX_MCP_REQUEST_BYTES) {
    return Response.json({ message: "MCP request exceeds the 128 KB limit." }, { status: 413 });
  }

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

  const authInfo: AuthInfo = {
    token: identity.type,
    clientId: identity.userId,
    scopes: [identity.role],
    extra: { type: identity.type, userId: identity.userId, role: identity.role, label: identity.label },
  };
  mcpRuntime.recordRequest();
  publishRealtimeEvent("mcp.request.started", { actor: identity.label });

  try {
    const response = await mcpHttpHandler.fetch(request, { authInfo });
    publishRealtimeEvent(response.ok ? "mcp.request.completed" : "mcp.request.failed", {
      actor: identity.label,
      status: response.status,
    });
    return response;
  } catch (error) {
    publishRealtimeEvent("mcp.request.failed", {
      actor: identity.label,
      error: error instanceof Error ? error.message : "MCP request failed.",
    });
    throw error;
  }
}
