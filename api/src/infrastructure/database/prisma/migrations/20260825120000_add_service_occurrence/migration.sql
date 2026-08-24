-- CreateTable
CREATE TABLE "ServiceOccurrence" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crunchId" TEXT NOT NULL,
    "serviceTimeId" TEXT NOT NULL,

    CONSTRAINT "ServiceOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOccurrenceAttendee" (
    "id" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceOccurrenceId" TEXT NOT NULL,
    "rosterMemberId" TEXT NOT NULL,

    CONSTRAINT "ServiceOccurrenceAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOccurrence_serviceTimeId_date_key" ON "ServiceOccurrence"("serviceTimeId", "date");

-- CreateIndex
CREATE INDEX "ServiceOccurrence_crunchId_date_idx" ON "ServiceOccurrence"("crunchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOccurrenceAttendee_serviceOccurrenceId_rosterMemberId_key" ON "ServiceOccurrenceAttendee"("serviceOccurrenceId", "rosterMemberId");

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "serviceOccurrenceId" TEXT;

-- AlterTable
ALTER TABLE "ServiceAttendance" ADD COLUMN "serviceOccurrenceId" TEXT;

-- AddForeignKey
ALTER TABLE "ServiceOccurrence" ADD CONSTRAINT "ServiceOccurrence_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOccurrence" ADD CONSTRAINT "ServiceOccurrence_serviceTimeId_fkey" FOREIGN KEY ("serviceTimeId") REFERENCES "ServiceTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOccurrenceAttendee" ADD CONSTRAINT "ServiceOccurrenceAttendee_serviceOccurrenceId_fkey" FOREIGN KEY ("serviceOccurrenceId") REFERENCES "ServiceOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOccurrenceAttendee" ADD CONSTRAINT "ServiceOccurrenceAttendee_rosterMemberId_fkey" FOREIGN KEY ("rosterMemberId") REFERENCES "RosterMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_serviceOccurrenceId_fkey" FOREIGN KEY ("serviceOccurrenceId") REFERENCES "ServiceOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttendance" ADD CONSTRAINT "ServiceAttendance_serviceOccurrenceId_fkey" FOREIGN KEY ("serviceOccurrenceId") REFERENCES "ServiceOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
