import { randomBytes } from "node:crypto";

import { mockDevices } from "@/lib/mock-data";
import type { Device, DeviceStatus, DeviceType } from "@/types";

export type DeviceAction = "connect" | "disconnect" | "reconnect" | "rename" | "remove";

export interface DeviceActionResult {
  success: boolean;
  message: string;
  device?: Device;
  removedId?: string;
}

interface PairingSession {
  userId: string;
  type: DeviceType;
  expiresAt: string;
}

const pairingSessions = new Map<string, PairingSession>();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listDevices(): Promise<Device[]> {
  await delay(100);
  return mockDevices.map((device) => ({ ...device }));
}

export async function getDevice(id: string): Promise<Device | undefined> {
  await delay(75);
  const device = mockDevices.find((item) => item.id === id);
  return device ? { ...device } : undefined;
}

function setConnections(device: Device, status: DeviceStatus) {
  if (status === "online" || status === "busy") {
    device.mcpConnection = "connected";
    device.agentConnection = "connected";
    return;
  }
  device.mcpConnection = "disconnected";
  device.agentConnection = "disconnected";
}

export async function performDeviceAction(
  id: string,
  action: DeviceAction,
  name?: string
): Promise<DeviceActionResult> {
  await delay(150);
  const index = mockDevices.findIndex((device) => device.id === id);
  if (index === -1) return { success: false, message: "Device not found." };

  const device = mockDevices[index];
  if (action === "remove") {
    mockDevices.splice(index, 1);
    return { success: true, message: `${device.name} was removed from this console.`, removedId: id };
  }

  if (action === "rename") {
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.length > 80) {
      return { success: false, message: "Enter a device name between 1 and 80 characters." };
    }
    device.name = trimmedName;
    return { success: true, message: "Device renamed.", device: { ...device } };
  }

  if (device.status === "disabled" && action !== "disconnect") {
    return { success: false, message: `${device.name} is disabled. Enable it from the companion app before connecting.` };
  }

  if (action === "disconnect") {
    if (device.status === "offline") return { success: false, message: `${device.name} is already offline.` };
    device.status = "offline";
    device.activeTasks = 0;
    setConnections(device, "offline");
  } else {
    device.status = action === "reconnect" ? "reconnecting" : "connecting";
    device.lastActivity = new Date().toISOString();
    device.lastSeen = device.lastActivity;
    setConnections(device, "online");
    device.status = "online";
  }

  const verb = action === "reconnect" ? "Reconnected" : action === "connect" ? "Connected" : "Disconnected";
  return { success: true, message: `${verb} ${device.name}.`, device: { ...device } };
}

export async function createPairingCode(userId: string, type: DeviceType): Promise<{ code: string; expiresAt: string }> {
  await delay(100);
  const code = randomBytes(4).toString("hex").toUpperCase().match(/.{1,4}/g)?.join("-") ?? "";
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  pairingSessions.set(code, { userId, type, expiresAt });
  return { code, expiresAt };
}

export async function approvePairing(userId: string, code: string): Promise<DeviceActionResult> {
  const pairing = pairingSessions.get(code);
  if (!pairing || pairing.userId !== userId || new Date(pairing.expiresAt).getTime() <= Date.now()) {
    pairingSessions.delete(code);
    return { success: false, message: "This pairing code is invalid or has expired. Generate a new code." };
  }

  pairingSessions.delete(code);
  const timestamp = new Date().toISOString();
  const id = `paired-${randomBytes(4).toString("hex")}`;
  const labels: Record<DeviceType, string> = {
    mobile: "New mobile device",
    desktop: "New desktop device",
    laptop: "New laptop device",
  };
  const defaults: Record<DeviceType, Pick<Device, "os" | "osVersion">> = {
    mobile: { os: "Mobile OS", osVersion: "Current" },
    desktop: { os: "Desktop OS", osVersion: "Current" },
    laptop: { os: "Laptop OS", osVersion: "Current" },
  };
  const device: Device = {
    id,
    deviceId: `PAIR-${randomBytes(4).toString("hex").toUpperCase()}`,
    name: labels[pairing.type],
    type: pairing.type,
    ...defaults[pairing.type],
    status: "online",
    permittedIp: "Pending network approval",
    appVersion: "3.8.1",
    mcpConnection: "connected",
    agentConnection: "connected",
    activeTasks: 0,
    lastActivity: timestamp,
    lastSeen: timestamp,
  };
  mockDevices.unshift(device);
  return { success: true, message: `${device.name} is connected.`, device: { ...device } };
}
