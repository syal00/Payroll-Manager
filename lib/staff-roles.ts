import { Role } from "@/lib/enums";

export const COMPANY_STAFF_ROLES = [Role.MAIN_ADMIN, Role.MANAGER, Role.SUPERVISOR] as const;
export type CompanyStaffRole = (typeof COMPANY_STAFF_ROLES)[number];

export function isCompanyStaffRole(role: string): role is CompanyStaffRole {
  return role === Role.MAIN_ADMIN || role === Role.MANAGER || role === Role.SUPERVISOR;
}

/** Friendly labels shown in the role field datalist. */
export const STAFF_ROLE_SUGGESTIONS = ["Manager", "Main admin", "Supervisor"] as const;

const ALIAS_TO_ROLE: Record<string, CompanyStaffRole> = {
  manager: Role.MANAGER,
  mgr: Role.MANAGER,
  "main admin": Role.MAIN_ADMIN,
  mainadmin: Role.MAIN_ADMIN,
  main_admin: Role.MAIN_ADMIN,
  admin: Role.MAIN_ADMIN,
  main: Role.MAIN_ADMIN,
  supervisor: Role.SUPERVISOR,
  sup: Role.SUPERVISOR,
};

/** Maps typed or selected role text to a stored staff role enum value. */
export function normalizeStaffRoleInput(raw: string): CompanyStaffRole | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase().replace(/[\s-]+/g, "_");
  if ((COMPANY_STAFF_ROLES as readonly string[]).includes(upper)) {
    return upper as CompanyStaffRole;
  }

  const aliasKey = trimmed.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return ALIAS_TO_ROLE[aliasKey] ?? null;
}

export function staffRoleInputError(raw: string): string {
  return `"${raw.trim()}" is not a valid role. Use Manager, Main admin, or Supervisor.`;
}

export function staffRoleDisplayLabel(role: string): string {
  if (role === Role.MAIN_ADMIN) return "Main admin";
  if (role === Role.MANAGER) return "Manager";
  if (role === Role.SUPERVISOR) return "Supervisor";
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
