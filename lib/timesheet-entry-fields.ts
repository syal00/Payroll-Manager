/** Normalize optional location for Prisma (empty / non-string → null). */
export function normalizeEntryLocation(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}
