"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

function fabTarget(pathname: string): { href: string; label: string } {
  if (pathname.includes("/admin/payslips")) {
    return { href: "/admin/timesheets", label: "Go to timesheets" };
  }
  if (pathname.startsWith("/admin/timesheets")) {
    return { href: "/admin/timesheets", label: "Timesheets" };
  }
  return { href: "/admin/employees", label: "Employees" };
}

export function AdminMobileFab() {
  const pathname = usePathname();
  const { href, label } = fabTarget(pathname);
  return (
    <Link href={href} className="admin-mobile-fab" aria-label={label} title={label}>
      <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
    </Link>
  );
}
