CREATE TABLE "PastoralVisit" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "crunchId" TEXT NOT NULL,
    "rosterMemberId" TEXT NOT NULL,
    "responsibleId" TEXT,

    CONSTRAINT "PastoralVisit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PastoralVisit" ADD CONSTRAINT "PastoralVisit_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PastoralVisit" ADD CONSTRAINT "PastoralVisit_rosterMemberId_fkey" FOREIGN KEY ("rosterMemberId") REFERENCES "RosterMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PastoralVisit" ADD CONSTRAINT "PastoralVisit_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PastoralVisit_crunchId_status_scheduledAt_idx" ON "PastoralVisit"("crunchId", "status", "scheduledAt");
CREATE INDEX "PastoralVisit_rosterMemberId_idx" ON "PastoralVisit"("rosterMemberId");
CREATE INDEX "PastoralVisit_responsibleId_idx" ON "PastoralVisit"("responsibleId");
