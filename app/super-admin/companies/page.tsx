"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, UserCog, ClipboardClock } from "lucide-react";

type CompanyCard = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  employeeCount: number;
  managerCount: number;
  timesheetPendingCount: number;
};

export default function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyCard[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/super-admin/companies")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) {
          setErr(j.error);
          return;
        }
        setCompanies(j.companies);
      })
      .catch(() => !cancelled && setErr("Failed to load companies"));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-container space-y-6">
      <div className="rounded-xl border border-[var(--elite-border)] bg-[var(--elite-surface)] px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--elite-accent)]">
          Platform overview
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--elite-heading)]">
          All companies
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
          WorkLedger — timesheets, approvals, and payslips for your team. Select a company to view
          its dashboard. Aggregate counts only — no mixed row data.
        </p>
      </div>

      {err ? (
        <div className="alert-error max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm">
          {err}
        </div>
      ) : null}

      {!companies && !err ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card min-h-[160px] rounded-xl" />
          ))}
        </div>
      ) : null}

      {companies ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/super-admin/companies/${c.id}/dashboard`}
              className="dash-stat-card group flex flex-col gap-4 !items-start"
            >
              <div className="flex items-center gap-3">
                {c.logoUrl ? (
                  // Tenant-supplied URL, not run through next/image (arbitrary host, not allow-listed).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt="" width={40} height={40} className="rounded-lg object-contain" />
                ) : (
                  <span className="dash-stat-icon dash-stat-icon--primary" aria-hidden>
                    <Building2 className="h-5 w-5" strokeWidth={2} />
                  </span>
                )}
                <div>
                  <p className="font-semibold text-[var(--elite-heading)]">{c.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.slug}</p>
                </div>
              </div>
              <div className="flex w-full items-center justify-between text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden /> {c.employeeCount}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserCog className="h-4 w-4" aria-hidden /> {c.managerCount}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 ${c.timesheetPendingCount > 0 ? "text-[var(--elite-warning)] font-semibold" : ""}`}
                >
                  <ClipboardClock className="h-4 w-4" aria-hidden /> {c.timesheetPendingCount}
                </span>
              </div>
            </Link>
          ))}
          {companies.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No companies yet.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
