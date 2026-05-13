-- User session invalidation
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;

-- Employee approval + OTP (public portal)
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "is_approved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "otp_code" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "otp_expires" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Employee_is_approved_idx" ON "Employee"("is_approved");

-- App settings (tax rate, etc.)
CREATE TABLE IF NOT EXISTS "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('tax_rate', '20', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Marketing demo requests
CREATE TABLE IF NOT EXISTS "DemoRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "team_size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DemoRequest_createdAt_idx" ON "DemoRequest"("createdAt");
