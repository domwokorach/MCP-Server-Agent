import { createTaskInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

export const createAgentTaskTool: ToolDefinition<typeof createTaskInputSchema.shape> = {
  name: "create_agent_task",
  description: "Create an AI agent task for a device.",
  inputSchema: createTaskInputSchema,
  requiredRole: "developer",
  handler: async (input) => platformService.createAgentTask(input),
};
