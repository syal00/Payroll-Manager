"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AdminShellHeader } from "@/lib/admin-header";
import { resolveAdminPageTitle } from "@/lib/admin-nav";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AdminMobileFab } from "@/components/dashboard/AdminMobileFab";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

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
  isMainAdmin?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const userRole = header?.roleTitle ?? "Admin Panel";
  const pageTitle = resolveAdminPageTitle(pathname);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function toggleSidebar() {
    if (window.matchMedia("(max-width: 1199px)").matches) {
      setMobileOpen((o) => !o);
      return;
    }
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  const layoutClass = [
    "root-layout",
    collapsed ? "sidebar-collapsed" : "",
    mobileOpen ? "sidebar-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClass}>
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        userName={userName}
        userRole={userRole}
        isMainAdmin={isMainAdmin}
        onLogout={() => void logout()}
      />

      <div className="main-wrapper">
        <Topbar
          onToggleSidebar={toggleSidebar}
          userName={userName}
          userEmail={userEmail}
          pageTitle={pageTitle}
          onLogout={() => void logout()}
        />

        <AdminMobileFab />

        <main className="page-content page-body page-dashboard">{children}</main>
      </div>
    </div>
  );
}
