-- Allow the same email/login in different companies; one User can link to multiple Employee profiles.
DROP INDEX IF EXISTS "Employee_email_key";
DROP INDEX IF EXISTS "Employee_contact_email_key";
DROP INDEX IF EXISTS "Employee_username_key";
DROP INDEX IF EXISTS "Employee_userId_key";
DROP INDEX IF EXISTS "Employee_user_id_key";

ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "mirrored_from_employee_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Employee_company_id_contact_email_key"
  ON "Employee"("company_id", "contact_email");

CREATE UNIQUE INDEX IF NOT EXISTS "Employee_company_id_username_key"
  ON "Employee"("company_id", "username");

CREATE INDEX IF NOT EXISTS "Employee_userId_idx" ON "Employee"("userId");
CREATE INDEX IF NOT EXISTS "Employee_mirrored_from_employee_id_idx" ON "Employee"("mirrored_from_employee_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Employee_mirrored_from_employee_id_fkey'
  ) THEN
    ALTER TABLE "Employee"
      ADD CONSTRAINT "Employee_mirrored_from_employee_id_fkey"
      FOREIGN KEY ("mirrored_from_employee_id") REFERENCES "Employee"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
