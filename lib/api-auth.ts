import { getSession, type SessionUser } from "@/lib/session";
import { isStaffRole, isMainAdminRole } from "@/lib/roles";

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

/** Main Admin or Manager — can use admin app & review assigned work. */
export async function requireStaff(): Promise<SessionUser> {
  const s = await requireSession();
  if (!isStaffRole(s.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
}

/** Full tenant control (create managers, settings, payslip issuance, etc.). */
export async function requireMainAdmin(): Promise<SessionUser> {
  const s = await requireSession();
  if (!isMainAdminRole(s.role)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return s;
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
