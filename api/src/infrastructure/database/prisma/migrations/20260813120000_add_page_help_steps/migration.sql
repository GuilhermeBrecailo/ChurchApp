-- Adds support for image+text step tutorials on PageHelpVideo, alongside the
-- existing video format. Additive only: videoUrl becomes nullable, two new
-- columns are added with safe defaults, no existing rows are touched.

ALTER TABLE "PageHelpVideo" ALTER COLUMN "videoUrl" DROP NOT NULL;
ALTER TABLE "PageHelpVideo" ADD COLUMN "contentType" TEXT NOT NULL DEFAULT 'VIDEO';
ALTER TABLE "PageHelpVideo" ADD COLUMN "steps" JSONB;
