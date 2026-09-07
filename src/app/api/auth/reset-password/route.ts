import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { resetPasswordSchema } from "@/features/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { sendPasswordChangedEmail } from "@/lib/email/resend";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";

const GENERIC_ERROR = "This reset link is invalid or has expired.";

export async function POST(request: NextRequest) {
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const ip = clientIp(request);
  if (rateLimit("auth:reset-password", ip, 10, 15 * 60_000).limited) {
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: GENERIC_ERROR }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ message: GENERIC_ERROR }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const changedAt = new Date();
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
    // Revoke this token and any other still-active ones for the account.
    await tx.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, usedAt: null },
      data: { usedAt: changedAt },
    });
    return updated;
  });
  // Invalidate existing sessions so a leaked/old session can't survive a password reset.
  await revokeAllUserSessions(resetToken.userId);
  await logAudit({ actorType: "user", userId: resetToken.userId, action: "auth.password_reset_completed", ipAddress: ip });
  await sendPasswordChangedEmail({ to: user.email, fullName: user.fullName, changedAt });

  return NextResponse.json({ success: true });
}
