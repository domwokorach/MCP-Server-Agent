import { McpServer, type McpRequestContext } from "@modelcontextprotocol/server";
import { resolveIdentity } from "../policies/identity";
import { registerGatewayTool } from "./gateway-tool";
import { isTerminalEnabled } from "../terminal/config";
import { cancelAgentTaskTool } from "../tools/cancel-agent-task";
import { callApiTool } from "../tools/call-api";
import { createAgentTaskTool } from "../tools/create-agent-task";
import { getCurrentUserTool } from "../tools/get-current-user";
import { getDashboardTool } from "../tools/get-dashboard";
import { getDeviceStatusTool } from "../tools/get-device-status";
import { getSystemStatusTool } from "../tools/get-system-status";
import { listAgentTasksTool } from "../tools/list-agent-tasks";
import { listDevicesTool } from "../tools/list-devices";
import { terminalExecuteTool } from "../tools/terminal-execute";

const CORE_TOOLS = [
  getCurrentUserTool,
  getDashboardTool,
  listDevicesTool,
  getDeviceStatusTool,
  listAgentTasksTool,
  createAgentTaskTool,
  cancelAgentTaskTool,
  callApiTool,
  getSystemStatusTool,
];

/** Every known tool definition, including the terminal tool regardless of whether it is currently enabled — used to seed the tool registry. */
export const ALL_TOOLS = [...CORE_TOOLS, terminalExecuteTool];

export const MCP_TOOL_COUNT = CORE_TOOLS.length + (isTerminalEnabled() ? 1 : 0);

/**
 * Builds one MCP server instance per connection/request. Every tool is
 * registered through the gateway wrapper, which resolves the caller's
 * identity once per instance and applies the full security pipeline
 * (auth, rate limits, RBAC, allowlist, redaction, audit) on every call.
 */
export function createMcpServer(ctx: McpRequestContext = { era: "modern" }) {
  const server = new McpServer({ name: "my-agent-platform", version: "1.0.0" });
  const identity = resolveIdentity(ctx);

  for (const tool of CORE_TOOLS) {
    registerGatewayTool(server, tool, identity);
  }

  // Optional, disabled-by-default controlled terminal capability.
  if (isTerminalEnabled()) {
    registerGatewayTool(server, terminalExecuteTool, identity);
  }

  return server;
}
