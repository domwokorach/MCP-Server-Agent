import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  address: string;
  role: Role;
}

function toSessionUser(user: User): SessionUser {
  return { id: user.id, fullName: user.fullName, email: user.email, address: user.address, role: user.role };
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Sessions are looked up by the SHA-256 hash of the token; the raw token only ever lives in the cookie. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {}
): Promise<string> {
  const token = generateToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  return token;
}

export async function validateSessionToken(
  token: string
): Promise<{ user: SessionUser; sessionId: string } | null> {
  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return null;
  }

  return { user: toSessionUser(session.user), sessionId: session.id };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } }).catch(() => {});
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    // HTTPS is mandatory in production; allowing HTTP only in local
    // development keeps the application usable without weakening deployment.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
    priority: "high",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionTokenFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

/** Resolves the authenticated user from the current request's session cookie, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionTokenFromCookies();
  if (!token) return null;
  const result = await validateSessionToken(token);
  return result?.user ?? null;
}

export async function getCurrentSession(): Promise<{ user: SessionUser; sessionId: string } | null> {
  const token = await getSessionTokenFromCookies();
  if (!token) return null;
  return validateSessionToken(token);
}
