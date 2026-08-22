-- AlterTable
ALTER TABLE "BirthdayMessageSetting" ADD COLUMN "notifyTime" TEXT NOT NULL DEFAULT '08:00';

-- AlterTable
ALTER TABLE "ServiceAttendance" ADD COLUMN "endedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MessageLogRecipient" (
    "id" TEXT NOT NULL,
    "messageLogId" TEXT NOT NULL,
    "rosterMemberId" TEXT NOT NULL,

    CONSTRAINT "MessageLogRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageLogRecipient_messageLogId_idx" ON "MessageLogRecipient"("messageLogId");

-- AddForeignKey
ALTER TABLE "MessageLogRecipient" ADD CONSTRAINT "MessageLogRecipient_messageLogId_fkey" FOREIGN KEY ("messageLogId") REFERENCES "MessageLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLogRecipient" ADD CONSTRAINT "MessageLogRecipient_rosterMemberId_fkey" FOREIGN KEY ("rosterMemberId") REFERENCES "RosterMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
