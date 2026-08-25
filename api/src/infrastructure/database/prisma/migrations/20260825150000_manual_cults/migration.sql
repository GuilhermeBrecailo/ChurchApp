-- AlterTable
ALTER TABLE "ServiceOccurrence" ADD COLUMN "title" TEXT;
ALTER TABLE "ServiceOccurrence" ADD COLUMN "time" TEXT;
ALTER TABLE "ServiceOccurrence" ADD COLUMN "description" TEXT;
ALTER TABLE "ServiceOccurrence" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "ServiceOccurrence" ADD COLUMN "imageKey" TEXT;
ALTER TABLE "ServiceOccurrence" ALTER COLUMN "serviceTimeId" DROP NOT NULL;
