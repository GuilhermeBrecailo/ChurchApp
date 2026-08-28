CREATE TABLE "InstagramDataDeletionRequest" (
    "id" TEXT NOT NULL,
    "confirmationCode" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InstagramDataDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstagramDataDeletionRequest_confirmationCode_key"
    ON "InstagramDataDeletionRequest"("confirmationCode");

CREATE INDEX "InstagramDataDeletionRequest_instagramUserId_createdAt_idx"
    ON "InstagramDataDeletionRequest"("instagramUserId", "createdAt");
