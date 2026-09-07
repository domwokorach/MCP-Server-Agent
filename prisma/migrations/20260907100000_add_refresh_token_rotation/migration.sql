-- Preserve existing sessions while replacing the legacy opaque-session fields
-- with refresh-token fields and adding server-side rotation history.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Session" RENAME COLUMN "tokenHash" TO "refreshTokenHash";
ALTER TABLE "Session" RENAME COLUMN "ipAddress" TO "ipHash";
ALTER TABLE "Session" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Session"
SET "ipHash" = encode(digest("ipHash", 'sha256'), 'hex')
WHERE "ipHash" IS NOT NULL;

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rotatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_sessionId_idx" ON "RefreshToken"("sessionId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

ALTER TABLE "RefreshToken"
ADD CONSTRAINT "RefreshToken_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
