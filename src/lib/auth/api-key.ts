import { randomBytes, createHash } from "node:crypto";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/rbac";

const TOKEN_PREFIX = "map_"; // "my agent platform" key prefix, useful for secret-scanning tools

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Mints a new API key for `userId`. The raw token is only ever returned here — never persisted or logged. */
export async function createApiKey(userId: string, name: string, role?: Role) {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const apiKey = await prisma.apiKey.create({
    data: { userId, name, tokenHash: hashToken(token), role },
  });
  return { token, apiKey: { id: apiKey.id, name: apiKey.name, role: apiKey.role, createdAt: apiKey.createdAt } };
}

export interface ApiKeyIdentity {
  userId: string;
  role: Role;
  label: string;
}

/** Resolves a bearer token to an API-key identity, enforcing the caller's role is capped by the owning user's role. */
export async function resolveApiKeyToken(token: string): Promise<ApiKeyIdentity | null> {
  const tokenHash = hashToken(token);
  const apiKey = await prisma.apiKey.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!apiKey || apiKey.revokedAt) return null;

  const effectiveRole = apiKey.role && hasRole(apiKey.user.role, apiKey.role) ? apiKey.role : apiKey.user.role;
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { userId: apiKey.userId, role: effectiveRole, label: `${apiKey.name} (${apiKey.user.email})` };
}

export async function revokeApiKey(id: string, ownerId: string): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: { id, userId: ownerId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, name: true, role: true, createdAt: true, lastUsedAt: true, revokedAt: true },
    orderBy: { createdAt: "desc" },
  });
}
