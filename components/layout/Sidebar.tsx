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
  X,
  ClipboardList,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export type SidebarNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  mainAdminOnly: boolean;
};

export const adminNavLinks: SidebarNavLink[] = [
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
];

type SidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userName: string;
  userRole: string;
  isMainAdmin?: boolean;
  onLogout: () => void;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  userName,
  userRole,
  isMainAdmin = true,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Syal Operations Group";
  const links = adminNavLinks.filter((l) => isMainAdmin || !l.mainAdminOnly);
  const initials = getInitials(userName);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside className="sidebar" aria-label="Sidebar navigation">
        <div className="sidebar-header">
          <BrandLogo
            size={38}
            showTag={false}
            nameLine1={brand}
            wrapperClassName="sidebar-logo"
            imageClassName="brand-logo-img sidebar-logo-img"
            textWrapperClassName="sidebar-footer-text min-w-0"
            nameClassName="sidebar-logo-text"
            tagClassName="sidebar-logo-text"
          />
          <button type="button" className="sidebar-close" aria-label="Close menu" onClick={onCloseMobile}>
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="sidebar-nav">
          <p className="sidebar-section-label">Main</p>
          {links.map(({ href, label, icon: Icon }) => {
            const isRoot = href === "/admin";
            const isActive = isRoot
              ? pathname === "/admin" || pathname === "/admin/dashboard"
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                onClick={onCloseMobile}
                className={`sidebar-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon-wrap">
                  <Icon className="nav-icon" aria-hidden strokeWidth={2} />
                </span>
                <span className="sidebar-item-label">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-user">
            <span className="sidebar-footer-avatar">{initials || "A"}</span>
            <div className="sidebar-footer-text min-w-0 flex-1">
              <p className="sidebar-footer-name">{userName}</p>
              <p className="sidebar-footer-role">{userRole}</p>
            </div>
            <div className="sidebar-footer-actions">
              <Link
                href="/admin/settings"
                title="Settings"
                onClick={onCloseMobile}
                className="sidebar-footer-action"
              >
                <Settings className="h-4 w-4" aria-hidden strokeWidth={2} />
              </Link>
              <button
                type="button"
                title="Sign out"
                className="sidebar-footer-action sidebar-footer-action--logout"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" aria-hidden strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
