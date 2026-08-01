import "server-only";
import { emailValidationMessage, validateEmailDeliverable } from "@/lib/email-validation";

/** Normalizes and throws when the address fails deliverability checks. Server-only. */
export async function validateEmailDeliverableOrThrow(email: string): Promise<string> {
  const result = await validateEmailDeliverable(email);
  if (!result.valid) {
    throw new Error(emailValidationMessage(result.reason));
  }
  return email.trim().toLowerCase();
}
