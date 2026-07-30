import { prisma } from "@/lib/prisma";

function sanitizePart(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
}

/** Maps staff role to the local part prefix before `@firstname-company.com`. */
export function roleToLoginLocalPart(role: string): string {
  switch (role) {
    case "MAIN_ADMIN":
      return "admin";
    case "MANAGER":
      return "manager";
    case "SUPERVISOR":
      return "supervisor";
    default:
      return sanitizePart(role);
  }
}

/**
 * Company login handle — e.g. manager@rakesh-ironwatch.com
 * Login usernames only; not validated as a deliverable mailbox.
 */
export function buildCompanyLoginEmail(role: string, firstName: string, companySlug: string): string {
  const rolePart = roleToLoginLocalPart(role);
  const first = sanitizePart(firstName);
  const slug = sanitizePart(companySlug);
  return `${rolePart}@${first}-${slug}.com`;
}

async function isUsernameTaken(candidate: string): Promise<boolean> {
  const [userHit, employeeHit] = await Promise.all([
    prisma.user.findUnique({ where: { username: candidate }, select: { id: true } }),
    prisma.employee.findUnique({ where: { username: candidate }, select: { id: true } }),
  ]);
  return Boolean(userHit || employeeHit);
}

/** Allocates a unique company login email, suffixing the role part on collision. */
export async function allocateCompanyLoginUsername(
  role: string,
  firstName: string,
  companySlug: string
): Promise<string> {
  const base = buildCompanyLoginEmail(role, firstName, companySlug);
  if (!(await isUsernameTaken(base))) return base;

  const at = base.indexOf("@");
  const rolePart = base.slice(0, at);
  const domain = base.slice(at + 1);

  for (let n = 2; n < 100; n++) {
    const candidate = `${rolePart}${n}@${domain}`;
    if (!(await isUsernameTaken(candidate))) return candidate;
  }

  throw new Error("Could not allocate a unique company login email.");
}
