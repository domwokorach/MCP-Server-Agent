import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createApiKey, listApiKeys } from "@/lib/auth/api-key";
import { hasRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { ROLES } from "@/lib/rbac";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const keys = await listApiKeys(user.id);
  return NextResponse.json({ keys });
}

const createKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.enum(ROLES).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const body = await request.json().catch(() => null);
  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid request." }, { status: 400 });

  // A key can never grant more privilege than its owner already holds.
  if (parsed.data.role && !hasRole(user.role, parsed.data.role)) {
    return NextResponse.json({ message: "Cannot mint a key with a role higher than your own." }, { status: 403 });
  }

  const { token, apiKey } = await createApiKey(user.id, parsed.data.name, parsed.data.role);
  await logAudit({ actorType: "user", userId: user.id, action: "mcp.api_key_created", targetId: apiKey.id });

  // The raw token is returned exactly once and is never stored server-side.
  return NextResponse.json({ token, apiKey }, { status: 201 });
}
