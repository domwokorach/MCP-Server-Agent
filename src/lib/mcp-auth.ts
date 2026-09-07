import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { getCurrentUser, validateAccessTokenSession } from "@/lib/auth/session";
import { resolveApiKeyToken } from "@/lib/auth/api-key";
import { verifyAccessToken } from "@/lib/auth/jwt";

export interface McpIdentity {
  type: "user" | "agent";
  userId: string;
  role: Role;
  label: string;
}

/**
 * Authenticates an incoming `/api/mcp` request. Accepts either the caller's
 * session cookie (same-origin dashboard usage) or an `Authorization: Bearer`
 * API key (remote agents/CLIs). Returns null when neither is valid.
 */
export async function authenticateMcpRequest(request: NextRequest): Promise<McpIdentity | null> {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearerToken) {
    const claims = await verifyAccessToken(bearerToken);
    if (claims) {
      const user = await validateAccessTokenSession(claims.sub, claims.sessionId);
      if (!user || user.role !== claims.role) return null;
      return { type: "agent", userId: user.id, role: user.role, label: user.email };
    }
    const identity = await resolveApiKeyToken(bearerToken);
    if (!identity) return null;
    return { type: "agent", userId: identity.userId, role: identity.role, label: identity.label };
  }

  const user = await getCurrentUser();
  if (!user) return null;
  return { type: "user", userId: user.id, role: user.role, label: user.email };
}
