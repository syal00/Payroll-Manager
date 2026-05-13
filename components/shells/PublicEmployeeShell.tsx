"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  History,
  FileText,
  User,
  Users,
  Menu,
  X,
  Zap,
  Search,
} from "lucide-react";
import { useState, type ReactNode, useMemo } from "react";

export function PublicEmployeeShell({
  employeeId,
  displayName,
  children,
}: {
  employeeId: string;
  displayName: string;
  children: ReactNode;
}) {
  const base = `/employee/${employeeId}`;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const brand = (process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Syal Operations Group").toUpperCase();

  const greetingPhrase = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const links = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/timesheet`, label: "My timesheet", icon: Clock },
    { href: `${base}/history`, label: "History", icon: History },
    { href: `${base}/payslips`, label: "Payslips", icon: FileText },
    { href: `${base}/profile`, label: "Profile", icon: User },
  ];

  const navContent = (
    <>
      <p className="sidebar-section-label">Workspace</p>
      <nav className="sidebar-nav flex flex-1 flex-col gap-0" aria-label="Employee">
        {links.map(({ href, label, icon: Icon }) => {
          let isActive = false;
          if (label === "Dashboard") isActive = pathname === href;
          else if (label === "My timesheet") isActive = pathname.startsWith(`${base}/timesheet`);
          else isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              onClick={() => setOpen(false)}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon className="nav-icon" aria-hidden />
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
                My Dashboard
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col px-0">{navContent}</div>
        <div className="relative z-10 mt-auto flex w-full flex-col gap-1 border-t border-[var(--color-border)] px-3 py-3">
          <p className="sidebar-user-name truncate px-1 text-[13px] font-semibold text-[var(--color-text-primary)]">
            {displayName}
          </p>
          <Link
            href="/employee-access"
            className="sidebar-item border-0 bg-transparent"
            onClick={() => setOpen(false)}
          >
            <Users className="nav-icon" aria-hidden />
            <span className="sidebar-item-label">Switch employee</span>
          </Link>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar flex md:hidden">
          <div className="topbar-left min-w-0">
            <span className="topbar-greeting topbar-greeting-mobile truncate text-sm font-semibold">{brand}</span>
            <span className="topbar-date truncate text-xs text-[var(--color-text-muted)]">{displayName}</span>
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
            <span className="topbar-greeting truncate text-sm font-semibold">
              {greetingPhrase}, {displayName.split(/\s+/)[0] ?? displayName}
            </span>
          </div>
        </header>

        <header className="topbar hidden lg:flex">
          <div className="topbar-left min-w-0">
            <span className="topbar-greeting truncate">
              {greetingPhrase}, {displayName.split(/\s+/)[0] ?? displayName}
            </span>
            <span className="topbar-date">{formattedDate}</span>
          </div>
          <div className="topbar-search" role="search">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
            <input type="search" readOnly placeholder="Search…" tabIndex={-1} aria-label="Search placeholder" />
          </div>
          <div className="topbar-right" />
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
                  <span className="truncate font-display text-[15px] font-extrabold uppercase tracking-[1.4px] text-white">
                    {brand}
                  </span>
                </div>
                <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-0">{navContent}</div>
              <div className="border-t border-[var(--color-border)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{displayName}</p>
                <Link
                  href="/employee-access"
                  className="sidebar-item mt-2 border-0 bg-transparent px-2"
                  onClick={() => setOpen(false)}
                >
                  <Users className="nav-icon" aria-hidden />
                  <span className="sidebar-item-label">Switch employee</span>
                </Link>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="page-content page-body">{children}</main>
      </div>
    </div>
  );
}
