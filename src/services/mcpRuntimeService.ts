import { spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import path from "node:path";
import { MCP_TOOL_COUNT } from "../../apps/mcp/src/server/create-server";
import { publishRealtimeEvent } from "@/lib/realtime";

export interface McpLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "error";
  message: string;
  source: "mcp" | "api" | "system";
}

export interface McpRuntimeStatus {
  state: "online" | "offline";
  apiStatus: "online";
  websocketStatus: "SSE connected";
  uptimeSeconds: number;
  pid: number | null;
  transport: "STDIO + Streamable HTTP";
  endpoint: string;
  connectedClients: number;
  activeAgents: number;
  connectedDevices: number;
  toolCount: number;
  requestCount: number;
  errorCount: number;
  memoryBytes: number;
  controlsEnabled: boolean;
}

type RuntimeStore = {
  child?: ChildProcess;
  startedAt?: number;
  requestCount: number;
  logs: McpLogEntry[];
  events: EventEmitter;
};

declare global {
  var __mcpRuntimeStore: RuntimeStore | undefined;
}

const store = globalThis.__mcpRuntimeStore ?? {
  requestCount: 0,
  logs: [],
  events: new EventEmitter(),
};
globalThis.__mcpRuntimeStore = store;

function redactSecrets(message: string) {
  return message
    .replace(/(authorization|token|password|secret|api[_-]?key)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .replace(/bearer\s+\S+/gi, "Bearer [REDACTED]");
}

function writeLog(level: McpLogEntry["level"], source: McpLogEntry["source"], message: string) {
  const entry: McpLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message: redactSecrets(message.trim()),
  };
  store.logs = [...store.logs.slice(-199), entry];
  store.events.emit("update", entry);
}

function isRunning() {
  return Boolean(store.child && !store.child.killed && store.child.exitCode === null);
}

export const mcpRuntime = {
  getStatus(): McpRuntimeStatus {
    const online = isRunning();
    return {
      state: online ? "online" : "offline",
      apiStatus: "online",
      websocketStatus: "SSE connected",
      uptimeSeconds: online && store.startedAt ? Math.floor((Date.now() - store.startedAt) / 1_000) : 0,
      pid: online ? store.child?.pid ?? null : null,
      transport: "STDIO + Streamable HTTP",
      endpoint: "/mcp",
      connectedClients: 0,
      activeAgents: 1,
      connectedDevices: 4,
      toolCount: MCP_TOOL_COUNT,
      requestCount: store.requestCount,
      errorCount: store.logs.filter((entry) => entry.level === "error").length,
      memoryBytes: process.memoryUsage().rss,
      controlsEnabled: process.env.NODE_ENV !== "production" || Boolean(process.env.MCP_MANAGEMENT_TOKEN),
    };
  },

  start() {
    if (isRunning()) return this.getStatus();
    const tsxBin = path.join(process.cwd(), "node_modules", ".bin", "tsx");
    const entrypoint = path.join(process.cwd(), "apps", "mcp", "src", "index.ts");
    const child = spawn(tsxBin, [entrypoint], {
      cwd: process.cwd(),
      stdio: ["pipe", "ignore", "pipe"],
      env: process.env,
    });
    store.child = child;
    store.startedAt = Date.now();
    writeLog("info", "mcp", "MCP Server starting...");
    child.stderr?.on("data", (chunk: Buffer) => writeLog("info", "mcp", chunk.toString()));
    child.on("error", (error) => writeLog("error", "mcp", error.message));
    child.on("exit", (code, signal) => {
      writeLog(code === 0 ? "info" : "error", "mcp", `STDIO process stopped (code: ${code ?? "none"}, signal: ${signal ?? "none"}).`);
      store.child = undefined;
      store.startedAt = undefined;
    });
    return this.getStatus();
  },

  async stop() {
    const child = store.child;
    if (!child || !isRunning()) return this.getStatus();
    writeLog("info", "mcp", "Stopping MCP Server...");
    child.kill("SIGTERM");
    return this.getStatus();
  },

  async restart() {
    await this.stop();
    return this.start();
  },

  recordRequest() {
    store.requestCount += 1;
    publishRealtimeEvent("mcp.status", this.getStatus());
    store.events.emit("update");
  },

  getLogs() {
    return store.logs;
  },

  clearLogs() {
    store.logs = [];
    writeLog("info", "system", "Logs cleared.");
  },

  subscribe(listener: (entry?: McpLogEntry) => void) {
    store.events.on("update", listener);
    return () => store.events.off("update", listener);
  },
};
