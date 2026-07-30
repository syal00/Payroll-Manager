import { z } from "zod";

/** Kept in sync with proxy.ts — these can never resolve to a tenant. */
export const RESERVED_COMPANY_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "dashboard",
  "login",
  "super-admin",
  "www",
]);

export const COMPANY_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const companySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(63)
  .regex(COMPANY_SLUG_PATTERN, "Subdomain must be lowercase letters, numbers, and hyphens (e.g. acme-corp).");

export function slugFromCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function normalizeCompanySlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export type SlugValidationReason = "reserved" | "invalid_format" | "too_short";

export function getSlugValidationReason(slug: string): SlugValidationReason | null {
  const normalized = normalizeCompanySlug(slug);
  if (!normalized || normalized.length < 2) return "too_short";
  if (RESERVED_COMPANY_SLUGS.has(normalized)) return "reserved";
  if (!COMPANY_SLUG_PATTERN.test(normalized)) return "invalid_format";
  return null;
}

export function validateCompanySlug(slug: string): string | null {
  const reason = getSlugValidationReason(slug);
  if (reason === "reserved") return "This subdomain is reserved and cannot be used.";
  if (reason === "too_short") return "Subdomain must be at least 2 characters.";
  if (reason === "invalid_format") {
    return "Subdomain must be lowercase letters, numbers, and hyphens (e.g. acme-corp).";
  }
  return null;
}
