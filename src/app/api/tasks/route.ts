import { z } from "zod";
import { assertSameOriginCsrf } from "@/lib/api-security";
import { getCurrentUser } from "@/lib/auth/session";
import { createAgentTask, listAgentTasks } from "@/services/agentTaskService";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getCurrentUser())) return Response.json({ message: "Authentication required." }, { status: 401 });
  return Response.json(await listAgentTasks());
}

const createTaskSchema = z.object({
  deviceId: z.string().trim().min(1).max(120),
  deviceName: z.string().trim().min(1).max(120),
  instruction: z.string().trim().min(4).max(4_000),
});

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ message: "Authentication required." }, { status: 401 });
  const csrfDenied = assertSameOriginCsrf(request);
  if (csrfDenied) return csrfDenied;
  const input = createTaskSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ message: "Invalid task request." }, { status: 400 });
  return Response.json(await createAgentTask(input.data), { status: 201 });
}
