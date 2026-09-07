import { NextResponse, type NextRequest } from "next/server";
import { logAudit } from "@/lib/audit";
import { assertSameOriginCsrf } from "@/lib/api-security";
import { createAccessToken } from "@/lib/auth/jwt";
import { getSessionTokenFromCookies, rotateRefreshToken, clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const ip = clientIp(request);
  if (rateLimit("auth:refresh", ip, 60, 15 * 60_000).limited) {
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const refreshToken = await getSessionTokenFromCookies();
  if (!refreshToken) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const session = await rotateRefreshToken(refreshToken);
  if (!session) {
    await clearSessionCookie();
    await logAudit({ actorType: "user", action: "auth.refresh_failed", ipAddress: ip, success: false });
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  await setSessionCookie(session.refreshToken);
  const accessToken = await createAccessToken({ sub: session.user.id, role: session.user.role, sessionId: session.sessionId });
  await logAudit({ actorType: "user", userId: session.user.id, action: "auth.refresh", ipAddress: ip });
  return NextResponse.json({ accessToken });
}
