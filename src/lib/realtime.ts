import { EventEmitter } from "node:events";
import { z } from "zod";
import { redact } from "@/lib/audit";

export const realtimeEventTypeSchema = z.enum([
  "mcp.status",
  "mcp.request.started",
  "mcp.request.completed",
  "mcp.request.failed",
  "agent.connected",
  "agent.disconnected",
  "device.connected",
  "device.disconnected",
  "device.updated",
  "task.created",
  "task.started",
  "task.progress",
  "task.completed",
  "task.failed",
  "task.cancelled",
  "terminal.output",
  "terminal.error",
  "system.health",
  "security.audit",
]);

export type RealtimeEventType = z.infer<typeof realtimeEventTypeSchema>;

export interface RealtimeEvent<T = Record<string, unknown>> {
  id: string;
  type: RealtimeEventType;
  timestamp: string;
  data: T;
}

type RealtimeStore = {
  events: EventEmitter;
};

declare global {
  var __realtimeStore: RealtimeStore | undefined;
}

const store = globalThis.__realtimeStore ?? { events: new EventEmitter() };
globalThis.__realtimeStore = store;
store.events.setMaxListeners(0);

export function publishRealtimeEvent<T extends object>(
  type: RealtimeEventType,
  data: T
): RealtimeEvent<T> {
  const event = {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    data: redact(data) as T,
  };
  store.events.emit("event", event);
  return event;
}

export function subscribeRealtimeEvents(listener: (event: RealtimeEvent) => void): () => void {
  store.events.on("event", listener);
  return () => store.events.off("event", listener);
}
