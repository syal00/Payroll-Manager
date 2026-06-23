"use client";

import { Menu, Bell, Search } from "lucide-react";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
type TopbarProps = {
  onToggleSidebar: () => void;
  userName: string;
  userEmail?: string;
  pageTitle: string;
  onLogout: () => void;
};

export function Topbar({ onToggleSidebar, userName, userEmail, pageTitle, onLogout }: TopbarProps) {
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

        <div className="topbar-search" role="search">
          <Search className="topbar-search-icon" aria-hidden strokeWidth={2} />
          <input type="search" readOnly placeholder="Search payroll, employees…" tabIndex={-1} aria-label="Search" />
        </div>

        <div className="topbar-right">
          <ThemeToggle />
          <button type="button" className="topbar-action-btn" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <UserMenu userName={userName} emailHint={userEmail} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
