-- AlterTable
-- Link de video opcional no devocional. Nulo nos registros ja existentes.
ALTER TABLE "Devotional" ADD COLUMN     "videoUrl" TEXT;
