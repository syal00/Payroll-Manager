"use client";

import { Menu, Bell } from "lucide-react";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { TopbarSearch } from "@/components/layout/TopbarSearch";

import type { TenantBranding } from "@/lib/tenant-branding";

type TopbarProps = {
  onToggleSidebar: () => void;
  userName: string;
  userEmail?: string;
  pageTitle: string;
  tenantBranding?: TenantBranding;
  onLogout: () => void;
};

export function Topbar({ onToggleSidebar, userName, userEmail, pageTitle, tenantBranding, onLogout }: TopbarProps) {
  return (
    <header className="topbar topbar-dashboard">
      <div className="topbar-inner">
        <button
          type="button"
          className="sidebar-toggle-btn"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>

        <p className="topbar-page-title md:hidden">{pageTitle}</p>

        <TopbarSearch />

        <div className="topbar-right">
          <ThemeToggle />
          <button type="button" className="topbar-action-btn" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <UserMenu
            userName={userName}
            emailHint={userEmail}
            tenantBranding={tenantBranding}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
}
