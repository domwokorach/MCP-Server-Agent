import { createMcpHandler } from "@modelcontextprotocol/server";
import { createMcpServer } from "../server/create-server";

export const mcpHttpHandler = createMcpHandler((ctx) => createMcpServer(ctx), {
  legacy: "reject",
  responseMode: "auto",
  keepAliveMs: 15_000,
});
