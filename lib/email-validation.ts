import dns from "node:dns/promises";
import disposableDomains from "disposable-email-domains";
import { z } from "zod";

const DISPOSABLE_DOMAINS = new Set(disposableDomains as string[]);

const emailSyntaxSchema = z.string().trim().email();

export type EmailValidationReason =
  | "invalid_syntax"
  | "disposable_email"
  | "no_mx_records"
  | "local_domain";

export type EmailValidationResult =
  | { valid: true }
  | { valid: false; reason: EmailValidationReason };

function extractDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain || null;
}

/** Syntax, disposable-domain, and MX checks — no SMTP verification. */
export async function validateEmailDeliverable(email: string): Promise<EmailValidationResult> {
  const normalized = email.trim().toLowerCase();

  if (!emailSyntaxSchema.safeParse(normalized).success) {
    return { valid: false, reason: "invalid_syntax" };
  }

  if (normalized.endsWith(".local")) {
    return { valid: false, reason: "local_domain" };
  }

  const domain = extractDomain(normalized);
  if (!domain) {
    return { valid: false, reason: "invalid_syntax" };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: "disposable_email" };
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords?.length) {
      return { valid: false, reason: "no_mx_records" };
    }
  } catch {
    return { valid: false, reason: "no_mx_records" };
  }

  return { valid: true };
}

export function emailValidationMessage(reason: EmailValidationReason | undefined): string {
  switch (reason) {
    case "invalid_syntax":
      return "Enter a valid contact email address.";
    case "disposable_email":
      return "Disposable email addresses aren't allowed.";
    case "no_mx_records":
      return "This email domain doesn't accept mail.";
    case "local_domain":
      return "Contact email must be a real deliverable address, not a login username.";
    default:
      return "Enter a valid contact email address.";
  }
}
