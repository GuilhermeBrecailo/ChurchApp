-- AlterTable
ALTER TABLE "UserSongPreference" ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "UserBibleNote" (
    "id" TEXT NOT NULL,
    "bookAbbrev" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserBibleNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBibleNote_userId_bookAbbrev_chapter_key" ON "UserBibleNote"("userId", "bookAbbrev", "chapter");

-- AddForeignKey
ALTER TABLE "UserBibleNote" ADD CONSTRAINT "UserBibleNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
