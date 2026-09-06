export class GatewayError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "TOOL_DISABLED"
      | "RATE_LIMITED"
      | "CONCURRENCY_LIMIT"
      | "PAYLOAD_TOO_LARGE"
      | "TIMEOUT"
      | "CANCELLED"
      | "INTERNAL_ERROR",
    message: string
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

export const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB per tool call
export const TOOL_TIMEOUT_MS = 20_000;
export const MAX_CONCURRENT_PER_IDENTITY = 3;
export const MAX_CONCURRENT_GLOBAL = 25;

const activeByIdentity = new Map<string, number>();
let activeGlobal = 0;

export function assertPayloadSize(input: unknown): void {
  const bytes = Buffer.byteLength(JSON.stringify(input ?? {}), "utf8");
  if (bytes > MAX_PAYLOAD_BYTES) {
    throw new GatewayError("PAYLOAD_TOO_LARGE", `Tool input exceeds the ${MAX_PAYLOAD_BYTES}-byte limit.`);
  }
}

export function acquireConcurrencySlot(identityKey: string): () => void {
  const current = activeByIdentity.get(identityKey) ?? 0;
  if (current >= MAX_CONCURRENT_PER_IDENTITY) {
    throw new GatewayError("CONCURRENCY_LIMIT", "Too many concurrent tool calls for this caller.");
  }
  if (activeGlobal >= MAX_CONCURRENT_GLOBAL) {
    throw new GatewayError("CONCURRENCY_LIMIT", "The MCP server is at its concurrent tool-call limit.");
  }
  activeByIdentity.set(identityKey, current + 1);
  activeGlobal += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeGlobal -= 1;
    const next = (activeByIdentity.get(identityKey) ?? 1) - 1;
    if (next <= 0) activeByIdentity.delete(identityKey);
    else activeByIdentity.set(identityKey, next);
  };
}

export async function withTimeout<T>(promise: Promise<T>, ms = TOOL_TIMEOUT_MS, signal?: AbortSignal): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new GatewayError("TIMEOUT", `Tool execution exceeded ${ms}ms.`)), ms);
  });
  let abort: (() => void) | undefined;
  const cancelled = new Promise<never>((_, reject) => {
    if (!signal) return;
    abort = () => reject(new GatewayError("CANCELLED", "Tool execution was cancelled by the MCP client."));
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
  try {
    return await Promise.race([promise, timeout, cancelled]);
  } finally {
    clearTimeout(timer!);
    if (signal && abort) signal.removeEventListener("abort", abort);
  }
}
