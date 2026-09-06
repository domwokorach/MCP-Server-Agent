"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import type { McpLogEntry } from "@/services/mcpRuntimeService";

export function McpTerminal({ logs }: { logs: McpLogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: false,
      disableStdin: true,
      fontFamily: "var(--font-geist-mono), monospace",
      fontSize: 12,
      rows: 14,
      theme: { background: "#101418", foreground: "#d8dee9", green: "#a3be8c", red: "#bf616a" },
    });
    terminal.open(containerRef.current);
    terminalRef.current = terminal;
    return () => terminal.dispose();
  }, []);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    terminal.clear();
    if (logs.length === 0) {
      terminal.writeln("$ Awaiting MCP activity...");
      return;
    }
    for (const log of logs) {
      const color = log.level === "error" ? "\x1b[31m" : "\x1b[32m";
      terminal.writeln(`${color}${log.level === "error" ? "x" : "+"}\x1b[0m [${log.source}] ${log.message}`);
    }
  }, [logs]);

  return <div ref={containerRef} className="min-h-80 overflow-hidden bg-[#101418] px-2 py-3 md:min-h-100" aria-label="MCP server logs" />;
}
