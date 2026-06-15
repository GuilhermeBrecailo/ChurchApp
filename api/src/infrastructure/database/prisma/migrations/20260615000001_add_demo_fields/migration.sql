-- AlterTable
ALTER TABLE "User" ADD COLUMN "isDemoUser" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Crunch" ADD COLUMN "isDemoChurch" BOOLEAN NOT NULL DEFAULT false;
