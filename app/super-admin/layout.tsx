import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isSuperAdminRole } from "@/lib/roles";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SuperAdminSignOutButton } from "@/components/shells/SuperAdminSignOutButton";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Defense in depth — proxy.ts already gates /super-admin/:path* to SUPER_ADMIN only.
  if (!session || !isSuperAdminRole(session.role)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--elite-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--elite-border)] bg-[var(--elite-surface)] px-6 py-3">
        <Link href="/super-admin/companies" className="flex items-center gap-3">
          <BrandLogo
            href={null}
            size={36}
            nameLine1="Syal"
            nameLine2="Operations"
            wrapperClassName="login-brand-logo-row"
            imageClassName="brand-logo-img login-brand-logo-img"
            textWrapperClassName="login-brand-logo-text"
            nameClassName="login-brand-logo-name"
            tagClassName="login-brand-logo-tag"
          />
          <div className="hidden sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Super Admin
            </p>
            <p className="text-xs text-[var(--text-muted)]">WorkLedger platform</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-4 sm:flex" aria-label="Super admin">
            <Link
              href="/super-admin/companies"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--elite-heading)]"
            >
              Companies
            </Link>
            <Link
              href="/super-admin/usage"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--elite-heading)]"
            >
              Usage
            </Link>
          </nav>
          <SuperAdminSignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
