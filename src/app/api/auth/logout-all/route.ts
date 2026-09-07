import { NextResponse, type NextRequest } from "next/server";
import { logAudit } from "@/lib/audit";
import { assertSameOriginCsrf } from "@/lib/api-security";
import { clearSessionCookie, revokeAllUserSessions } from "@/lib/auth/session";
import { isAuthContext, requireAuth } from "@/lib/auth/authorization";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!request.headers.get("authorization")) {
    const csrfDenied = assertSameOriginCsrf(request);
    if (csrfDenied) return csrfDenied;
  }
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  await revokeAllUserSessions(auth.user.id);
  if (!request.headers.get("authorization")) await clearSessionCookie();
  await logAudit({ actorType: "user", userId: auth.user.id, action: "auth.logout_all" });
  return NextResponse.json({ success: true });
}
