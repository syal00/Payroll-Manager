import { Role } from "@/lib/enums";

/** Legacy JWT/DB value before migration; treated like MAIN_ADMIN. */
const LEGACY_ADMIN = "ADMIN";

export function isStaffRole(role: string): boolean {
  return role === Role.MAIN_ADMIN || role === Role.MANAGER || role === LEGACY_ADMIN;
}

export function isMainAdminRole(role: string): boolean {
  return role === Role.MAIN_ADMIN || role === LEGACY_ADMIN;
}

export function isManagerRole(role: string): boolean {
  return role === Role.MANAGER;
}
