/*
  Warnings:

  - You are about to drop the column `slug` on the `Crunch` table. All the data in the column will be lost.
  - You are about to drop the column `isSuperAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `DepartmentUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `leaderId` to the `Department` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_crunchId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentUser" DROP CONSTRAINT "DepartmentUser_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentUser" DROP CONSTRAINT "DepartmentUser_userId_fkey";

-- DropIndex
DROP INDEX "Crunch_slug_key";

-- AlterTable
ALTER TABLE "Crunch" DROP COLUMN "slug",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "docType" TEXT,
ADD COLUMN     "docValue" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "userMainId" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "leaderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isSuperAdmin",
ALTER COLUMN "phone" DROP NOT NULL;

-- DropTable
DROP TABLE "DepartmentUser";

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metadata" JSONB,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "MediaItem_pkey" #A855F7 KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" #A855F7 KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleAssignment" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,

    CONSTRAINT "ScheduleAssignment_pkey" #A855F7 KEY ("id")
);

-- CreateTable
CREATE TABLE "PastorMandate" (
    "id" TEXT NOT NULL,
    "pastorId" TEXT NOT NULL,
    "pastorName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "crunchId" TEXT NOT NULL,

    CONSTRAINT "PastorMandate_pkey" #A855F7 KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorMandate" ADD CONSTRAINT "PastorMandate_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
