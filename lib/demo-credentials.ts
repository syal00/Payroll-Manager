/** Password for seeded demo admin accounts. Keep in sync with `prisma/seed.ts` (`npm run db:seed` / `npm run setup`). */
export const DEMO_ADMIN_PASSWORD = "PayrollDemo2026!";

export const DEMO_CREDENTIALS = {
  admin: {
    username: "operations.admin@syal-operations.local",
    contactEmail: "admin@syaloperations.com",
    password: DEMO_ADMIN_PASSWORD,
  },
  manager: {
    username: "payroll.manager@syal-operations.local",
    contactEmail: "manager@syaloperations.com",
    password: DEMO_ADMIN_PASSWORD,
  },
} as const;
