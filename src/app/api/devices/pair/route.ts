import { z } from "zod";

import { assertSameOriginCsrf } from "@/lib/api-security";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { approvePairing, createPairingCode } from "@/services/deviceService";

const requestSchema = z.object({
  action: z.enum(["generate", "approve"]),
  type: z.enum(["mobile", "desktop", "laptop"]),
  code: z.string().min(1).max(32).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });

  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ message: "Invalid pairing request." }, { status: 400 });

  if (body.data.action === "generate") {
    const pairing = await createPairingCode(user.id, body.data.type);
    await logAudit({ actorType: "user", userId: user.id, action: "device.pair_code_generated", targetType: "device" });
    return Response.json(pairing);
  }

  if (!body.data.code) return Response.json({ message: "Pairing code is required." }, { status: 400 });
  const result = await approvePairing(user.id, body.data.code);
  await logAudit({
    actorType: "user",
    userId: user.id,
    action: "device.pair_approved",
    targetType: "device",
    targetId: result.device?.id,
    success: result.success,
  });
  return Response.json(result, { status: result.success ? 200 : 400 });
}
