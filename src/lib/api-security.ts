import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { isAuthContext, requireRole } from "@/lib/auth/authorization";

const requests = new Map<string, { count: number; resetAt: number }>();

function rateLimit(request: Request, limit = 30) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    return Response.json({ message: "Too many requests." }, { status: 429, headers: { "Retry-After": "60" } });
  }
}

function tokensMatch(provided: string, expected: string) {
  const actual = Buffer.from(provided);
  const target = Buffer.from(expected);
  return actual.length === target.length && timingSafeEqual(actual, target);
}

/** Requires the non-forgeable header used by same-origin JSON mutations. */
export function assertSameOriginCsrf(request: Request): Response | undefined {
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (request.headers.get("x-mcp-csrf") !== "1" || (origin && origin !== expectedOrigin)) {
    return Response.json({ message: "CSRF validation failed." }, { status: 403 });
  }
}

/**
 * Authorizes management requests from a dashboard administrator or an
 * explicitly provisioned management bearer token. Browser code never needs
 * access to the bearer token.
 */
export async function requireManagementAccess(request: NextRequest, requireCsrf = false): Promise<Response | undefined> {
  const limited = rateLimit(request);
  if (limited) return limited;

  const auth = await requireRole(request, "admin");
  const isAdmin = isAuthContext(auth);
  const configuredToken = process.env.MCP_MANAGEMENT_TOKEN;
  const suppliedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const hasManagementToken = Boolean(configuredToken && suppliedToken && tokensMatch(suppliedToken, configuredToken));

  if (!isAdmin && !hasManagementToken) {
    if (configuredToken) return Response.json({ message: "Authentication required." }, { status: 401 });
    if (process.env.NODE_ENV === "production") {
      return Response.json({ message: "MCP_MANAGEMENT_TOKEN must be configured." }, { status: 503 });
    }

    const host = request.headers.get("host")?.split(":")[0];
    if (host !== "localhost" && host !== "127.0.0.1") {
      return Response.json({ message: "Local management is only available from localhost." }, { status: 403 });
    }
  }

  if (requireCsrf) {
    const csrfDenied = assertSameOriginCsrf(request);
    if (csrfDenied) return csrfDenied;
  }
}
