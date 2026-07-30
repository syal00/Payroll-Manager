import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isSuperAdminRole } from "@/lib/roles";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SuperAdminSignOutButton } from "@/components/shells/SuperAdminSignOutButton";
import { APP_NAME } from "@/lib/brand";
import "@/components/super-admin/super-admin.css";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || !isSuperAdminRole(session.role)) {
    redirect("/login");
  }

  return (
    <div className="super-admin-root">
      <header className="flex items-center justify-between border-b border-[var(--sa-border)] bg-[var(--sa-surface)] px-6 py-3">
        <Link href="/super-admin/companies" className="flex items-center gap-3">
          <BrandLogo
            href={null}
            size={36}
            showTag={false}
            nameLine1={APP_NAME}
            wrapperClassName="login-brand-logo-row"
            imageClassName="brand-logo-img login-brand-logo-img"
            textWrapperClassName="login-brand-logo-text"
            nameClassName="login-brand-logo-name !text-[var(--sa-heading)]"
            tagClassName="login-brand-logo-tag !text-[var(--sa-muted)]"
          />
          <div className="hidden sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sa-accent)]">
              Platform operator
            </p>
            <p className="text-xs text-[var(--sa-muted)]">PayRun · invisible to tenants</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-4 sm:flex" aria-label="Super admin">
            <Link
              href="/super-admin/companies"
              className="text-sm font-medium text-[var(--sa-muted)] hover:text-[var(--sa-heading)]"
            >
              Companies
            </Link>
            <Link
              href="/super-admin/usage"
              className="text-sm font-medium text-[var(--sa-muted)] hover:text-[var(--sa-heading)]"
            >
              Usage
            </Link>
          </nav>
          <span className="hidden text-xs text-[var(--sa-muted)] md:inline font-mono">{session.username}</span>
          <SuperAdminSignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
