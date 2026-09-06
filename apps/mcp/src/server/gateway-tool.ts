import type * as z from "zod/v4";
import type { Role } from "@prisma/client";
import type { McpServer } from "@modelcontextprotocol/server";
import type { Identity } from "../policies/identity";
import { runToolPipeline } from "../pipelines/run-tool";
import { textResult } from "../tools/result";
import { publishRealtimeEvent } from "@/lib/realtime";

export interface ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: z.ZodObject<Shape>;
  /** Minimum role required to invoke this tool; enforced by the gateway before the handler runs. */
  requiredRole: Role;
  // Method syntax (rather than an arrow-function-typed property) gives this bivariant
  // parameter checking, which is what lets a heterogeneous array of
  // `ToolDefinition<SpecificShape>` be registered through one non-generic loop below.
  handler(input: z.infer<z.ZodObject<Shape>>, ctx: { identity: Identity; signal?: AbortSignal }): Promise<unknown>;
}

/**
 * Registers a tool wrapped by the MCP Security Gateway pipeline. Tool
 * handlers stay focused on calling service-layer logic — auth, rate
 * limiting, allowlisting, limits, redaction, and audit logging are all
 * applied uniformly here.
 *
 * `def` is intentionally typed with the widened `z.ZodRawShape` (rather than
 * a generic re-inferred per call) so a heterogeneous list of tool
 * definitions — each with its own input shape — can be registered through a
 * single loop without variance errors; each tool file still gets full input
 * inference where it is authored.
 */
export function registerGatewayTool(server: McpServer, def: ToolDefinition<z.ZodRawShape>, identity: Identity): void {
  server.registerTool(
    def.name,
    { description: def.description, inputSchema: def.inputSchema },
    async (input, ctx) => {
      const startedAt = new Date().toISOString();
      await ctx.mcpReq.log("info", {
        event: "tool_started",
        tool: def.name,
        timestamp: startedAt,
        message: `Calling ${def.name}...`,
      }, "my-agent-platform");
      for (const [progress, message] of [
        [25, "Validating request"],
        [50, "Authorizing tool call"],
        [75, "Running MCP tool"],
      ] as const) {
        await ctx.mcpReq.log("info", {
          event: "progress",
          tool: def.name,
          progress,
          timestamp: new Date().toISOString(),
          message,
        }, "my-agent-platform");
      }
      publishRealtimeEvent("terminal.output", { source: "mcp", tool: def.name, message: `Calling ${def.name}...` });

      const outcome = await runToolPipeline({
        identity,
        name: def.name,
        description: def.description,
        requiredRole: def.requiredRole,
        input,
        signal: ctx.mcpReq.signal,
        execute: () => def.handler(input, { identity, signal: ctx.mcpReq.signal }),
      });
      const event = outcome.ok ? "tool_completed" : "tool_failed";
      const level = outcome.ok ? "info" : "error";
      await ctx.mcpReq.log(level, {
        event,
        tool: def.name,
        progress: 100,
        timestamp: new Date().toISOString(),
        message: outcome.ok ? `${def.name} completed.` : outcome.error?.message,
      }, "my-agent-platform");
      publishRealtimeEvent(outcome.ok ? "terminal.output" : "terminal.error", {
        source: "mcp",
        tool: def.name,
        message: outcome.ok ? `${def.name} completed.` : outcome.error?.message ?? `${def.name} failed.`,
      });
      return textResult(outcome.ok ? outcome.data : outcome.error, !outcome.ok);
    }
  );
}
