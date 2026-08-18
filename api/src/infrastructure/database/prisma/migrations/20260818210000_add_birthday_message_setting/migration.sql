-- CreateTable
CREATE TABLE "BirthdayMessageSetting" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "crunchId" TEXT NOT NULL,
    "templateId" TEXT,

    CONSTRAINT "BirthdayMessageSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BirthdayMessageSetting_crunchId_key" ON "BirthdayMessageSetting"("crunchId");

-- AddForeignKey
ALTER TABLE "BirthdayMessageSetting" ADD CONSTRAINT "BirthdayMessageSetting_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirthdayMessageSetting" ADD CONSTRAINT "BirthdayMessageSetting_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
