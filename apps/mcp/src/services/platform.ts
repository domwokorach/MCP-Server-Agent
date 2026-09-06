import { prisma } from "@/lib/prisma";
import {
  getDevice,
  listDevices,
} from "@/services/deviceService";
import {
  cancelAgentTask,
  createAgentTask,
  listAgentTasks,
} from "@/services/agentTaskService";
import { listActivity } from "@/services/activityService";
import { mcpRuntime } from "@/services/mcpRuntimeService";
import type { Identity } from "../policies/identity";

async function resolveSafeUser(identity: Identity) {
  if (!identity.userId) {
    return { id: identity.label, fullName: identity.label, email: null, role: identity.role, type: identity.type };
  }
  const user = await prisma.user.findUnique({ where: { id: identity.userId } });
  if (!user) return null;
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role, type: identity.type };
}

export const platformService = {
  getCurrentUser: (identity: Identity) => resolveSafeUser(identity),

  async getDashboard(identity: Identity) {
    const [devices, tasks, activity] = await Promise.all([listDevices(), listAgentTasks(), listActivity()]);
    return {
      caller: { role: identity.role, type: identity.type },
      devices: { total: devices.length, online: devices.filter((d) => d.status === "online").length },
      tasks: { total: tasks.length, running: tasks.filter((t) => t.status === "running").length },
      recentActivity: activity.slice(0, 5),
    };
  },

  listDevices,
  getDevice,
  listAgentTasks,
  listActivity,

  async createAgentTask(input: { deviceId: string; instruction: string }) {
    const device = await getDevice(input.deviceId);
    if (!device) return { success: false as const, message: "Device not found." };
    const task = await createAgentTask({ ...input, deviceName: device.name });
    return { success: true as const, task };
  },
  cancelAgentTask,

  getSystemStatus: () => mcpRuntime.getStatus(),
};
