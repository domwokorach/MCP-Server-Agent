"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Terminal } from "@xterm/xterm";
import { ConfirmDialog, ErrorState, LoadingState } from "@/components/ui";
import { useTerminal } from "../hooks/useTerminal";
import type { TerminalLine } from "../types/terminal.types";
import { TerminalStatusBar } from "./TerminalStatusBar";
import { TerminalToolbar } from "./TerminalToolbar";

const ANSI = { reset: "\x1b[0m", cyan: "\x1b[36m", red: "\x1b[31m", yellow: "\x1b[33m" };

function colorFor(kind: TerminalLine["kind"]): string {
  switch (kind) {
    case "input":
      return ANSI.cyan;
    case "stderr":
    case "error":
      return ANSI.red;
    case "system":
      return ANSI.yellow;
    default:
      return "";
  }
}

function cwdLabel(cwd: string): string {
  return cwd.split("/").filter(Boolean).pop() ?? "~";
}

/**
 * The browser side of the terminal: xterm.js renders scrollback (colored,
 * read-only) while a native input line handles keyboard entry — real
 * keyboards, IME, and mobile virtual keyboards all behave far better against
 * a plain input than against raw xterm keystroke capture. Every submitted
 * line goes through the authenticated `/api/terminal/execute` Terminal
 * Service; this component never talks to MCP directly.
 */
export function TerminalPanel() {
  const {
    bootstrap,
    bootstrapError,
    cwd,
    lines,
    busy,
    pendingConfirm,
    history,
    run,
    confirmPending,
    cancelPending,
    clear,
    reload,
  } = useTerminal();

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
      const columns = Math.max(20, Math.floor(element.clientWidth / 7.8));
      const rows = Math.max(14, Math.floor(element.clientHeight / 20));
      terminal.resize(columns, rows);
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
    const newLines = lines.slice(renderedCountRef.current);
    for (const line of newLines) {
      const color = colorFor(line.kind);
      const prefix = line.kind === "input" ? `${cwdLabel(cwd)} mcp> ` : "";
      const stamp = showTimestamps ? `\x1b[90m[${new Date(line.timestamp).toLocaleTimeString()}]${ANSI.reset} ` : "";
      for (const text of line.text.split("\n")) {
        terminal.writeln(`${stamp}${color}${prefix}${text}${color ? ANSI.reset : ""}`);
      }
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

  const copyOutput = async () => {
    const text = lines.map((line) => line.text).join("\n");
    await navigator.clipboard.writeText(text);
  };

  if (bootstrapError) {
    return <ErrorState title="Terminal unavailable" description={bootstrapError} onRetry={() => void reload()} />;
  }
  if (!bootstrap) {
    return <LoadingState label="Connecting to the terminal service…" />;
  }
  if (!bootstrap.canUseTerminal) {
    return (
      <ErrorState
        title="Admin role required"
        description="The MCP terminal tool is restricted to administrators. Ask an admin to grant your account access."
      />
    );
  }
  if (!bootstrap.enabled) {
    return (
      <ErrorState
        title="Terminal disabled"
        description="The MCP terminal tool is disabled. An administrator must set MCP_TERMINAL_ENABLED=true to enable it."
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <Stack spacing={1.5} sx={fullscreen ? { position: "fixed", inset: 0, zIndex: 1300, bgcolor: "background.default", p: 2 } : undefined}>
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
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "minmax(0, 1fr) auto",
          minHeight: fullscreen ? "calc(100dvh - 104px)" : { xs: 440, md: 560 },
          bgcolor: "#0b0e11",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box
          ref={containerRef}
          sx={{
            minHeight: 0,
            px: 1.5,
            py: 1,
            overflow: "hidden",
            "& .xterm, & .xterm-viewport": { height: "100%" },
          }}
          aria-label="Terminal output"
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            minHeight: 56,
            px: 1.5,
            py: 1,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography component="span" sx={{ fontFamily: "monospace", color: "#88c0d0", fontSize: 13, whiteSpace: "nowrap" }}>
            {cwdLabel(cwd)} mcp&gt;
          </Typography>
          <InputBase
            fullWidth
            value={input}
            disabled={busy}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Run a command…"
            inputProps={{ "aria-label": "Terminal command input", autoComplete: "off", spellCheck: false }}
            sx={{ minHeight: 40, fontFamily: "monospace", fontSize: 13, color: "#d8dee9" }}
          />
        </Stack>
      </Box>
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
    </Stack>
  );
}
