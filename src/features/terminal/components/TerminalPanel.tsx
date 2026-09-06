"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Terminal } from "@xterm/xterm";
import { ConfirmDialog, ErrorState, LoadingState } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { useTerminal } from "../hooks/useTerminal";
import type { TerminalLine } from "../types/terminal.types";
import { TerminalStatusBar } from "./TerminalStatusBar";
import { TerminalToolbar } from "./TerminalToolbar";

const ANSI = { reset: "\x1b[0m", cyan: "\x1b[36m", red: "\x1b[31m", yellow: "\x1b[33m" };

function colorFor(kind: TerminalLine["kind"]): string {
  switch (kind) {
    case "input": return ANSI.cyan;
    case "stderr":
    case "error": return ANSI.red;
    case "system": return ANSI.yellow;
    default: return "";
  }
}

function cwdLabel(cwd: string): string {
  return cwd.split("/").filter(Boolean).pop() ?? "~";
}

export function TerminalPanel() {
  const { bootstrap, bootstrapError, cwd, lines, busy, pendingConfirm, history, run, confirmPending, cancelPending, clear, reload } = useTerminal();
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const renderedCountRef = useRef(0);
  const historyIndexRef = useRef(-1);
  const [input, setInput] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const terminal = new Terminal({
      convertEol: true,
      disableStdin: true,
      cursorBlink: false,
      fontFamily: "var(--font-geist-mono), monospace",
      fontSize: 13,
      rows: 18,
      theme: { background: "#0b0e11", foreground: "#d8dee9" },
    });
    terminal.open(containerRef.current);
    terminal.writeln("My Agent Platform Terminal");
    terminal.writeln("────────────────────────────────────");
    terminal.writeln("");
    terminalRef.current = terminal;
    const resize = () => {
      const element = containerRef.current;
      if (!element) return;
      terminal.resize(Math.max(20, Math.floor(element.clientWidth / 7.8)), Math.max(14, Math.floor(element.clientHeight / 20)));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    resize();
    return () => {
      observer.disconnect();
      terminal.dispose();
      terminalRef.current = null;
    };
  }, []);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    if (lines.length === 0) {
      terminal.clear();
      terminal.writeln("My Agent Platform Terminal");
      terminal.writeln("────────────────────────────────────");
      terminal.writeln("");
      renderedCountRef.current = 0;
      return;
    }
    for (const line of lines.slice(renderedCountRef.current)) {
      const color = colorFor(line.kind);
      const prefix = line.kind === "input" ? `${cwdLabel(cwd)} mcp> ` : "";
      const stamp = showTimestamps ? `\x1b[90m[${new Date(line.timestamp).toLocaleTimeString()}]${ANSI.reset} ` : "";
      for (const text of line.text.split("\n")) terminal.writeln(`${stamp}${color}${prefix}${text}${color ? ANSI.reset : ""}`);
    }
    renderedCountRef.current = lines.length;
    if (autoScroll) terminal.scrollToBottom();
  }, [lines, cwd, showTimestamps, autoScroll]);

  const submit = () => {
    if (!input.trim() || busy) return;
    void run(input);
    setInput("");
    historyIndexRef.current = -1;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(historyIndexRef.current + 1, history.length - 1);
      historyIndexRef.current = next;
      if (history[next] !== undefined) setInput(history[next]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = historyIndexRef.current - 1;
      historyIndexRef.current = next;
      setInput(next >= 0 ? history[next] : "");
    } else if (event.key === "c" && event.ctrlKey) {
      setInput("");
    }
  };

  const copyOutput = async () => navigator.clipboard.writeText(lines.map((line) => line.text).join("\n"));

  if (bootstrapError) return <ErrorState title="Terminal unavailable" description={bootstrapError} onRetry={() => void reload()} />;
  if (!bootstrap) return <LoadingState label="Connecting to the terminal service…" />;
  if (!bootstrap.canUseTerminal) return <ErrorState title="Admin role required" description="The MCP terminal tool is restricted to administrators. Ask an admin to grant your account access." />;
  if (!bootstrap.enabled) return <ErrorState title="Terminal disabled" description="The MCP terminal tool is disabled. An administrator must set MCP_TERMINAL_ENABLED=true to enable it." onRetry={() => void reload()} />;

  return (
    <div className={`space-y-4 ${fullscreen ? "fixed inset-0 z-50 overflow-auto bg-background p-4 sm:p-6" : ""}`}>
      <TerminalToolbar
        fullscreen={fullscreen}
        showTimestamps={showTimestamps}
        autoScroll={autoScroll}
        onToggleFullscreen={() => setFullscreen((value) => !value)}
        onToggleTimestamps={() => setShowTimestamps((value) => !value)}
        onToggleAutoScroll={() => setAutoScroll((value) => !value)}
        onClear={clear}
        onCopy={() => void copyOutput()}
        onReconnect={() => void reload()}
      />
      <div className={`grid overflow-hidden rounded-2xl border border-border bg-[#0b0e11] ${fullscreen ? "min-h-[calc(100dvh-10rem)]" : "min-h-110 md:min-h-140"} grid-rows-[minmax(0,1fr)_auto]`}>
        <div ref={containerRef} className="min-h-0 overflow-hidden px-3 py-2 [&_.xterm]:h-full [&_.xterm-viewport]:h-full" aria-label="Terminal output" />
        <div className="flex min-h-14 items-center gap-2 border-t border-white/10 px-3 py-2">
          <span className="shrink-0 font-mono text-sm text-cyan-300">{cwdLabel(cwd)} mcp&gt;</span>
          <Input
            value={input}
            disabled={busy}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Run a command…"
            aria-label="Terminal command input"
            autoComplete="off"
            spellCheck={false}
            className="h-9 border-0 bg-transparent font-mono text-sm text-slate-200 shadow-none ring-0 focus-visible:ring-0"
          />
        </div>
      </div>
      <TerminalStatusBar cwd={cwd} busy={busy} allowedCommands={bootstrap.allowedCommands} />
      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title={pendingConfirm?.tier === "ADMIN_ONLY" ? "Confirm destructive command" : "Confirm command"}
        description={pendingConfirm?.message}
        confirmLabel="Run command"
        destructive={pendingConfirm?.tier === "ADMIN_ONLY"}
        onConfirm={confirmPending}
        onClose={cancelPending}
      />
    </div>
  );
}
