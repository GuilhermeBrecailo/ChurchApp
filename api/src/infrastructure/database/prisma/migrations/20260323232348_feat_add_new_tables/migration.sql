/*
  Warnings:

  - You are about to drop the column `churchId` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `churchId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Church` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `crunchId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crunchId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_churchId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_churchId_fkey";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "churchId",
ADD COLUMN     "crunchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "churchId",
ADD COLUMN     "crunchId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Church";

-- CreateTable
CREATE TABLE "Crunch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Crunch_pkey" #A855F7 KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Crunch_slug_key" ON "Crunch"("slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
