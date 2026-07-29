import { getSession, type SessionUser } from "@/lib/session";
import { isStaffRole, isMainAdminRole, isSuperAdminRole, isSupervisorRole } from "@/lib/roles";

/**
 * Authenticated session for API routes. Prefer `requireStaff` / `requireMainAdmin` / `requireSession` / `requireEmployee`
 * for consistent 401/403 handling; `verifyAuth` in `lib/auth.ts` wraps the same session lookup.
 */

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return s;
}

/** Main Admin or Manager — can use admin app & review assigned work. SUPER_ADMIN is rejected: tenant-
 *  scoped routes use session.companyId, which is always null for super admins and would mix every
 *  company's rows. Super admins must use /api/super-admin/companies/* instead. */
export async function requireStaff(): Promise<SessionUser> {
  const s = await requireSession();
  if (isSuperAdminRole(s.role)) {
    const err = new Error("Super admin must use /api/super-admin/companies routes");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  if (!isStaffRole(s.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}

/** Full tenant control (create managers, settings, payslip issuance, etc.). SUPER_ADMIN also qualifies. */
export async function requireMainAdmin(): Promise<SessionUser> {
  const s = await requireSession();
  if (!isMainAdminRole(s.role) && !isSuperAdminRole(s.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}

/** Cross-tenant platform operator only (company management, provisioning new tenants). */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const s = await requireSession();
  if (!isSuperAdminRole(s.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}

/** Staff (`requireStaff`) plus SUPERVISOR — narrower than staff, scoped to direct reports only. */
export async function requireSupervisorOrAbove(): Promise<SessionUser> {
  const s = await requireSession();
  if (isSuperAdminRole(s.role)) {
    const err = new Error("Super admin must use /api/super-admin/companies routes");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  if (!isStaffRole(s.role) && !isSupervisorRole(s.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}

/**
 * Resolves the companyId a `requireMainAdmin`-guarded route should act on. Only SUPER_ADMIN may
 * target another tenant via a request-supplied companyId (body/params/query); every other caller
 * is pinned to their own session.companyId regardless of what the request claims. Every route
 * behind `requireMainAdmin` that accepts a companyId must resolve it through this helper rather
 * than trusting the request value directly, to prevent cross-tenant access via a tampered payload.
 */
export function resolveCompanyId(session: SessionUser, requestedCompanyId?: string | null): string | null {
  if (isSuperAdminRole(session.role) && requestedCompanyId) return requestedCompanyId;
  return session.companyId;
}

/** @deprecated Use `requireStaff` */
export async function requireAdmin(): Promise<SessionUser> {
  return requireStaff();
}

export async function requireEmployee(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.role !== "EMPLOYEE") {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}
