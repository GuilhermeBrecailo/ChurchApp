-- Moderacao de pedidos de oracao: pastor aprova/rejeita antes de aparecer para a igreja
ALTER TABLE "PrayerRequest" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "PrayerRequest" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "PrayerRequest" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "PrayerRequest" ADD COLUMN "rejectionReason" TEXT;

-- Pedidos existentes ja eram visiveis publicamente antes desta moderacao; preserva o estado visivel atual
UPDATE "PrayerRequest" SET "status" = 'APPROVED' WHERE "status" = 'PENDING';

CREATE INDEX "PrayerRequest_crunchId_status_createdAt_idx" ON "PrayerRequest"("crunchId", "status", "createdAt");
