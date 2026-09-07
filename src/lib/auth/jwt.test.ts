import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAccessToken, verifyAccessToken } from "./jwt";

const originalEnvironment = { ...process.env };

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET = "a".repeat(64);
  process.env.JWT_ISSUER = "my-agent-platform";
  process.env.JWT_AUDIENCE = "my-agent-platform-api";
  process.env.JWT_ACCESS_EXPIRES_IN = "10m";
});

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe("access JWTs", () => {
  it("issues and verifies minimal access-token claims", async () => {
    const token = await createAccessToken({ sub: "user-1", role: "developer", sessionId: "session-1" });
    await expect(verifyAccessToken(token)).resolves.toEqual({
      sub: "user-1",
      role: "developer",
      sessionId: "session-1",
      tokenType: "access",
    });
  });

  it("rejects altered signatures, expired tokens, and mismatched issuer or audience", async () => {
    const token = await createAccessToken({ sub: "user-1", role: "user", sessionId: "session-1" });
    const [header, payload, signature] = token.split(".");
    const alteredSignature = `${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;
    await expect(verifyAccessToken(`${header}.${payload}.${alteredSignature}`)).resolves.toBeNull();

    process.env.JWT_ISSUER = "unexpected-issuer";
    await expect(verifyAccessToken(token)).resolves.toBeNull();

    process.env.JWT_ISSUER = "my-agent-platform";
    process.env.JWT_AUDIENCE = "unexpected-audience";
    await expect(verifyAccessToken(token)).resolves.toBeNull();

    process.env.JWT_AUDIENCE = "my-agent-platform-api";
    process.env.JWT_ACCESS_EXPIRES_IN = "-1s";
    const expired = await createAccessToken({ sub: "user-1", role: "user", sessionId: "session-1" });
    await expect(verifyAccessToken(expired)).resolves.toBeNull();
  });
});
