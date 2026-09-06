import { prisma } from "@/lib/prisma";

export type ActorType = "user" | "agent" | "system";

export interface AuditEntry {
  actorType: ActorType;
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  success?: boolean;
}

const SECRET_KEY_PATTERN = /(password|secret|token|apikey|api_key|authorization|credential)/i;
const SECRET_VALUE_PATTERN =
  /\b(authorization|token|password|secret|api[_-]?key|credential)\b\s*[:=]\s*([^\s,;]+)/gi;
const BEARER_PATTERN = /\bbearer\s+[^\s,;]+/gi;

/** Redacts credential-shaped values that may occur in command output or logs. */
export function redactText(value: string): string {
  return value
    .replace(SECRET_VALUE_PATTERN, "$1=[redacted]")
    .replace(BEARER_PATTERN, "Bearer [redacted]");
}

/** Recursively strips values behind secret-looking keys before they are persisted or logged. */
export function redact(value: unknown): unknown {
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SECRET_KEY_PATTERN.test(key) ? "[redacted]" : redact(val),
      ])
    );
  }
  return value;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  const metadata = entry.metadata ? redact(entry.metadata) : undefined;
  try {
    await prisma.auditLog.create({
      data: {
        actorType: entry.actorType,
        userId: entry.userId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        ipAddress: entry.ipAddress ?? null,
        success: entry.success ?? true,
      },
    });
  } catch (error) {
    // Auditing must never break the calling request/tool.
    console.error("[audit] failed to persist audit entry", error);
  }
}
