-- CreateTable
CREATE TABLE "ServiceAttendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "visitorCount" INTEGER NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "crunchId" TEXT NOT NULL,
    "serviceTimeId" TEXT NOT NULL,

    CONSTRAINT "ServiceAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAttendance_serviceTimeId_date_key" ON "ServiceAttendance"("serviceTimeId", "date");

-- CreateIndex
CREATE INDEX "ServiceAttendance_crunchId_date_idx" ON "ServiceAttendance"("crunchId", "date");

-- AddForeignKey
ALTER TABLE "ServiceAttendance" ADD CONSTRAINT "ServiceAttendance_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttendance" ADD CONSTRAINT "ServiceAttendance_serviceTimeId_fkey" FOREIGN KEY ("serviceTimeId") REFERENCES "ServiceTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
