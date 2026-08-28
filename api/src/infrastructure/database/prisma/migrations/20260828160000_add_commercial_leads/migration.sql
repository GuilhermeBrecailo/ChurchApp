CREATE TABLE "CommercialLead" (
    "id" TEXT NOT NULL,
    "funnel" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'DISCOVERED',
    "instagramHandle" TEXT,
    "instagramUserId" TEXT,
    "organizationName" TEXT,
    "contactName" TEXT,
    "publicProfileUrl" TEXT,
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "doNotContact" BOOLEAN NOT NULL DEFAULT false,
    "firstContactAt" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "nextActionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialLeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "channel" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialLeadEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialLead_funnel_instagramHandle_key"
    ON "CommercialLead"("funnel", "instagramHandle");
CREATE UNIQUE INDEX "CommercialLead_funnel_instagramUserId_key"
    ON "CommercialLead"("funnel", "instagramUserId");
CREATE UNIQUE INDEX "CommercialLead_funnel_publicProfileUrl_key"
    ON "CommercialLead"("funnel", "publicProfileUrl");
CREATE INDEX "CommercialLead_funnel_stage_idx"
    ON "CommercialLead"("funnel", "stage");
CREATE INDEX "CommercialLead_doNotContact_idx"
    ON "CommercialLead"("doNotContact");
CREATE INDEX "CommercialLead_nextActionAt_idx"
    ON "CommercialLead"("nextActionAt");
CREATE INDEX "CommercialLeadEvent_leadId_createdAt_idx"
    ON "CommercialLeadEvent"("leadId", "createdAt");

ALTER TABLE "CommercialLeadEvent"
    ADD CONSTRAINT "CommercialLeadEvent_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "CommercialLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
