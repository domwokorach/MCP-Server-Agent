import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { revokeApiKey } from "@/lib/auth/api-key";
import { logAudit } from "@/lib/audit";
import { assertSameOriginCsrf } from "@/lib/api-security";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const { id } = await context.params;
  const revoked = await revokeApiKey(id, user.id);
  if (!revoked) return NextResponse.json({ message: "API key not found." }, { status: 404 });

  await logAudit({ actorType: "user", userId: user.id, action: "mcp.api_key_revoked", targetId: id });
  return new Response(null, { status: 204 });
}
