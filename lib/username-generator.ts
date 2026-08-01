/** Normalizes a login identifier (email or legacy username). */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}
