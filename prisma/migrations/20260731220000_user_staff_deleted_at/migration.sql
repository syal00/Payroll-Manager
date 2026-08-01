-- Temporary suspension for staff accounts (managers / main admins)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_company_id_deleted_at_idx" ON "User"("company_id", "deleted_at");
