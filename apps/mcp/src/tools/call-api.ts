import { callApiInputSchema } from "../schemas/tool-inputs";
import { platformService } from "../services/platform";
import type { ToolDefinition } from "../server/gateway-tool";

/**
 * A generic AI-callable API dispatcher. Deliberately restricted to a fixed
 * allowlist of logical operations that delegate to existing service-layer
 * functions (`DeviceService`, `AgentTaskService`, ...) — this tool never
 * fetches an arbitrary caller-supplied URL, which would open an SSRF hole.
 */
export const callApiTool: ToolDefinition<typeof callApiInputSchema.shape> = {
  name: "call_api",
  description: "Call a whitelisted platform API operation (list_devices, list_agent_tasks, list_activity, get_system_status).",
  inputSchema: callApiInputSchema,
  requiredRole: "developer",
  handler: async ({ operation }) => {
    switch (operation) {
      case "list_devices":
        return platformService.listDevices();
      case "list_agent_tasks":
        return platformService.listAgentTasks();
      case "list_activity":
        return platformService.listActivity();
      case "get_system_status":
        return platformService.getSystemStatus();
      default: {
        const _exhaustive: never = operation;
        throw new Error(`Unsupported operation: ${_exhaustive}`);
      }
    }
  },
};
