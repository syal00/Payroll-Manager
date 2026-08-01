/** Password for seeded demo admin accounts. Keep in sync with `prisma/seed.ts` (`npm run db:seed` / `npm run setup`). */
export const DEMO_ADMIN_PASSWORD = "PayrollDemo2026!";

export const DEMO_CREDENTIALS = {
  admin: {
    contactEmail: "admin@syaloperations.com",
    password: DEMO_ADMIN_PASSWORD,
  },
  manager: {
    contactEmail: "manager@syaloperations.com",
    password: DEMO_ADMIN_PASSWORD,
  },
} as const;

/** Legacy auto-generated usernames — login still accepts these until accounts are re-seeded. */
export const LEGACY_DEMO_USERNAMES = [
  "operations.admin@syal-operations.local",
  "payroll.manager@syal-operations.local",
] as const;

export function isKnownDemoLogin(login: string): boolean {
  const normalized = login.trim().toLowerCase();
  return (
    normalized === DEMO_CREDENTIALS.admin.contactEmail ||
    normalized === DEMO_CREDENTIALS.manager.contactEmail ||
    LEGACY_DEMO_USERNAMES.some((legacy) => legacy === normalized)
  );
}
