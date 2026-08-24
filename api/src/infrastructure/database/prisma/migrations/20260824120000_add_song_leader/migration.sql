-- AlterTable
ALTER TABLE "ScheduleMediaItem" ADD COLUMN "startedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "ScheduleMediaItem" ADD CONSTRAINT "ScheduleMediaItem_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
