import type { TerminalBootstrap, TerminalExecuteResponse } from "../types/terminal.types";

export async function fetchTerminalBootstrap(): Promise<TerminalBootstrap> {
  const response = await fetch("/api/terminal/execute");
  if (!response.ok) throw new Error("Unable to load terminal configuration.");
  return (await response.json()) as TerminalBootstrap;
}

export async function executeTerminalCommand(input: {
  line: string;
  cwd: string;
  confirm?: boolean;
}): Promise<{ status: number; body: TerminalExecuteResponse }> {
  const response = await fetch("/api/terminal/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mcp-csrf": "1" },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => ({}))) as TerminalExecuteResponse;
  return { status: response.status, body };
}
