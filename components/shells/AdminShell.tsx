"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  ClipboardCheck,
  FileText,
  ScrollText,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { AdminShellHeader } from "@/lib/admin-header";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/pay-periods", label: "Pay periods", icon: CalendarRange },
  { href: "/admin/review", label: "Timesheets", icon: ClipboardCheck },
  { href: "/admin/payslips", label: "Payslips", icon: FileText },
  { href: "/admin/history", label: "Audit & history", icon: ScrollText },
  { href: "/admin/profile", label: "Profile", icon: User },
];

export function AdminShell({
  userName,
  header,
  children,
}: {
  userName: string;
  header?: AdminShellHeader;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const navContent = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Admin">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-violet-600/35 to-indigo-600/25 text-white shadow-[0_0_24px_-8px_rgba(139,92,246,0.55)] ring-1 ring-violet-400/30"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-violet-200" : "opacity-80"}`} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Payroll Manager";

  return (
    <div className="flex min-h-screen bg-[#05020c]">
      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#0c0618] via-[#10082a] to-[#08051a] lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(139,92,246,0.12),transparent)]"
          aria-hidden
        />
        <div className="relative border-b border-white/10 px-5 py-7">
          {header ? (
            <>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
                {header.organization}
              </p>
              <p className="mt-1.5 text-lg font-semibold leading-snug text-white">{header.roleTitle}</p>
            </>
          ) : (
            <>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
                {brand}
              </p>
              <p className="mt-1.5 text-lg font-semibold text-white">Administration</p>
            </>
          )}
        </div>
        <div className="relative flex flex-1 flex-col px-3 py-5">{navContent}</div>
        <div className="relative border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-slate-200">{userName}</p>
          <Button
            variant="ghost"
            className="mt-2 h-9 w-full justify-start rounded-lg px-2 text-slate-400 hover:text-white"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.08] bg-[#0a0618]/90 px-4 py-3.5 shadow-lg shadow-black/20 backdrop-blur-xl lg:hidden">
          <div className="min-w-0">
            {header ? (
              <>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-violet-400/90">
                  {header.organization}
                </p>
                <p className="truncate font-semibold text-white">{header.roleTitle}</p>
              </>
            ) : (
              <>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-violet-400/90">
                  {brand}
                </p>
                <p className="font-semibold text-white">Admin</p>
              </>
            )}
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
                <p className="text-sm text-slate-200">{userName}</p>
                <Button
                  variant="ghost"
                  className="mt-2 h-9 text-slate-400 hover:text-white"
                  onClick={logout}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="app-main-gradient flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
