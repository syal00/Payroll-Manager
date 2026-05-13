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
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Search,
  Bell,
  ClipboardList,
  Inbox,
} from "lucide-react";
import { useState, type ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import type { AdminShellHeader } from "@/lib/admin-header";
import { resolveAdminPageTitle } from "@/lib/admin-nav";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { AdminMobileFab } from "@/components/dashboard/AdminMobileFab";

const allNavLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, mainAdminOnly: false },
  { href: "/admin/employees", label: "Employees", icon: Users, mainAdminOnly: false },
  { href: "/admin/timesheets", label: "Timesheets", icon: Clock3, mainAdminOnly: false },
  { href: "/admin/pay-periods", label: "Pay periods", icon: CalendarDays, mainAdminOnly: false },
  { href: "/admin/review", label: "Review", icon: ClipboardCheck, mainAdminOnly: false },
  { href: "/admin/payslips", label: "Payslips", icon: Receipt, mainAdminOnly: false },
  { href: "/admin/history", label: "History", icon: History, mainAdminOnly: false },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, mainAdminOnly: false },
  { href: "/admin/audit", label: "Audit log", icon: ClipboardList, mainAdminOnly: true },
  { href: "/admin/demo-requests", label: "Demo requests", icon: Inbox, mainAdminOnly: true },
  { href: "/admin/managers", label: "Managers", icon: UserCog, mainAdminOnly: true },
  { href: "/admin/profile", label: "Profile", icon: UserCircle, mainAdminOnly: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, mainAdminOnly: true },
] as const;

export function AdminShell({
  userName,
  userEmail,
  header,
  isMainAdmin = true,
  children,
}: {
  userName: string;
  userEmail?: string;
  header?: AdminShellHeader;
  /** Main Admin sees tenant-wide settings, audit, demo requests, manager assignment. Staff (including managers) share payroll workflows scoped to role. */
  isMainAdmin?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const brand = (process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Syal Operations Group").toUpperCase();
  const topBarOrg = (header?.organization ?? brand).toUpperCase();
  const topBarSubtitle = header?.roleTitle ?? "Admin Panel";
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

  const links = useMemo(
    () => allNavLinks.filter((l) => isMainAdmin || !l.mainAdminOnly),
    [isMainAdmin],
  );

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
              title={label}
              onClick={() => setOpen(false)}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon className="nav-icon" aria-hidden strokeWidth={2} />
              <span className="sidebar-item-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="root-layout">
      <aside className="sidebar relative hidden md:flex">
        <div className="relative z-10 w-full shrink-0">
          <div className="sidebar-logo-area">
            <div className="sidebar-logo-icon shrink-0" aria-hidden>
              <Zap className="h-[16px] w-[16px] text-white" strokeWidth={2.5} fill="white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="sidebar-logo-text leading-tight">{brand}</div>
              <div className="sidebar-brand-sub mt-1 text-[11px] font-medium leading-snug text-[var(--color-text-muted)]">
                {topBarSubtitle}
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col px-0">{navContent}</div>
        <div className="relative z-10 mt-auto flex w-full flex-col gap-1 border-t border-white/[0.06] px-3 py-3">
          <p className="sidebar-user-name truncate px-1 text-[12px] font-semibold text-[var(--color-sidebar-text-active)]">
            {userName}
          </p>
          <button
            type="button"
            className="sidebar-item border-0 bg-transparent text-left !text-[var(--color-sidebar-text)] hover:!text-white"
            onClick={() => {
              void logout();
            }}
          >
            <LogOut className="nav-icon" aria-hidden strokeWidth={2} />
            <span className="sidebar-item-label">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar flex md:hidden">
          <div className="topbar-left min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] max-md:hidden">
              {topBarOrg}
            </span>
            <span className="topbar-greeting topbar-greeting-mobile truncate text-base">{pageTitle}</span>
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

        <header className="topbar topbar-slim hidden md:flex lg:hidden">
          <div className="topbar-left min-w-0 flex-1">
            <span className="topbar-greeting truncate text-sm font-semibold">{pageTitle}</span>
          </div>
        </header>

        <header className="topbar hidden lg:flex">
          <div className="topbar-left min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">{topBarOrg}</span>
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
              className="icon-btn hidden md:flex"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <UserMenu userName={userName} emailHint={userEmail} onLogout={() => void logout()} />
          </div>
        </header>

        {open ? (
          <div className="mobile-shell-drawer md:hidden" role="dialog" aria-modal="true">
            <button type="button" className="mobile-shell-drawer-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
            <aside className="mobile-shell-drawer-panel sidebar flex flex-col">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="sidebar-logo-icon !h-9 !w-9 shrink-0">
                    <Zap className="h-4 w-4 text-white" aria-hidden strokeWidth={2.5} fill="white" />
                  </div>
                  <span className="truncate font-display text-[15px] font-extrabold uppercase tracking-[1.4px] text-white">{brand}</span>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-0">{navContent}</div>
              <div className="border-t border-[var(--color-border)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{userName}</p>
                <Button
                  variant="ghost"
                  className="btn-ghost mt-2 !justify-start px-2 !text-[var(--color-text-secondary)] hover:!bg-[var(--color-accent-soft)] hover:!text-[var(--color-text-primary)]"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </aside>
          </div>
        ) : null}

        <AdminMobileFab />

        <main className="page-content page-body">{children}</main>
      </div>
    </div>
  );
}
