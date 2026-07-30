import { z } from "zod";
import { isWellFormedHttpUrl } from "@/lib/password-utils";

/** Paths served from `public/uploads/logos/` after super-admin upload. */
export const UPLOADED_LOGO_PATH_PREFIX = "/uploads/logos/";

const UPLOADED_LOGO_PATH_PATTERN = /^\/uploads\/logos\/[a-zA-Z0-9._-]+$/;

export function isUploadedLogoPath(value: string): boolean {
  return UPLOADED_LOGO_PATH_PATTERN.test(value.trim());
}

export function isValidCompanyLogoUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isUploadedLogoPath(trimmed)) return true;
  return isWellFormedHttpUrl(trimmed);
}

/** For UI preview — http(s) URLs or uploaded relative paths. */
export function isDisplayableLogoUrl(value: string): boolean {
  return isValidCompanyLogoUrl(value);
}

export const companyLogoUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .nullable()
  .optional()
  .refine((val) => val == null || val === "" || isValidCompanyLogoUrl(val), {
    message: "Logo must be a valid URL or an uploaded image path.",
  });

export const ALLOWED_LOGO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export const ALLOWED_LOGO_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

export const MAX_LOGO_UPLOAD_BYTES = 2 * 1024 * 1024;
