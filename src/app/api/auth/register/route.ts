import { NextResponse, type NextRequest } from "next/server";
import { registerSchema } from "@/features/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createVerificationPin, PIN_TTL_MS } from "@/lib/auth/verification";
import { sendVerificationPin } from "@/lib/email/resend";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const ip = clientIp(request);
  if (rateLimit("auth:register", ip, 10, 60 * 60_000).limited) {
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid registration details." }, { status: 400 });
  }
  const { fullName, email, address, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    await logAudit({ actorType: "user", action: "auth.register", ipAddress: ip, success: false });
    return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const isBootstrapAdmin =
    !!process.env.ADMIN_BOOTSTRAP_EMAIL &&
    normalizedEmail === process.env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

  const user = await prisma.user.create({
    data: {
      fullName,
      email: normalizedEmail,
      address,
      passwordHash,
      role: isBootstrapAdmin ? "admin" : "user",
    },
  });

  const pin = await createVerificationPin(user.id);
  try {
    await sendVerificationPin({
      to: user.email,
      fullName: user.fullName,
      pin,
      expiresInMinutes: PIN_TTL_MS / 60_000,
    });
  } catch (error) {
    console.error("[auth] failed to send verification email", error);
    return NextResponse.json(
      { message: "Account created, but we couldn't send the verification email. Try resending it." },
      { status: 502 }
    );
  }

  await logAudit({ actorType: "user", userId: user.id, action: "auth.register", ipAddress: ip });

  // No session is issued until the account is verified.
  return NextResponse.json({ email: user.email }, { status: 201 });
}
