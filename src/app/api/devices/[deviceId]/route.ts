import { z } from "zod";

import { assertSameOriginCsrf } from "@/lib/api-security";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { performDeviceAction } from "@/services/deviceService";

const requestSchema = z.object({
  action: z.enum(["connect", "disconnect", "reconnect", "rename", "remove"]),
  name: z.string().max(80).optional(),
});

export async function POST(request: Request, { params }: RouteContext<"/api/devices/[deviceId]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Authentication required." }, { status: 401 });

  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ message: "Invalid device action." }, { status: 400 });

  const { deviceId } = await params;
  const result = await performDeviceAction(deviceId, body.data.action, body.data.name);
  await logAudit({
    actorType: "user",
    userId: user.id,
    action: `device.${body.data.action}`,
    targetType: "device",
    targetId: deviceId,
    metadata: { name: body.data.action === "rename" ? body.data.name : undefined },
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    success: result.success,
  });
  return Response.json(result, { status: result.success ? 200 : 400 });
}
