/*
  Warnings:

  - You are about to drop the column `leaderId` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the `Member` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `churchId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_leaderId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_churchId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_userId_fkey";

-- DropIndex
DROP INDEX "Department_churchId_idx";

-- AlterTable
ALTER TABLE "Church" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "leaderId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "churchId" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- DropTable
DROP TABLE "Member";

-- DropEnum
DROP TYPE "ChurchRole";

-- CreateTable
CREATE TABLE "DepartmentUser" (
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DepartmentUser_pkey" PRIMARY KEY ("userId","departmentId")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentUser" ADD CONSTRAINT "DepartmentUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentUser" ADD CONSTRAINT "DepartmentUser_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
