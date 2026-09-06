import type * as z from "zod/v4";
import type { Role } from "@prisma/client";
import type { McpServer } from "@modelcontextprotocol/server";
import type { Identity } from "../policies/identity";
import { runToolPipeline } from "../pipelines/run-tool";
import { textResult } from "../tools/result";

export interface ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: z.ZodObject<Shape>;
  /** Minimum role required to invoke this tool; enforced by the gateway before the handler runs. */
  requiredRole: Role;
  // Method syntax (rather than an arrow-function-typed property) gives this bivariant
  // parameter checking, which is what lets a heterogeneous array of
  // `ToolDefinition<SpecificShape>` be registered through one non-generic loop below.
  handler(input: z.infer<z.ZodObject<Shape>>, ctx: { identity: Identity }): Promise<unknown>;
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
    async (input) => {
      const outcome = await runToolPipeline({
        identity,
        name: def.name,
        description: def.description,
        requiredRole: def.requiredRole,
        input,
        execute: () => def.handler(input, { identity }),
      });
      return textResult(outcome.ok ? outcome.data : outcome.error, !outcome.ok);
    }
  );
}
