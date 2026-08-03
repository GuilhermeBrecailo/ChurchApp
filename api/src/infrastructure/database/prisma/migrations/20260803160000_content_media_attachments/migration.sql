-- Foto e video em avisos, versiculo do dia e devocional (aditivo)
ALTER TABLE "Announcement" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Announcement" ADD COLUMN "imageKey" TEXT;
ALTER TABLE "Announcement" ADD COLUMN "videoUrl" TEXT;

ALTER TABLE "DailyVerse" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "DailyVerse" ADD COLUMN "imageKey" TEXT;

ALTER TABLE "Devotional" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Devotional" ADD COLUMN "imageKey" TEXT;
