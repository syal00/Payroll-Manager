/** Company identity shown in admin shell when viewing a specific tenant. */
export type TenantBranding = {
  name: string;
  logoUrl: string | null;
};

export function tenantInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
