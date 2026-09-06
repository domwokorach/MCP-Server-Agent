import { getCurrentUser } from "@/lib/auth/session";
import { listAgentTasks } from "@/services/agentTaskService";
import { listDevices } from "@/services/deviceService";
import { listActivity } from "@/services/activityService";
import { mcpRuntime } from "@/services/mcpRuntimeService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getCurrentUser())) return Response.json({ message: "Authentication required." }, { status: 401 });
  const [devices, tasks, activity] = await Promise.all([listDevices(), listAgentTasks(), listActivity()]);
  return Response.json({ devices, tasks, activity, mcp: mcpRuntime.getStatus() });
}
