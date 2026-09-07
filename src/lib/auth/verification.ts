import { randomInt, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const PIN_LENGTH = 6;
export const PIN_TTL_MS = 10 * 60_000;
export const MAX_PIN_ATTEMPTS = 5;

function generatePin(): string {
  let pin = "";
  for (let i = 0; i < PIN_LENGTH; i++) pin += randomInt(0, 10).toString();
  return pin;
}

function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

/** Generates a new PIN for the user, invalidating any previous unused one. */
export async function createVerificationPin(userId: string): Promise<string> {
  const pin = generatePin();
  const pinHash = hashPin(pin);
  const now = new Date();

  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.emailVerificationToken.create({
      data: { userId, pinHash, expiresAt: new Date(Date.now() + PIN_TTL_MS) },
    }),
  ]);

  return pin;
}

export type VerifyPinResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "incorrect" };

/** Verifies a submitted PIN against the user's active verification token. */
export async function verifyPin(userId: string, pin: string): Promise<VerifyPinResult> {
  const token = await prisma.emailVerificationToken.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!token) return { ok: false, reason: "not_found" };
  if (token.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
  if (token.attempts >= MAX_PIN_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  if (hashPin(pin) !== token.pinHash) {
    await prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_PIN_ATTEMPTS - (token.attempts + 1);
    return remaining <= 0 ? { ok: false, reason: "too_many_attempts" } : { ok: false, reason: "incorrect" };
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }),
  ]);

  return { ok: true };
}
