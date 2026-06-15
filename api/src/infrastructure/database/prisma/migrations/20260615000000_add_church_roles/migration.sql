-- CreateTable
CREATE TABLE "ChurchRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crunchId" TEXT NOT NULL,

    CONSTRAINT "ChurchRole_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "churchRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "ChurchRole" ADD CONSTRAINT "ChurchRole_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_churchRoleId_fkey" FOREIGN KEY ("churchRoleId") REFERENCES "ChurchRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
