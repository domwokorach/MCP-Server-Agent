import { listDevices } from "@/services/deviceService";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getCurrentUser())) {
    return Response.json({ message: "Authentication required." }, { status: 401 });
  }
  return Response.json(await listDevices());
}
