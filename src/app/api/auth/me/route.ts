import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAuthContext, requireAuth } from "@/lib/auth/authorization";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  return NextResponse.json({ user: auth.user });
}

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  address: z.string().trim().min(4).max(300).optional(),
});

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  if (!request.headers.get("authorization")) {
    const csrfDenied = assertSameOriginCsrf(request);
    if (csrfDenied) return csrfDenied;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid profile details." }, { status: 400 });

  const updated = await prisma.user.update({ where: { id: auth.user.id }, data: parsed.data });
  await logAudit({ actorType: "user", userId: auth.user.id, action: "auth.profile_updated" });

  return NextResponse.json({
    user: { id: updated.id, fullName: updated.fullName, email: updated.email, address: updated.address, role: updated.role },
  });
}
