ALTER TABLE "Schedule"
ADD COLUMN "isCommunionService" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ScheduleChecklistItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "isApplicable" BOOLEAN NOT NULL DEFAULT true,
    "templateKey" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "assigneeId" TEXT,

    CONSTRAINT "ScheduleChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleChecklistItem_scheduleId_templateKey_key"
ON "ScheduleChecklistItem"("scheduleId", "templateKey");
CREATE INDEX "ScheduleChecklistItem_scheduleId_order_idx"
ON "ScheduleChecklistItem"("scheduleId", "order");
CREATE INDEX "ScheduleChecklistItem_assigneeId_idx"
ON "ScheduleChecklistItem"("assigneeId");
CREATE INDEX "ScheduleChecklistItem_dueAt_idx"
ON "ScheduleChecklistItem"("dueAt");

ALTER TABLE "ScheduleChecklistItem"
ADD CONSTRAINT "ScheduleChecklistItem_scheduleId_fkey"
FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleChecklistItem"
ADD CONSTRAINT "ScheduleChecklistItem_assigneeId_fkey"
FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
