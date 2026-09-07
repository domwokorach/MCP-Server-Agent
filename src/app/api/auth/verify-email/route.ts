import { NextResponse, type NextRequest } from "next/server";
import { verifyEmailSchema } from "@/features/auth/schemas";
import { verifyPin } from "@/lib/auth/verification";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { createAccessToken } from "@/lib/auth/jwt";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";

const REASON_MESSAGES: Record<string, string> = {
  not_found: "This code is invalid or has already been used.",
  expired: "This code has expired. Request a new one.",
  too_many_attempts: "Too many incorrect attempts. Request a new code.",
  incorrect: "That code isn't correct.",
};

export async function POST(request: NextRequest) {
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const ip = clientIp(request);
  if (rateLimit("auth:verify-email", ip, 20, 15 * 60_000).limited) {
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter the 6-digit code." }, { status: 400 });
  }
  const normalizedEmail = parsed.data.email.toLowerCase();

  // Per-account limiting guards against a single attacker brute-forcing one inbox's PIN.
  if (rateLimit("auth:verify-email:account", normalizedEmail, 10, 15 * 60_000).limited) {
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return NextResponse.json({ message: REASON_MESSAGES.not_found }, { status: 400 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ message: "This account is already verified." }, { status: 400 });
  }

  const result = await verifyPin(user.id, parsed.data.pin);
  if (!result.ok) {
    await logAudit({ actorType: "user", userId: user.id, action: "auth.verify_email", ipAddress: ip, success: false });
    return NextResponse.json({ message: REASON_MESSAGES[result.reason] }, { status: 400 });
  }

  const session = await createSession(user.id, { ipAddress: ip, userAgent: request.headers.get("user-agent") });
  await setSessionCookie(session.refreshToken);
  const accessToken = await createAccessToken({ sub: user.id, role: user.role, sessionId: session.sessionId });
  await logAudit({ actorType: "user", userId: user.id, action: "auth.verify_email", ipAddress: ip });

  return NextResponse.json({
    accessToken,
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  });
}
