-- Remove duplicate Mercado Pago subscription id column. `mpSubscriptionId`
-- and `mpPreapprovalId` were both added in 20260809030000 for the same
-- concept (the preapproval id); neither is referenced in code. Keeping
-- `mpSubscriptionId`, which is what the billing design doc documents.
ALTER TABLE "Crunch" DROP COLUMN "mpPreapprovalId";
