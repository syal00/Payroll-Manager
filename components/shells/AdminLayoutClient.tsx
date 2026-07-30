"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/shells/AdminShell";
import type { AdminShellHeader } from "@/lib/admin-header";

export function AdminLayoutClient({
  userName,
  userEmail,
  header,
  isMainAdmin,
  superAdminActing,
  children,
}: {
  userName: string;
  userEmail?: string;
  header?: AdminShellHeader;
  isMainAdmin: boolean;
  superAdminActing?: { companyId: string; companyName: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <AdminShell
      userName={userName}
      userEmail={userEmail}
      header={header ?? undefined}
      isMainAdmin={isMainAdmin}
      superAdminActing={superAdminActing}
    >
      {children}
    </AdminShell>
  );
}
