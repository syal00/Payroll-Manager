/**
 * Validates required env vars before `next dev`. Loads `.env` from project root.
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config();
}

let failed = false;

function check(name, ok, fix) {
  if (ok) {
    console.log(`  ✅ ${name}`);
  } else {
    console.log(`  ❌ ${name}`);
    console.log(`     ${fix}`);
    failed = true;
  }
}

const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
const directUrl = process.env.DIRECT_URL?.trim() ?? "";
const authSecret = process.env.AUTH_SECRET?.trim() ?? "";

console.log("");
console.log("Environment check (.env)");
check(
  "DATABASE_URL is a PostgreSQL URL",
  dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://"),
  'Set DATABASE_URL to a Neon pooler URL, e.g. postgresql://user:pass@***-pooler**.neon.tech/neondb?sslmode=require'
);
check(
  "DIRECT_URL is set (non-pooler host for migrations)",
  (directUrl.startsWith("postgresql://") || directUrl.startsWith("postgres://")) && !/-pooler\./i.test(directUrl),
  "Set DIRECT_URL to your Neon direct connection string (hostname must NOT contain -pooler). See .env.example."
);
check(
  "AUTH_SECRET is at least 32 characters",
  authSecret.length >= 32,
  'Generate one: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
);

const hasEmail =
  Boolean(process.env.RESEND_API_KEY?.trim()) ||
  Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
const resendKey = process.env.RESEND_API_KEY?.trim() ?? "";
const resendLooksValid = resendKey.startsWith("re_") && resendKey.length >= 30;
if (hasEmail && resendKey && !resendLooksValid && !process.env.SMTP_HOST?.trim()) {
  console.log("  ⚠️  RESEND_API_KEY looks invalid (too short or placeholder) — OTP emails will fail");
  console.log("     Get a key at https://resend.com/api-keys and restart npm run dev");
} else if (hasEmail) {
  console.log("  ✅ Email delivery configured (Resend or SMTP)");
} else {
  console.log("  ⚠️  Email not configured — OTP codes show on screen only (add RESEND_API_KEY or SMTP_* to .env)");
}
console.log("");

if (failed) {
  console.error("Fix the issues above, then run `npm run dev` again.\n");
  process.exit(1);
}
