-- Comments on a devotional. No moderation: visible immediately, author or
-- pastor/admin can delete. Written by hand (not `prisma migrate dev`) because
-- this dev database has pre-existing drift unrelated to this change, and
-- `migrate dev` wanted to reset the whole database to resolve it.

CREATE TABLE IF NOT EXISTS "DevotionalComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "devotionalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "crunchId" TEXT NOT NULL,
    CONSTRAINT "DevotionalComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DevotionalComment_devotionalId_createdAt_idx" ON "DevotionalComment"("devotionalId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DevotionalComment_devotionalId_fkey') THEN
        ALTER TABLE "DevotionalComment" ADD CONSTRAINT "DevotionalComment_devotionalId_fkey" FOREIGN KEY ("devotionalId") REFERENCES "Devotional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DevotionalComment_authorId_fkey') THEN
        ALTER TABLE "DevotionalComment" ADD CONSTRAINT "DevotionalComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DevotionalComment_crunchId_fkey') THEN
        ALTER TABLE "DevotionalComment" ADD CONSTRAINT "DevotionalComment_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
