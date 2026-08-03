-- AlterTable
-- Versiculo do dia pode ser publicado na pagina publica da igreja.
-- False nos registros existentes: nada vira publico sozinho.
ALTER TABLE "DailyVerse" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- Mesma regra para devocionais.
ALTER TABLE "Devotional" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "DailyVerse_crunchId_isPublic_publishedAt_idx" ON "DailyVerse"("crunchId", "isPublic", "publishedAt");

-- CreateIndex
CREATE INDEX "Devotional_crunchId_isPublic_publishedAt_idx" ON "Devotional"("crunchId", "isPublic", "publishedAt");
