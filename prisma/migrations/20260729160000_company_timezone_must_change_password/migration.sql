-- Company timezone + force password change on provisioned accounts
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/Toronto';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN NOT NULL DEFAULT false;
