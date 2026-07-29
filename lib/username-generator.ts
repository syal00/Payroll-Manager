import { prisma } from "@/lib/prisma";

function sanitizeNamePart(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned || "user";
}

function companySlugToDomain(slug: string): string {
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "company";
  return `${safe}.local`;
}

async function isUsernameTaken(candidate: string): Promise<boolean> {
  const [userHit, employeeHit] = await Promise.all([
    prisma.user.findUnique({ where: { username: candidate }, select: { id: true } }),
    prisma.employee.findUnique({ where: { username: candidate }, select: { id: true } }),
  ]);
  return Boolean(userHit || employeeHit);
}

/**
 * Produces `{firstname}.{lastname}@{companySlug}.local`, incrementing before `@` on collision.
 * Usernames are login handles only — never pass to mailers or validateEmailDeliverable().
 */
export async function generateUsername(
  firstName: string,
  lastName: string,
  companySlug: string
): Promise<string> {
  const first = sanitizeNamePart(firstName);
  const last = sanitizeNamePart(lastName);
  const domain = companySlugToDomain(companySlug);
  const base = `${first}.${last}`;

  for (let n = 1; n < 1000; n++) {
    const local = n === 1 ? base : `${first}.${last}${n}`;
    const candidate = `${local}@${domain}`;
    if (!(await isUsernameTaken(candidate))) return candidate;
  }

  throw new Error("Could not allocate a unique username.");
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}
