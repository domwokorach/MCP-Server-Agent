import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { hasRole } from "@/lib/rbac";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getCurrentSession, validateAccessTokenSession, type SessionUser } from "@/lib/auth/session";

export interface AuthContext {
  user: SessionUser;
  sessionId: string;
}

export type Permission = "mcp:status" | "mcp:restart" | "terminal:execute";

const PERMISSIONS: Record<Permission, Role> = {
  "mcp:status": "developer",
  "mcp:restart": "admin",
  "terminal:execute": "developer",
};

export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const bearerToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearerToken) {
    const claims = await verifyAccessToken(bearerToken);
    if (!claims) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    const user = await validateAccessTokenSession(claims.sub, claims.sessionId);
    if (!user || user.role !== claims.role) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    return { user, sessionId: claims.sessionId };
  }

  const session = await getCurrentSession();
  return session ?? NextResponse.json({ message: "Authentication required." }, { status: 401 });
}

export function isAuthContext(value: AuthContext | NextResponse): value is AuthContext {
  return "user" in value;
}

export async function requireRole(request: NextRequest, role: Role): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  return hasRole(auth.user.role, role) ? auth : NextResponse.json({ message: "Forbidden." }, { status: 403 });
}

export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<AuthContext | NextResponse> {
  return requireRole(request, PERMISSIONS[permission]);
}
