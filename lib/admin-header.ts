export type AdminShellHeader = {
  /** Small caps line (e.g. organization) */
  organization: string;
  /** Main title (e.g. job role) */
  roleTitle: string;
};

/**
 * Optional per-admin branding for the sidebar / mobile header.
 */
export function getAdminHeaderForEmail(email: string): AdminShellHeader | null {
  const e = email.trim().toLowerCase();
  if (e === "anmolchahal871@gmail.com") {
    return {
      organization: "Unison Security",
      roleTitle: "Operational Manager",
    };
  }
  return null;
}
