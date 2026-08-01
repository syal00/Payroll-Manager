import { Role } from "@/lib/enums";

/** Legacy JWT/DB value before migration; treated like MAIN_ADMIN. */
const LEGACY_ADMIN = "ADMIN";

/** Staff app access. SUPERVISOR is deliberately excluded — use `isSupervisorRole` / `requireSupervisorOrAbove`. */
export function isStaffRole(role: string): boolean {
  return role === Role.MAIN_ADMIN || role === Role.MANAGER || role === Role.SUPER_ADMIN || role === LEGACY_ADMIN;
}

export function isMainAdminRole(role: string): boolean {
  return role === Role.MAIN_ADMIN || role === LEGACY_ADMIN;
}

export function isManagerRole(role: string): boolean {
  return role === Role.MANAGER;
}

/** Cross-tenant platform operator; companyId is always null for this role. */
export function isSuperAdminRole(role: string): boolean {
  return role === Role.SUPER_ADMIN;
}

/** Sees only their own direct reports (Employee.supervisorId), no unassigned-employee fallback. */
export function isSupervisorRole(role: string): boolean {
  return role === Role.SUPERVISOR;
}

/** Password login on /login — staff + supervisor; employees use the portal instead. */
export function isAdminPortalLoginRole(role: string): boolean {
  return isStaffRole(role) || isSupervisorRole(role);
}

/** Post-TOTP redirect for admin portal sessions. */
export function adminPortalLoginRedirect(role: string, mustChangePassword: boolean): string {
  if (mustChangePassword) return "/admin/change-password";
  if (isSuperAdminRole(role)) return "/super-admin/companies";
  return "/admin";
}
