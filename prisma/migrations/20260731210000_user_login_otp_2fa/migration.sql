-- Super-admin email OTP (2FA) during staff login
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "login_otp_code" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "login_otp_expires" TIMESTAMP(3);
