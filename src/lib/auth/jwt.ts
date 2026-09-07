import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

const ALGORITHM = "HS256";
const DEFAULT_ISSUER = "my-agent-platform";
const DEFAULT_AUDIENCE = "my-agent-platform-api";

export interface AccessTokenClaims {
  sub: string;
  role: Role;
  sessionId: string;
  tokenType: "access";
}

function signingKey(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be configured with at least 32 bytes.");
  }
  return new TextEncoder().encode(secret);
}

function issuer(): string {
  return process.env.JWT_ISSUER || DEFAULT_ISSUER;
}

function audience(): string {
  return process.env.JWT_AUDIENCE || DEFAULT_AUDIENCE;
}

function accessTokenLifetime(): string {
  return process.env.JWT_ACCESS_EXPIRES_IN || "10m";
}

function isRole(value: unknown): value is Role {
  return value === "user" || value === "developer" || value === "admin";
}

export async function createAccessToken(claims: Omit<AccessTokenClaims, "tokenType">): Promise<string> {
  return new SignJWT({ role: claims.role, sessionId: claims.sessionId, tokenType: "access" })
    .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
    .setIssuer(issuer())
    .setAudience(audience())
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(accessTokenLifetime())
    .sign(signingKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, signingKey(), {
      algorithms: [ALGORITHM],
      issuer: issuer(),
      audience: audience(),
    });
    if (
      protectedHeader.alg !== ALGORITHM ||
      payload.tokenType !== "access" ||
      !payload.sub ||
      typeof payload.sessionId !== "string" ||
      !isRole(payload.role)
    ) {
      return null;
    }
    return { sub: payload.sub, sessionId: payload.sessionId, role: payload.role, tokenType: "access" };
  } catch {
    return null;
  }
}
