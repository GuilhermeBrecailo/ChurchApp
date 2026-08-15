-- Adds an optional profile photo URL to User. Additive only, nullable, no
-- existing rows touched.

ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
