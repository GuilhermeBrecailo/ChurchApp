-- CreateTable
CREATE TABLE "MercadoPagoWebhookNotification" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "action" TEXT,
    "resourceId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MercadoPagoWebhookNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MercadoPagoWebhookNotification_resourceId_idx" ON "MercadoPagoWebhookNotification"("resourceId");
