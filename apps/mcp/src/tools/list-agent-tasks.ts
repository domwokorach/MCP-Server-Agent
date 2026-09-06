import { emptyInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

export const listAgentTasksTool: ToolDefinition<typeof emptyInputSchema.shape> = {
  name: "list_agent_tasks",
  description: "List current and historical agent tasks.",
  inputSchema: emptyInputSchema,
  requiredRole: "user",
  handler: async () => platformService.listAgentTasks(),
};
