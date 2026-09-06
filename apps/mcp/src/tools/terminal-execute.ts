import { terminalExecuteInputSchema } from "../schemas/tool-inputs";
import type { ToolDefinition } from "../server/gateway-tool";
import { executeTerminalCommand, TerminalDeniedError } from "../terminal/executor";
import { GatewayError } from "../policies/limits";

/**
 * Optional, tightly sandboxed terminal capability. Disabled by default
 * (`MCP_TERMINAL_ENABLED=false`); an administrator must opt in. Even when
 * enabled, only allowlisted commands/paths run, with no shell interpretation,
 * a strict env allowlist, output-size caps, and a hard timeout.
 */
export const terminalExecuteTool: ToolDefinition<typeof terminalExecuteInputSchema.shape> = {
  name: "terminal_execute",
  description: "Run an allowlisted command in an allowlisted working directory (npm/node/git/npx by default).",
  inputSchema: terminalExecuteInputSchema,
  requiredRole: "admin",
  handler: async (input) => {
    try {
      return await executeTerminalCommand(input);
    } catch (error) {
      if (error instanceof TerminalDeniedError) {
        throw new GatewayError("FORBIDDEN", error.message);
      }
      throw error;
    }
  },
};
