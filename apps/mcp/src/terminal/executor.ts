import { spawn } from "node:child_process";
import {
  getAllowedCommands,
  getMaxOutputBytes,
  getSafeEnv,
  getTimeoutMs,
  isCommandDenied,
  isTerminalEnabled,
  resolveAllowedCwd,
} from "./config";

export interface TerminalResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  truncated: boolean;
  timedOut: boolean;
}

const SHELL_METACHARACTERS = /[;&|`$<>\n]/;

export class TerminalDeniedError extends Error {}

export async function executeTerminalCommand(input: {
  command: string;
  args: string[];
  cwd: string;
}): Promise<TerminalResult> {
  if (!isTerminalEnabled()) {
    throw new TerminalDeniedError("The terminal tool is disabled. An administrator must set MCP_TERMINAL_ENABLED=true.");
  }
  if (isCommandDenied(input.command)) {
    throw new TerminalDeniedError(`Command "${input.command}" is explicitly denied.`);
  }
  if (!getAllowedCommands().has(input.command)) {
    throw new TerminalDeniedError(`Command "${input.command}" is not on the allowlist.`);
  }
  if (input.args.some((arg) => SHELL_METACHARACTERS.test(arg))) {
    throw new TerminalDeniedError("Arguments may not contain shell metacharacters.");
  }
  const cwd = resolveAllowedCwd(input.cwd);
  if (!cwd) {
    throw new TerminalDeniedError(`Working directory "${input.cwd}" is outside the allowed paths.`);
  }

  const timeoutMs = getTimeoutMs();
  const maxBytes = getMaxOutputBytes();

  return new Promise<TerminalResult>((resolve, reject) => {
    // shell: false is load-bearing — args are passed directly to execve, never
    // interpreted by a shell, so quoting/metacharacter injection is not possible.
    const child = spawn(input.command, input.args, { cwd, env: getSafeEnv(), shell: false });

    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let truncated = false;
    let timedOut = false;

    const cap = (chunk: Buffer) => {
      const remaining = maxBytes - outputBytes;
      if (remaining <= 0) {
        truncated = true;
        return "";
      }
      const accepted = chunk.subarray(0, remaining);
      outputBytes += accepted.byteLength;
      if (accepted.byteLength < chunk.byteLength) truncated = true;
      return accepted.toString("utf8");
    };

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += cap(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += cap(chunk);
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, stdout, stderr, truncated, timedOut });
    });
  });
}
