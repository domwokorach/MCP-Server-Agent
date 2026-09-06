import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createMcpServer } from "../server/create-server";

export function serveMcpStdio() {
  return serveStdio((ctx) => createMcpServer(ctx), {
    onerror: (error) => console.error(`[mcp] ${error.message}`),
  });
}
