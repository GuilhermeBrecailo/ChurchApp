-- Assinatura: campos de plano/trial no Crunch, e tabela de video de ajuda por tela.
-- Puramente aditivo: colunas novas com default (nao quebra linhas existentes) ou
-- nullable, e uma tabela nova. Nenhum dado existente e alterado ou removido.

-- AlterTable
ALTER TABLE "Crunch" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "Crunch" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIALING';
ALTER TABLE "Crunch" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Crunch" ADD COLUMN "mpSubscriptionId" TEXT;
ALTER TABLE "Crunch" ADD COLUMN "mpPreapprovalId" TEXT;

-- CreateTable
CREATE TABLE "PageHelpVideo" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageHelpVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageHelpVideo_pageKey_key" ON "PageHelpVideo"("pageKey");
