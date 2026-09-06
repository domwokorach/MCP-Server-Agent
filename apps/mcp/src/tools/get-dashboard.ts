import { emptyInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

export const getDashboardTool: ToolDefinition<typeof emptyInputSchema.shape> = {
  name: "get_dashboard",
  description: "Get a summary dashboard of devices, agent tasks, and recent activity.",
  inputSchema: emptyInputSchema,
  requiredRole: "user",
  handler: async (_input, { identity }) => platformService.getDashboard(identity),
};
