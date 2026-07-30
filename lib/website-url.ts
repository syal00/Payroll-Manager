import { z } from "zod";

/** Prepends https:// when the user enters a bare domain (e.g. example.com). */
export function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidWebsiteUrl(raw: string): boolean {
  const normalized = normalizeWebsiteUrl(raw);
  if (!normalized) return true;
  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns normalized URL or null when empty; throws-friendly via null on invalid. */
export function parseOptionalWebsiteUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const normalized = normalizeWebsiteUrl(raw);
  return isValidWebsiteUrl(normalized) ? normalized : null;
}

export const companyWebsiteUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .nullable()
  .optional()
  .transform((val) => {
    if (val == null || val === "") return null;
    const normalized = normalizeWebsiteUrl(val);
    return normalized || null;
  })
  .refine((val) => val === null || isValidWebsiteUrl(val), {
    message: "Enter a valid website URL (http:// or https://).",
  });
