CREATE TABLE "MinistryChildProfile" (
    "id" TEXT NOT NULL,
    "groupName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "rosterMemberId" TEXT NOT NULL,

    CONSTRAINT "MinistryChildProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MinistryChildGuardian" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "childProfileId" TEXT NOT NULL,
    "guardianRosterMemberId" TEXT NOT NULL,

    CONSTRAINT "MinistryChildGuardian_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MinistryChildSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "groupName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "MinistryChildSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MinistryChildAttendance" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,

    CONSTRAINT "MinistryChildAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MinistryChildProfile_departmentId_rosterMemberId_key" ON "MinistryChildProfile"("departmentId", "rosterMemberId");
CREATE INDEX "MinistryChildProfile_departmentId_isActive_idx" ON "MinistryChildProfile"("departmentId", "isActive");
CREATE UNIQUE INDEX "MinistryChildGuardian_childProfileId_guardianRosterMemberId_key" ON "MinistryChildGuardian"("childProfileId", "guardianRosterMemberId");
CREATE INDEX "MinistryChildGuardian_guardianRosterMemberId_idx" ON "MinistryChildGuardian"("guardianRosterMemberId");
CREATE INDEX "MinistryChildSession_departmentId_date_idx" ON "MinistryChildSession"("departmentId", "date");
CREATE UNIQUE INDEX "MinistryChildAttendance_sessionId_childProfileId_key" ON "MinistryChildAttendance"("sessionId", "childProfileId");
CREATE INDEX "MinistryChildAttendance_childProfileId_idx" ON "MinistryChildAttendance"("childProfileId");

ALTER TABLE "MinistryChildProfile" ADD CONSTRAINT "MinistryChildProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryChildProfile" ADD CONSTRAINT "MinistryChildProfile_rosterMemberId_fkey" FOREIGN KEY ("rosterMemberId") REFERENCES "RosterMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryChildGuardian" ADD CONSTRAINT "MinistryChildGuardian_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "MinistryChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryChildGuardian" ADD CONSTRAINT "MinistryChildGuardian_guardianRosterMemberId_fkey" FOREIGN KEY ("guardianRosterMemberId") REFERENCES "RosterMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryChildSession" ADD CONSTRAINT "MinistryChildSession_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryChildAttendance" ADD CONSTRAINT "MinistryChildAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MinistryChildSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryChildAttendance" ADD CONSTRAINT "MinistryChildAttendance_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "MinistryChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
