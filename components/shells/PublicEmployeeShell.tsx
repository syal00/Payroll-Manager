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
} from "lucide-react";
import { useState, type ReactNode } from "react";

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
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Payroll Manager";

  const links = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/timesheet`, label: "My timesheet", icon: Clock },
    { href: `${base}/history`, label: "History", icon: History },
    { href: `${base}/payslips`, label: "Payslips", icon: FileText },
    { href: `${base}/profile`, label: "Profile", icon: User },
  ];

  const navContent = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Employee">
      {links.map(({ href, label, icon: Icon }) => {
        let isActive = false;
        if (label === "Dashboard") isActive = pathname === href;
        else if (label === "My timesheet") isActive = pathname.startsWith(`${base}/timesheet`);
        else isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-indigo-600/35 to-violet-600/25 text-white shadow-[0_0_24px_-8px_rgba(99,102,241,0.5)] ring-1 ring-indigo-400/30"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-200" : "opacity-80"}`} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#05020c]">
      <aside className="relative hidden w-60 shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#0c0618] via-[#0f0a24] to-[#08051a] lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(99,102,241,0.1),transparent)]"
          aria-hidden
        />
        <div className="relative border-b border-white/10 px-5 py-7">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-indigo-400/80">{brand}</p>
          <p className="mt-1.5 text-lg font-semibold text-white">Employee</p>
        </div>
        <div className="relative flex flex-1 flex-col px-3 py-5">{navContent}</div>
        <div className="relative border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-slate-200">{displayName}</p>
          <Link
            href="/employee-access"
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Switch employee
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.08] bg-[#0a0618]/90 px-4 py-3.5 shadow-lg shadow-black/20 backdrop-blur-xl lg:hidden">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-indigo-400/90">{brand}</p>
            <p className="line-clamp-1 font-semibold text-white">{displayName}</p>
          </div>
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {open && (
          <div
            className="fixed inset-0 z-30 bg-[#0a0618]/98 backdrop-blur-md lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-full flex-col px-4 py-4">
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              {navContent}
              <div className="mt-auto border-t border-white/10 pt-4">
                <p className="text-sm text-slate-200">{displayName}</p>
                <Link
                  href="/employee-access"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  Switch employee
                </Link>
              </div>
            </div>
          </div>
        )}

        <main className="app-main-gradient flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
