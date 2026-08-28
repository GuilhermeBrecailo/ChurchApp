CREATE TABLE "InstagramConnection" (
    "id" TEXT NOT NULL,
    "crunchId" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "username" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramOAuthState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "crunchId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramOAuthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstagramConnection_crunchId_key" ON "InstagramConnection"("crunchId");
CREATE UNIQUE INDEX "InstagramOAuthState_state_key" ON "InstagramOAuthState"("state");
CREATE INDEX "InstagramOAuthState_crunchId_expiresAt_idx" ON "InstagramOAuthState"("crunchId", "expiresAt");

ALTER TABLE "InstagramConnection"
    ADD CONSTRAINT "InstagramConnection_crunchId_fkey"
    FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InstagramOAuthState"
    ADD CONSTRAINT "InstagramOAuthState_crunchId_fkey"
    FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
