import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, getCurrentSession, revokeSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const session = await getCurrentSession();
  if (session) {
    await revokeSession(session.sessionId);
    await logAudit({ actorType: "user", userId: session.user.id, action: "auth.logout" });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
