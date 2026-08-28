ALTER TABLE "CommercialLead"
    ADD COLUMN "signupToken" TEXT;

UPDATE "CommercialLead"
SET "signupToken" = gen_random_uuid()::text
WHERE "signupToken" IS NULL;

ALTER TABLE "CommercialLead"
    ALTER COLUMN "signupToken" SET NOT NULL;

CREATE UNIQUE INDEX "CommercialLead_signupToken_key"
    ON "CommercialLead"("signupToken");
