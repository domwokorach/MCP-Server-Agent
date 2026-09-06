import { emptyInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

export const getSystemStatusTool: ToolDefinition<typeof emptyInputSchema.shape> = {
  name: "get_system_status",
  description: "Get MCP server, transport, and tool-registry health status.",
  inputSchema: emptyInputSchema,
  requiredRole: "user",
  handler: async () => platformService.getSystemStatus(),
};
