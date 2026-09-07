import { NextResponse, type NextRequest } from "next/server";
import { resolveGoogleProfile } from "@/lib/auth/oauth";
import { consumeOAuthState } from "@/lib/auth/oauth-state";
import { findOrCreateOAuthUser } from "@/lib/auth/oauth-account";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const loginUrl = new URL("/login", url.origin);

  if (!code || !state) {
    loginUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(loginUrl);
  }

  const stored = await consumeOAuthState("google", state);
  if (!stored?.codeVerifier) {
    loginUrl.searchParams.set("error", "oauth_state_mismatch");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const profile = await resolveGoogleProfile(code, stored.codeVerifier);
    const user = await findOrCreateOAuthUser("google", profile);
    const session = await createSession(user.id, {
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    await setSessionCookie(session.refreshToken);
    await logAudit({ actorType: "user", userId: user.id, action: "auth.oauth_login", metadata: { provider: "google" } });
    return NextResponse.redirect(new URL("/dashboard", url.origin));
  } catch (error) {
    console.error("[auth] google oauth callback failed", error);
    loginUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(loginUrl);
  }
}
