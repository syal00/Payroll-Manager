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
  Search,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DEFAULT_BRAND_NAME } from "@/lib/brand";
import { useState, type ReactNode, useMemo } from "react";

function employeeInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const brand = (process.env.NEXT_PUBLIC_COMPANY_NAME ?? DEFAULT_BRAND_NAME).toUpperCase();

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

  const initials = useMemo(() => employeeInitials(displayName) || "E", [displayName]);

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
              <span className="nav-icon-wrap">
                <Icon className="nav-icon" aria-hidden strokeWidth={2} />
              </span>
              <span className="sidebar-item-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  const sidebarFooter = (
    <div className="sidebar-footer employee-sidebar-footer">
      <div className="sidebar-footer-user">
        <span className="sidebar-footer-avatar" aria-hidden>
          {initials}
        </span>
        <div className="sidebar-footer-text min-w-0 flex-1">
          <p className="sidebar-footer-name">{displayName}</p>
          <p className="sidebar-footer-role">Employee portal</p>
        </div>
      </div>
      <Link
        href="/employee-access"
        className="employee-switch-link"
        onClick={() => setOpen(false)}
      >
        <Users className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
        <span>Switch employee</span>
      </Link>
    </div>
  );

  return (
    <div className="root-layout employee-portal">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo min-w-0 flex-1">
            <BrandLogo
              size={38}
              showText={false}
              wrapperClassName="shrink-0"
              imageClassName="brand-logo-img sidebar-logo-img"
            />
            <div className="min-w-0">
              <div className="sidebar-logo-text leading-tight">{brand}</div>
              <div className="sidebar-brand-sub mt-0.5">My Dashboard</div>
            </div>
          </div>
        </div>
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">{navContent}</div>
        {sidebarFooter}
      </aside>

      <div className="main-wrapper">
        <header className="topbar flex md:hidden">
          <div className="topbar-left min-w-0">
            <span className="topbar-greeting topbar-greeting-mobile truncate text-sm font-semibold">{brand}</span>
            <span className="topbar-date truncate text-xs text-[var(--color-text-muted)]">{displayName}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
            type="button"
            className="icon-btn border-0"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>
          </div>
        </header>

        <header className="topbar topbar-slim hidden md:flex lg:hidden">
          <div className="topbar-left min-w-0 flex-1">
            <span className="topbar-greeting truncate text-sm font-semibold">
              {greetingPhrase}, {displayName.split(/\s+/)[0] ?? displayName}
            </span>
          </div>
          <div className="topbar-right">
            <ThemeToggle />
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
          <div className="topbar-right">
            <ThemeToggle />
          </div>
        </header>

        {open ? (
          <div className="mobile-shell-drawer md:hidden" role="dialog" aria-modal="true">
            <button type="button" className="mobile-shell-drawer-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
            <aside className="mobile-shell-drawer-panel sidebar flex flex-col">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
                <div className="flex min-w-0 items-center gap-2">
                  <BrandLogo
                    size={36}
                    showText={false}
                    wrapperClassName="shrink-0"
                    imageClassName="brand-logo-img sidebar-logo-img"
                  />
                  <span className="truncate font-display text-[15px] font-extrabold uppercase tracking-[1.4px] text-[var(--color-sidebar-text)]">
                    {brand}
                  </span>
                </div>
                <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{navContent}</div>
              {sidebarFooter}
            </aside>
          </div>
        ) : null}

        <main className="page-content page-body">{children}</main>
      </div>
    </div>
  );
}
