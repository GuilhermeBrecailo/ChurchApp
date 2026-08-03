-- Rodape da igreja (contatos e redes sociais) - tudo opcional
ALTER TABLE "Crunch" ADD COLUMN "phone" TEXT;
ALTER TABLE "Crunch" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Crunch" ADD COLUMN "email" TEXT;
ALTER TABLE "Crunch" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Crunch" ADD COLUMN "facebook" TEXT;
ALTER TABLE "Crunch" ADD COLUMN "youtube" TEXT;
ALTER TABLE "Crunch" ADD COLUMN "website" TEXT;

-- Publicacoes (foto + titulo + texto + video)
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "imageKey" TEXT,
    "videoUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crunchId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Post_crunchId_isPublic_publishedAt_idx" ON "Post"("crunchId", "isPublic", "publishedAt");

ALTER TABLE "Post" ADD CONSTRAINT "Post_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
