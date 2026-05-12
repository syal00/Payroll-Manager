/**
 * Sidebar / title metadata for admin UI only (no auth or business logic).
 */
export function resolveAdminPageTitle(pathname: string): string {
  const path = pathname.split("?")[0] ?? pathname;
  const segments = path.split("/").filter(Boolean);

  if (segments[0] === "admin") {
    if (segments.length >= 3 && segments[1] === "employees") return "Employee detail";
    if (segments.length >= 3 && segments[1] === "timesheets") return "Timesheet detail";
    if (segments.length >= 3 && segments[1] === "payslips") return "Payslip detail";
  }

  const map = new Map<string, string>([
    ["/admin/settings", "Settings"],
    ["/admin/profile", "Profile"],
    ["/admin/reports", "Reports"],
    ["/admin/history", "History"],
    ["/admin/payslips", "Payslips"],
    ["/admin/review", "Review"],
    ["/admin/pay-periods", "Pay periods"],
    ["/admin/timesheets", "Timesheets"],
    ["/admin/employees", "Employees"],
    ["/admin", "Dashboard"],
  ]);

  let best = "Dashboard";
  let bestLen = 0;
  for (const [prefix, title] of map.entries()) {
    if (path === prefix || (prefix !== "/admin" && path.startsWith(prefix + "/"))) {
      if (prefix.length >= bestLen) {
        bestLen = prefix.length;
        best = title;
      }
    }
  }
  return best;
}
