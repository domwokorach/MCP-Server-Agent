import { taskIdInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

export const cancelAgentTaskTool: ToolDefinition<typeof taskIdInputSchema.shape> = {
  name: "cancel_agent_task",
  description: "Cancel a pending or running agent task.",
  inputSchema: taskIdInputSchema,
  requiredRole: "developer",
  handler: async ({ taskId }) => platformService.cancelAgentTask(taskId),
};
