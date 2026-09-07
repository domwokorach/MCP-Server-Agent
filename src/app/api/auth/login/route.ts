import { NextResponse, type NextRequest } from "next/server";
import { loginSchema } from "@/features/auth/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { createAccessToken } from "@/lib/auth/jwt";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(request: NextRequest) {
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const ip = clientIp(request);
  if (rateLimit("auth:login", ip, 20, 15 * 60_000).limited) {
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: GENERIC_ERROR }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Per-account limiting guards against distributed credential stuffing against one user.
  if (rateLimit("auth:login:account", normalizedEmail, 10, 15 * 60_000).limited) {
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const valid = user?.passwordHash ? await verifyPassword(user.passwordHash, password) : false;

  if (!user || !valid) {
    await logAudit({
      actorType: "user",
      userId: user?.id ?? null,
      action: "auth.login",
      ipAddress: ip,
      success: false,
    });
    return NextResponse.json({ message: GENERIC_ERROR }, { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    await logAudit({ actorType: "user", userId: user.id, action: "auth.login", ipAddress: ip, success: false });
    return NextResponse.json(
      { message: "Verify your email before signing in.", code: "EMAIL_NOT_VERIFIED", email: user.email },
      { status: 403 }
    );
  }

  const session = await createSession(user.id, { ipAddress: ip, userAgent: request.headers.get("user-agent") });
  await setSessionCookie(session.refreshToken);
  const accessToken = await createAccessToken({ sub: user.id, role: user.role, sessionId: session.sessionId });
  await logAudit({ actorType: "user", userId: user.id, action: "auth.login", ipAddress: ip });

  return NextResponse.json({ accessToken, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
}
