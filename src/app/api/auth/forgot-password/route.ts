import { randomBytes, createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/features/auth/schemas";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { assertSameOriginCsrf } from "@/lib/api-security";

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

export const runtime = "nodejs";

// Always the same response, whether or not the account exists — prevents user enumeration.
const GENERIC_RESPONSE = { message: "If an account exists for that email, a reset link has been sent." };
const RESET_TOKEN_TTL_MS = 30 * 60_000;

export async function POST(request: NextRequest) {
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const ip = clientIp(request);
  if (rateLimit("auth:forgot-password", ip, 5, 15 * 60_000).limited) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(GENERIC_RESPONSE);
  }
  const normalizedEmail = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = new Date();
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      }),
    ]);
    await logAudit({ actorType: "user", userId: user.id, action: "auth.password_reset_requested", ipAddress: ip });

    const resetUrl = new URL("/reset-password", appUrl());
    resetUrl.searchParams.set("token", token);
    try {
      await sendPasswordResetEmail({
        to: user.email,
        fullName: user.fullName,
        resetUrl: resetUrl.toString(),
        expiresInMinutes: RESET_TOKEN_TTL_MS / 60_000,
      });
    } catch (error) {
      // The token is already persisted; surfacing a delivery failure here
      // would leak account existence, so log server-side only.
      console.error("[auth] failed to send password reset email", error);
    }
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
