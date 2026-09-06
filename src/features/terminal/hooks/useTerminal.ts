"use client";

import { useCallback, useEffect, useState } from "react";
import { executeTerminalCommand, fetchTerminalBootstrap } from "../services/terminal.service";
import type { PendingConfirmation, TerminalBootstrap, TerminalLine } from "../types/terminal.types";

const MAX_HISTORY = 50;

function makeLine(kind: TerminalLine["kind"], text: string): TerminalLine {
  return { id: crypto.randomUUID(), kind, text, timestamp: new Date().toISOString() };
}

/** Owns terminal session state: bootstrap config, scrollback, command history, and the confirm/execute flow — the only thing components need to render around. */
export function useTerminal() {
  const [bootstrap, setBootstrap] = useState<TerminalBootstrap | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string>();
  const [cwd, setCwd] = useState("");
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await fetchTerminalBootstrap();
      setBootstrap(data);
      setCwd((current) => current || data.defaultCwd);
      setBootstrapError(undefined);
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Unable to reach the terminal service.");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const appendLine = useCallback((kind: TerminalLine["kind"], text: string) => {
    if (!text) return;
    setLines((prev) => [...prev, makeLine(kind, text)]);
  }, []);

  const run = useCallback(
    async (rawLine: string, confirm = false) => {
      const line = rawLine.trim();
      if (!line) return;
      if (!confirm) {
        setHistory((prev) => [line, ...prev].slice(0, MAX_HISTORY));
        appendLine("input", line);
      }
      setBusy(true);
      try {
        const { status, body } = await executeTerminalCommand({ line, cwd, confirm });
        if (status === 409 && body.requiresConfirmation) {
          setPendingConfirm({ line, tier: body.tier ?? "REQUIRES_CONFIRMATION", message: body.message ?? "Confirm this command." });
          return;
        }
        setPendingConfirm(null);
        if (body.cwd) setCwd(body.cwd);
        if (body.stdout) appendLine("stdout", body.stdout);
        if (body.stderr) appendLine("stderr", body.stderr);
        if (body.error) appendLine("error", body.error.message);
        if (body.timedOut) appendLine("system", "Command timed out.");
        if (body.truncated) appendLine("system", "Output truncated.");
        if (!body.ok && !body.error) appendLine("error", body.message ?? "Command failed.");
      } catch {
        appendLine("error", "Failed to reach the terminal service.");
      } finally {
        setBusy(false);
      }
    },
    [appendLine, cwd]
  );

  const confirmPending = useCallback(() => {
    if (!pendingConfirm) return;
    void run(pendingConfirm.line, true);
  }, [pendingConfirm, run]);

  const cancelPending = useCallback(() => setPendingConfirm(null), []);
  const clear = useCallback(() => setLines([]), []);

  return {
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
    reload: load,
  };
}
