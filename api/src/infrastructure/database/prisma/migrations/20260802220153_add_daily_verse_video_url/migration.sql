-- AlterTable
-- Link de video opcional no versiculo do dia. Nulo nos registros ja existentes.
ALTER TABLE "DailyVerse" ADD COLUMN     "videoUrl" TEXT;
