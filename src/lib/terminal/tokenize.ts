const SHELL_METACHARACTERS = /[;&|`$<>\n]/;

export class TerminalInputError extends Error {}

/**
 * Splits a command line into `{ command, args }`, supporting simple quoted
 * arguments. This is a human-input tokenizer only — the actual injection
 * defense lives in the executor, which spawns with `shell: false` so these
 * tokens are never re-interpreted by a shell. Metacharacters are still
 * rejected here so the UI can fail fast with a clear message.
 */
export function tokenizeCommandLine(line: string): { command: string; args: string[] } {
  const trimmed = line.trim();
  if (!trimmed) throw new TerminalInputError("Enter a command.");
  if (SHELL_METACHARACTERS.test(trimmed)) {
    throw new TerminalInputError("Shell metacharacters ( ; & | ` $ < > ) are not supported.");
  }

  const tokens: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(trimmed))) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  if (tokens.length === 0) throw new TerminalInputError("Enter a command.");

  const [command, ...args] = tokens;
  return { command, args };
}
