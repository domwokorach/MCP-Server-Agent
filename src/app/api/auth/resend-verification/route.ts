import { NextResponse, type NextRequest } from "next/server";
import { resendVerificationSchema } from "@/features/auth/schemas";
import { createVerificationPin, PIN_TTL_MS } from "@/lib/auth/verification";
import { sendVerificationPin } from "@/lib/email/resend";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";

// Constant response regardless of account state — avoids confirming which emails are registered.
const GENERIC_RESPONSE = { message: "If that account needs verification, a new code has been sent." };

export async function POST(request: NextRequest) {
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const ip = clientIp(request);
  if (rateLimit("auth:resend-verification", ip, 5, 15 * 60_000).limited) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const body = await request.json().catch(() => null);
  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(GENERIC_RESPONSE);
  }
  const normalizedEmail = parsed.data.email.toLowerCase();

  if (rateLimit("auth:resend-verification:account", normalizedEmail, 3, 15 * 60_000).limited) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user && !user.emailVerifiedAt) {
    const pin = await createVerificationPin(user.id);
    try {
      await sendVerificationPin({
        to: user.email,
        fullName: user.fullName,
        pin,
        expiresInMinutes: PIN_TTL_MS / 60_000,
      });
      await logAudit({ actorType: "user", userId: user.id, action: "auth.resend_verification", ipAddress: ip });
    } catch (error) {
      console.error("[auth] failed to resend verification email", error);
    }
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
