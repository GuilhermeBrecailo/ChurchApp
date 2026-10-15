ALTER TABLE "MessageTemplate"
ADD COLUMN "suggestionKey" TEXT;

CREATE UNIQUE INDEX "MessageTemplate_crunchId_suggestionKey_key"
ON "MessageTemplate"("crunchId", "suggestionKey");
