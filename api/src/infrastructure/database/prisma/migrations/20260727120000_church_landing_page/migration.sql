-- Church landing page backend
ALTER TABLE "Crunch" ADD COLUMN "slug" TEXT;
ALTER TABLE "Crunch" ADD COLUMN "accentColor" TEXT;

DO $$
DECLARE
  church_row RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INTEGER;
BEGIN
  FOR church_row IN SELECT id, name FROM "Crunch" ORDER BY id LOOP
    base_slug := COALESCE(
      NULLIF(
        trim(both '-' from regexp_replace(regexp_replace(lower(translate(church_row.name, '·‡‚„‰ÂÈËÍÎÌÏÓÔÛÚÙıˆ˙˘˚¸ÁÒ¡¿¬√ƒ≈…» ÀÕÃŒœ”“‘’÷⁄Ÿ€‹«—', 'aaaaaaeeeeiiiiooooouuuucnAAAAAAEEEEIIIIOOOOOUUUUCN')), '[^a-z0-9]+', '-', 'g'), '-+', '-', 'g')),
        ''
      ),
      'igreja'
    );
    candidate_slug := base_slug;
    suffix := 2;

    WHILE EXISTS (SELECT 1 FROM "Crunch" WHERE "slug" = candidate_slug) LOOP
      candidate_slug := base_slug || '-' || suffix::text;
      suffix := suffix + 1;
    END LOOP;

    UPDATE "Crunch" SET "slug" = candidate_slug WHERE id = church_row.id;
  END LOOP;
END $$;
ALTER TABLE "Crunch" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Crunch_slug_key" ON "Crunch"("slug");

ALTER TABLE "Announcement" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Announcement" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'ANNOUNCEMENT';
CREATE INDEX "Announcement_crunchId_isPublic_publishedAt_idx" ON "Announcement"("crunchId", "isPublic", "publishedAt");

CREATE TABLE "ServiceTime" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "time" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "crunchId" TEXT NOT NULL,
  CONSTRAINT "ServiceTime_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ServiceTime_crunchId_isActive_idx" ON "ServiceTime"("crunchId", "isActive");
ALTER TABLE "ServiceTime" ADD CONSTRAINT "ServiceTime_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PushSubscription" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "PushSubscription" ADD COLUMN "crunchId" TEXT;
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX "PushSubscription_crunchId_idx" ON "PushSubscription"("crunchId");
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserDepartmentMembership" ADD COLUMN "canManageSchedule" BOOLEAN NOT NULL DEFAULT false;