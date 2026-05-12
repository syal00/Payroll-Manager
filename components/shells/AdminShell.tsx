"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock3,
  CalendarDays,
  ClipboardCheck,
  Receipt,
  History,
  BarChart3,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Search,
  Bell,
} from "lucide-react";
import { useState, type ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import type { AdminShellHeader } from "@/lib/admin-header";
import { resolveAdminPageTitle } from "@/lib/admin-nav";
import { UserMenu } from "@/components/dashboard/UserMenu";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/timesheets", label: "Timesheets", icon: Clock3 },
  { href: "/admin/pay-periods", label: "Pay periods", icon: CalendarDays },
  { href: "/admin/review", label: "Review", icon: ClipboardCheck },
  { href: "/admin/payslips", label: "Payslips", icon: Receipt },
  { href: "/admin/history", label: "History", icon: History },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/profile", label: "Profile", icon: UserCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  userName,
  userEmail,
  header,
  children,
}: {
  userName: string;
  userEmail?: string;
  header?: AdminShellHeader;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Payroll Manager";
  const topBarOrg = header?.organization ?? brand;
  const topBarSubtitle = header?.roleTitle ?? "Payroll Operations";
  const pageTitle = resolveAdminPageTitle(pathname);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const navContent = (
    <>
      <p className="sidebar-section-label">Workspace</p>
      <nav className="sidebar-nav flex flex-1 flex-col gap-0.5" aria-label="Admin">
        {links.map(({ href, label, icon: Icon }) => {
          const isRoot = href === "/admin";
          const isActive = isRoot ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon className="nav-icon" aria-hidden strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="root-layout">
      <aside className="sidebar relative hidden lg:flex">
        <div className="relative z-10 w-full shrink-0">
          <div className="sidebar-logo-area">
            <div className="sidebar-logo-icon shrink-0" aria-hidden>
              <Sparkles className="h-[18px] w-[18px] text-[var(--color-text-inverse)]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="sidebar-logo-text leading-tight">{brand}</div>
              <div className="mt-1 text-[11px] font-medium leading-snug text-[var(--color-sidebar-text)]">{topBarSubtitle}</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col px-0">{navContent}</div>
        <div className="relative z-10 mt-auto flex w-full flex-col gap-1 border-t border-white/[0.06] px-3 py-3">
          <p className="truncate px-1 text-[12px] font-semibold text-[var(--color-sidebar-text-active)]">{userName}</p>
          <button
            type="button"
            className="sidebar-item border-0 bg-transparent text-left !text-[var(--color-sidebar-text)] hover:!text-white"
            onClick={() => {
              void logout();
            }}
          >
            <LogOut className="nav-icon" aria-hidden strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar lg:hidden">
          <div className="topbar-left min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{topBarOrg}</span>
            <span className="topbar-greeting truncate text-base">{pageTitle}</span>
          </div>
          <button
            type="button"
            className="icon-btn border-0"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>
        </header>

        <header className="topbar !hidden lg:!flex">
          <div className="topbar-left min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{topBarOrg}</span>
            <span className="topbar-greeting truncate text-[17px]">{pageTitle}</span>
            <span className="topbar-date text-[11px] text-[var(--color-text-muted)]">{formattedDate}</span>
          </div>
          <div className="topbar-search mx-4 hidden max-w-md flex-1 xl:flex" role="search">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden strokeWidth={2} />
            <input type="search" readOnly placeholder="Search payroll, employees, periods…" tabIndex={-1} aria-label="Search (placeholder)" />
          </div>
          <div className="topbar-right ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="icon-btn hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm md:flex"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px] text-[var(--color-text-secondary)]" strokeWidth={2} />
            </button>
            <UserMenu userName={userName} emailHint={userEmail} onLogout={() => void logout()} />
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-[110] bg-[var(--color-sidebar-bg)] lg:hidden" role="dialog" aria-modal="true">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="sidebar-logo-icon !h-9 !w-9 shrink-0">
                    <Sparkles className="h-4 w-4 text-[var(--color-text-inverse)]" aria-hidden strokeWidth={2} />
                  </div>
                  <span className="truncate text-[15px] font-extrabold text-white">{brand}</span>
                </div>
                <button
                  type="button"
                  className="icon-btn border-white/15 bg-transparent text-white"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">{navContent}</div>
              <div className="border-t border-white/[0.06] px-4 py-4">
                <p className="text-sm font-semibold text-white">{userName}</p>
                <Button
                  variant="ghost"
                  className="btn-ghost mt-2 !justify-start px-2 !text-[var(--color-sidebar-text)] hover:!bg-white/10 hover:!text-white"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
