/** Human-readable role label for email copy (matches account role enums). */
export function staffRoleLabel(role: string): string {
  switch (role) {
    case "MAIN_ADMIN":
      return "main admin";
    case "MANAGER":
      return "manager";
    case "SUPERVISOR":
      return "supervisor";
    case "EMPLOYEE":
      return "employee";
    default:
      return role.toLowerCase().replace(/_/g, " ");
  }
}
