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
