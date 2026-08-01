import { normalizeContactEmail } from "@/lib/display-name";

/** Admin portal test accounts — skip Microsoft Authenticator (local/demo only). */
const TEST_BYPASS_2FA_EMAILS = new Set(["syalrakesh00@gmail.com"]);

export function isTestAccountBypass2fa(contactEmail: string, username?: string): boolean {
  if (TEST_BYPASS_2FA_EMAILS.has(normalizeContactEmail(contactEmail))) return true;
  if (username && TEST_BYPASS_2FA_EMAILS.has(normalizeContactEmail(username))) return true;
  return false;
}
