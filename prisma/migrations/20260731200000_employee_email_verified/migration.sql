-- Track whether self-registration email OTP was completed (separate from admin isApproved).
ALTER TABLE "Employee" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- Existing active employees were provisioned outside self-registration OTP flow.
UPDATE "Employee"
SET "email_verified" = true
WHERE "is_approved" = true AND "deleted_at" IS NULL;
