import type { AgentTask } from "@/types";
import { mockAgentTasks } from "@/lib/mock-data";
import { publishRealtimeEvent } from "@/lib/realtime";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listAgentTasks(): Promise<AgentTask[]> {
  await delay(300);
  return mockAgentTasks;
}

export async function createAgentTask(input: {
  deviceId: string;
  deviceName: string;
  instruction: string;
}): Promise<AgentTask> {
  await delay(400);
  const task: AgentTask = {
    id: `job_${Math.random().toString(36).slice(2, 10)}`,
    deviceId: input.deviceId,
    deviceName: input.deviceName,
    instruction: input.instruction,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  mockAgentTasks.unshift(task);
  publishRealtimeEvent("task.created", { taskId: task.id, deviceId: task.deviceId, status: task.status });
  return task;
}

export async function cancelAgentTask(id: string): Promise<{ success: boolean; message: string }> {
  await delay(250);
  const task = mockAgentTasks.find((item) => item.id === id);
  if (!task) return { success: false, message: "Agent task not found." };
  if (task.status === "completed" || task.status === "failed") {
    return { success: false, message: `Agent task ${id} has already finished.` };
  }
  task.status = "failed";
  task.completedAt = new Date().toISOString();
  publishRealtimeEvent("task.cancelled", { taskId: task.id, deviceId: task.deviceId, status: "cancelled" });
  return { success: true, message: `Cancelled agent task ${id}.` };
}
