import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__Host-session";

function refreshTokenDurationMs(): number {
  const duration = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new Error("REFRESH_TOKEN_EXPIRES_IN must use the format <number>s|m|h|d.");
  const amount = Number(match[1]);
  const multiplier = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as "s" | "m" | "h" | "d"];
  return amount * multiplier;
}

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  address: string;
  role: Role;
}

export interface SessionCredentials {
  refreshToken: string;
  sessionId: string;
}

function toSessionUser(user: User): SessionUser {
  return { id: user.id, fullName: user.fullName, email: user.email, address: user.address, role: user.role };
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashIp(ipAddress?: string | null): string | null {
  return ipAddress ? createHash("sha256").update(ipAddress).digest("hex") : null;
}

export async function createSession(
  userId: string,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {}
): Promise<SessionCredentials> {
  const refreshToken = generateToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + refreshTokenDurationMs());
  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.session.create({
      data: {
        userId,
        refreshTokenHash,
        ipHash: hashIp(meta.ipAddress),
        userAgent: meta.userAgent ?? null,
        expiresAt,
      },
    });
    await tx.refreshToken.create({ data: { sessionId: created.id, tokenHash: refreshTokenHash, expiresAt } });
    return created;
  });
  return { refreshToken, sessionId: session.id };
}

async function invalidateExpiredSession(sessionId: string): Promise<void> {
  await prisma.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function validateSessionToken(
  refreshToken: string
): Promise<{ user: SessionUser; sessionId: string } | null> {
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hashToken(refreshToken) },
    include: { user: true },
  });
  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await invalidateExpiredSession(session.id);
    return null;
  }
  return { user: toSessionUser(session.user), sessionId: session.id };
}

export async function validateAccessTokenSession(
  userId: string,
  sessionId: string
): Promise<SessionUser | null> {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  return session ? toSessionUser(session.user) : null;
}

export async function rotateRefreshToken(
  refreshToken: string
): Promise<{ user: SessionUser; sessionId: string; refreshToken: string } | null> {
  const oldHash = hashToken(refreshToken);
  const nextToken = generateToken();
  const nextHash = hashToken(nextToken);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const tokenRecord = await tx.refreshToken.findUnique({ where: { tokenHash: oldHash } });
    const session = tokenRecord
      ? await tx.session.findUnique({ where: { id: tokenRecord.sessionId }, include: { user: true } })
      : await tx.session.findUnique({ where: { refreshTokenHash: oldHash }, include: { user: true } });

    if (!session) return null;
    if (
      session.revokedAt ||
      session.expiresAt <= now ||
      tokenRecord?.revokedAt ||
      (tokenRecord !== null && tokenRecord.expiresAt <= now) ||
      tokenRecord?.rotatedAt
    ) {
      if (tokenRecord?.rotatedAt) {
        await tx.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: now } });
      }
      return null;
    }

    const updated = await tx.session.updateMany({
      where: { id: session.id, refreshTokenHash: oldHash, revokedAt: null, expiresAt: { gt: now } },
      data: { refreshTokenHash: nextHash, lastSeenAt: now },
    });
    if (updated.count !== 1) {
      await tx.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: now } });
      return null;
    }

    if (tokenRecord) {
      await tx.refreshToken.update({ where: { id: tokenRecord.id }, data: { rotatedAt: now } });
    } else {
      await tx.refreshToken.create({ data: { sessionId: session.id, tokenHash: oldHash, expiresAt: session.expiresAt, rotatedAt: now } });
    }
    await tx.refreshToken.create({ data: { sessionId: session.id, tokenHash: nextHash, expiresAt: session.expiresAt } });
    return { user: toSessionUser(session.user), sessionId: session.id, refreshToken: nextToken };
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.$transaction([
    prisma.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { sessionId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } }),
    prisma.refreshToken.updateMany({ where: { session: { userId }, revokedAt: null }, data: { revokedAt: now } }),
  ]);
}

export async function setSessionCookie(refreshToken: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: refreshTokenDurationMs() / 1000,
    priority: "high",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionTokenFromCookies(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionTokenFromCookies();
  return token ? (await validateSessionToken(token))?.user ?? null : null;
}

export async function getCurrentSession(): Promise<{ user: SessionUser; sessionId: string } | null> {
  const token = await getSessionTokenFromCookies();
  return token ? validateSessionToken(token) : null;
}
