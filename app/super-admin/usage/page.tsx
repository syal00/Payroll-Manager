"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Database, FileText, Receipt, Users, Activity } from "lucide-react";

type UsageSummary = {
  companies: number;
  totalEmployees: number;
  totalTimesheets: number;
  totalPayslips: number;
  dbSizeMB: number;
  requestsLast30Days: number;
  requestsToday: number;
};

const NEON_FREE_STORAGE_MB = 500;
const VERCEL_HOBBY_REQUESTS_30D = 1_000_000;

function usageBarColor(pct: number): string {
  if (pct >= 80) return "bg-rose-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-emerald-500";
}

function UsageMeter({
  label,
  value,
  limit,
  unit,
  note,
}: {
  label: string;
  value: number;
  limit: number;
  unit: string;
  note: string;
}) {
  const pct = limit > 0 ? Math.min(100, (value / limit) * 100) : 0;
  const displayValue = unit === "MB" ? value.toFixed(2) : value.toLocaleString();
  const displayLimit = limit.toLocaleString();

  return (
    <div className="dash-stat-card !items-start !p-5">
      <p className="text-sm font-semibold text-[var(--elite-heading)]">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--elite-heading)]">
        {displayValue}
        <span className="ml-1 text-sm font-normal text-[var(--text-muted)]">/ {displayLimit} {unit}</span>
      </p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--elite-border)]">
        <div
          className={`h-full rounded-full transition-all ${usageBarColor(pct)}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{Math.round(pct)}% of approximate free-tier reference</p>
      <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">{note}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="dash-stat-card !items-start !p-5">
      <span className="dash-stat-icon dash-stat-icon--primary" aria-hidden>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="mt-3 text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--elite-heading)]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function SuperAdminUsagePage() {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/super-admin/usage")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) {
          setErr(j.error);
          return;
        }
        setData(j);
      })
      .catch(() => !cancelled && setErr("Failed to load usage data"));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/super-admin/companies"
            className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--elite-heading)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to companies
          </Link>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-[var(--elite-heading)]">
            Platform usage
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            Approximate resource usage against free-tier reference limits. Check Vercel and Neon
            dashboards for exact billing figures.
          </p>
        </div>
      </div>

      {err ? (
        <div className="alert-error max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm">
          {err}
        </div>
      ) : null}

      {!data && !err ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card min-h-[140px] rounded-xl" />
          ))}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <UsageMeter
              label="Database storage (Neon Free reference)"
              value={data.dbSizeMB}
              limit={NEON_FREE_STORAGE_MB}
              unit="MB"
              note="Approximate — check Vercel and Neon dashboards for exact billing figures. Uses pg_database_size on your Postgres instance."
            />
            <UsageMeter
              label="API requests — last 30 days (Vercel Hobby reference)"
              value={data.requestsLast30Days}
              limit={VERCEL_HOBBY_REQUESTS_30D}
              unit="requests"
              note="Approximate — check Vercel and Neon dashboards for exact billing figures. Counts /api/* hits recorded in this app only."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Companies" value={data.companies} icon={Building2} />
            <StatCard label="Employees" value={data.totalEmployees} icon={Users} />
            <StatCard label="Timesheets" value={data.totalTimesheets} icon={FileText} />
            <StatCard label="Payslips" value={data.totalPayslips} icon={Receipt} />
            <StatCard label="Requests today" value={data.requestsToday} icon={Activity} />
          </div>

          <div className="rounded-xl border border-[var(--elite-border)] bg-[var(--elite-surface)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--elite-heading)]">Official usage dashboards</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              These links open the provider consoles where exact limits and billing are shown.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-[var(--elite-border)] px-4 py-2 text-sm font-semibold text-[var(--elite-accent)] hover:bg-[var(--elite-accent-soft)]"
              >
                Vercel dashboard →
              </a>
              <a
                href="https://console.neon.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-[var(--elite-border)] px-4 py-2 text-sm font-semibold text-[var(--elite-accent)] hover:bg-[var(--elite-accent-soft)]"
              >
                Neon console →
              </a>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
