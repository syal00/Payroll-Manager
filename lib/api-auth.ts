import { getSession, type SessionUser } from "@/lib/session";
import { isStaffRole, isMainAdminRole, isSuperAdminRole, isSupervisorRole } from "@/lib/roles";
import {
  applySuperAdminTenantActing,
  requireSuperAdminTenantActing,
} from "@/lib/tenant-acting";

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

/** Main Admin or Manager — can use admin app & review assigned work. SUPER_ADMIN may act as
 *  MAIN_ADMIN for one tenant when `sa_tenant_company_id` cookie is set (company drill-down). */
export async function requireStaff(): Promise<SessionUser> {
  const s = await requireSession();
  if (isSuperAdminRole(s.role)) {
    return requireSuperAdminTenantActing(s);
  }
  if (!isStaffRole(s.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}

/** Full tenant control (create managers, settings, payslip issuance, etc.). SUPER_ADMIN with tenant
 *  cookie acts as MAIN_ADMIN for that company; without cookie, platform-only routes still pass. */
export async function requireMainAdmin(): Promise<SessionUser> {
  const s = await requireSession();
  if (!isMainAdminRole(s.role) && !isSuperAdminRole(s.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  if (isSuperAdminRole(s.role)) {
    const acting = await applySuperAdminTenantActing(s);
    if (acting.companyId) return acting;
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
    return requireSuperAdminTenantActing(s);
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
  if (requestedCompanyId?.trim()) return requestedCompanyId.trim();
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
