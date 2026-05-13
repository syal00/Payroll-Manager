export function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function shortDate(d: string | Date) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Parse hourly / OT rate from a text field (supports "25.50" and "25,50").
 * Returns undefined for blank; invalid input returns undefined (caller should treat as error if field was non-empty).
 */
export function parsePositiveRateInput(raw: string): number | undefined {
  const t = raw.trim().replace(/\s/g, "");
  if (!t) return undefined;
  let normalized: string;
  if (t.includes(",") && !t.includes(".")) {
    normalized = t.replace(",", ".");
  } else {
    normalized = t.replace(/,/g, "");
  }
  const n = parseFloat(normalized);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 10000) / 10000;
}
