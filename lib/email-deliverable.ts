import { emailValidationMessage, validateEmailDeliverable } from "@/lib/email-validation";

/** Normalizes and throws when the address fails deliverability checks. */
export async function validateEmailDeliverableOrThrow(email: string): Promise<string> {
  const result = await validateEmailDeliverable(email);
  if (!result.valid) {
    throw new Error(emailValidationMessage(result.reason));
  }
  return email.trim().toLowerCase();
}

export function normalizeContactEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Login usernames must never equal the contact email. */
export function assertUsernameNotContactEmail(username: string, contactEmail: string): void {
  if (username.trim().toLowerCase() === contactEmail.trim().toLowerCase()) {
    throw new Error("Username and contact email must be different values.");
  }
}

/** Split a display name into first/last for username generation. */
export function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "user", lastName: "account" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "user" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}
