import * as z from "zod/v4";

export const emptyInputSchema = z.object({}).strict();
export const deviceIdInputSchema = z.object({ deviceId: z.string().min(1) }).strict();
export const listDevicesInputSchema = z.object({ type: z.enum(["mobile", "desktop", "laptop"]).optional() }).strict();
export const createTaskInputSchema = z.object({
  deviceId: z.string().min(1),
  instruction: z.string().trim().min(4).max(2_000),
}).strict();
export const taskIdInputSchema = z.object({ taskId: z.string().min(1) }).strict();

// A fixed allowlist of logical operations, dispatched to existing service-layer
// functions — never an arbitrary outbound URL — to keep `call_api` free of SSRF risk.
export const callApiInputSchema = z
  .object({
    operation: z.enum(["list_devices", "list_agent_tasks", "list_activity", "get_system_status"]),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const terminalExecuteInputSchema = z
  .object({
    command: z.string().trim().min(1).max(100),
    args: z.array(z.string().max(500)).max(20).default([]),
    cwd: z.string().trim().min(1).max(300),
  })
  .strict();
