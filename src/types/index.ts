export type DeviceType = "mobile" | "desktop" | "laptop";

export type DeviceStatus = "online" | "offline" | "connecting" | "reconnecting" | "busy" | "error" | "disabled";

export type ConnectionStatus = "connected" | "disconnected" | "limited";

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: DeviceType;
  os: string;
  osVersion: string;
  status: DeviceStatus;
  permittedIp: string;
  appVersion: string;
  mcpConnection: ConnectionStatus;
  agentConnection: ConnectionStatus;
  activeTasks: number;
  lastActivity: string;
  lastSeen: string;
}

export type AgentTaskStatus = "pending" | "running" | "completed" | "failed";

export interface AgentTask {
  id: string;
  deviceId: string;
  deviceName: string;
  instruction: string;
  status: AgentTaskStatus;
  createdAt: string;
  completedAt?: string;
}

export type ActivitySeverity = "info" | "success" | "warning" | "error";

export interface ActivityEvent {
  id: string;
  message: string;
  severity: ActivitySeverity;
  source: string;
  timestamp: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  address?: string;
  avatarUrl?: string;
  role: "user" | "developer" | "admin";
}

export interface McpServerStatus {
  id: string;
  name: string;
  endpoint: string;
  connected: boolean;
  toolCount: number;
  lastPing: string;
}

export interface PairingCode {
  code: string;
  expiresAt: string;
}
