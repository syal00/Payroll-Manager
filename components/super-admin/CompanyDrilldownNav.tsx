"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
} from "lucide-react";

const TABS = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "employees", label: "Employees", icon: Users },
  { href: "timesheets", label: "Timesheets", icon: ClipboardList },
  { href: "payslips", label: "Payslips", icon: FileText },
] as const;

export function CompanyDrilldownNav({ companyId }: { companyId: string }) {
  const pathname = usePathname();
  const base = `/super-admin/companies/${companyId}`;

  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-[var(--sa-border)] px-1"
      aria-label="Company sections"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const path = `${base}/${href}`;
        const active = pathname === path || pathname.startsWith(`${path}/`);
        return (
          <Link
            key={href}
            href={path}
            className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "border border-b-0 border-[var(--sa-border)] bg-[var(--sa-surface)] text-[var(--sa-accent)]"
                : "text-[var(--sa-muted)] hover:text-[var(--sa-heading)]"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
      <Link
        href="/admin"
        className="ml-auto inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold text-[var(--sa-accent)] transition hover:bg-[var(--sa-surface)]"
      >
        <Settings className="h-4 w-4" aria-hidden />
        Admin console
      </Link>
    </nav>
  );
}
