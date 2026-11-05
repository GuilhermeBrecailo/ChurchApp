CREATE TABLE "VisitorFollowUp" (
    "id" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "consentToContact" BOOLEAN NOT NULL DEFAULT false,
    "nextContactAt" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "crunchId" TEXT NOT NULL,
    "rosterMemberId" TEXT NOT NULL,
    "responsibleId" TEXT,

    CONSTRAINT "VisitorFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisitorFollowUpActivity" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "stage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpId" TEXT NOT NULL,
    "actorId" TEXT,

    CONSTRAINT "VisitorFollowUpActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VisitorFollowUp_rosterMemberId_key" ON "VisitorFollowUp"("rosterMemberId");
CREATE INDEX "VisitorFollowUp_crunchId_stage_nextContactAt_idx" ON "VisitorFollowUp"("crunchId", "stage", "nextContactAt");
CREATE INDEX "VisitorFollowUp_responsibleId_idx" ON "VisitorFollowUp"("responsibleId");
CREATE INDEX "VisitorFollowUpActivity_followUpId_createdAt_idx" ON "VisitorFollowUpActivity"("followUpId", "createdAt");
CREATE INDEX "VisitorFollowUpActivity_actorId_idx" ON "VisitorFollowUpActivity"("actorId");

ALTER TABLE "VisitorFollowUp"
ADD CONSTRAINT "VisitorFollowUp_crunchId_fkey"
FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VisitorFollowUp"
ADD CONSTRAINT "VisitorFollowUp_rosterMemberId_fkey"
FOREIGN KEY ("rosterMemberId") REFERENCES "RosterMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VisitorFollowUp"
ADD CONSTRAINT "VisitorFollowUp_responsibleId_fkey"
FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VisitorFollowUpActivity"
ADD CONSTRAINT "VisitorFollowUpActivity_followUpId_fkey"
FOREIGN KEY ("followUpId") REFERENCES "VisitorFollowUp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VisitorFollowUpActivity"
ADD CONSTRAINT "VisitorFollowUpActivity_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
