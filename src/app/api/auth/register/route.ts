import { NextResponse, type NextRequest } from "next/server";
import { registerSchema } from "@/features/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
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

  const token = await createSession(user.id, { ipAddress: ip, userAgent: request.headers.get("user-agent") });
  await setSessionCookie(token);
  await logAudit({ actorType: "user", userId: user.id, action: "auth.register", ipAddress: ip });

  return NextResponse.json(
    { user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } },
    { status: 201 }
  );
}
