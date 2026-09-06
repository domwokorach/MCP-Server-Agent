import { emptyInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

export const getCurrentUserTool: ToolDefinition<typeof emptyInputSchema.shape> = {
  name: "get_current_user",
  description: "Get the authenticated platform user.",
  inputSchema: emptyInputSchema,
  requiredRole: "user",
  handler: async (_input, { identity }) => platformService.getCurrentUser(identity),
};
