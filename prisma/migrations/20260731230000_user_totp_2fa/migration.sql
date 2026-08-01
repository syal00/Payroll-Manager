-- Super-admin TOTP (Microsoft Authenticator / authenticator apps)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totp_secret_enc" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totp_enabled" BOOLEAN NOT NULL DEFAULT false;
