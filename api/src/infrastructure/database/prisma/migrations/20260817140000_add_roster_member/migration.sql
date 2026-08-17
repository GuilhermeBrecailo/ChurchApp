-- CreateTable
CREATE TABLE "RosterMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VISITOR',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "crunchId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "RosterMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RosterMember_userId_key" ON "RosterMember"("userId");

-- CreateIndex
CREATE INDEX "RosterMember_crunchId_idx" ON "RosterMember"("crunchId");

-- CreateIndex
CREATE INDEX "RosterMember_crunchId_status_idx" ON "RosterMember"("crunchId", "status");

-- AddForeignKey
ALTER TABLE "RosterMember" ADD CONSTRAINT "RosterMember_crunchId_fkey" FOREIGN KEY ("crunchId") REFERENCES "Crunch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterMember" ADD CONSTRAINT "RosterMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
