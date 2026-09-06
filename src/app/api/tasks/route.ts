import { listAgentTasks } from "@/services/agentTaskService";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listAgentTasks());
}
