import type { McpServerStatus } from "@/types";
import { mockMcpServers } from "@/lib/mock-data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listMcpServers(): Promise<McpServerStatus[]> {
  await delay(250);
  return mockMcpServers;
}
