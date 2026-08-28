CREATE TABLE "InstagramWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "senderId" TEXT,
    "eventType" TEXT NOT NULL,
    "messageText" TEXT,
    "occurredAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT,

    CONSTRAINT "InstagramWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstagramWebhookEvent_eventId_key"
    ON "InstagramWebhookEvent"("eventId");

CREATE INDEX "InstagramWebhookEvent_instagramUserId_createdAt_idx"
    ON "InstagramWebhookEvent"("instagramUserId", "createdAt");

CREATE INDEX "InstagramWebhookEvent_senderId_createdAt_idx"
    ON "InstagramWebhookEvent"("senderId", "createdAt");

CREATE INDEX "InstagramWebhookEvent_leadId_createdAt_idx"
    ON "InstagramWebhookEvent"("leadId", "createdAt");

ALTER TABLE "InstagramWebhookEvent"
    ADD CONSTRAINT "InstagramWebhookEvent_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "CommercialLead"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
