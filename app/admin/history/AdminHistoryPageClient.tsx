"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { PayPeriodStatusBadge } from "@/components/status-badges";
import { formatPayPeriodLabel, money } from "@/lib/format";
import { AdminAuditTrailPanel } from "@/components/history/AdminAuditTrailPanel";

type PeriodSummary = {
  id: string;
  name: string | null;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  timesheetCount: number;
  payslipCount: number;
  totalGross: number;
  totalNet: number;
  timesheetsByStatus: Record<string, number>;
};

type Tab = "periods" | "audit";

function AdminHistoryContent({ isMainAdmin }: { isMainAdmin: boolean }) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "audit" && isMainAdmin ? "audit" : "periods";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLoadErr(null);
    fetch("/api/admin/history/pay-periods")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setLoadErr(j.error ?? "Could not load pay period history");
          setPeriods([]);
          return;
        }
        setPeriods(j.periods ?? []);
      })
      .catch(() => {
        setLoadErr("Network error");
        setPeriods([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Compliance"
        title="History"
        description="Browse payroll records by pay period—timesheets, payslips, and disbursements—or search the full audit trail."
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 p-1">
        <button
          type="button"
          onClick={() => setTab("periods")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "periods"
              ? "bg-[var(--color-accent)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)]"
          }`}
        >
          Pay periods
        </button>
        {isMainAdmin ? (
          <button
            type="button"
            onClick={() => setTab("audit")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "audit"
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)]"
            }`}
          >
            Audit trail
          </button>
        ) : null}
      </div>

      {tab === "periods" ? (
        <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
          {loadErr && <div className="alert-error m-4 text-sm">{loadErr}</div>}
          {loading ? (
            <div className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">Loading pay periods…</div>
          ) : periods.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">
              <p className="font-medium text-[var(--color-text-primary)]">No pay periods yet</p>
              <p className="mt-1 text-xs">Create a pay period to start collecting timesheet and payslip history.</p>
              <Link href="/admin/pay-periods" className="link-accent mt-3 inline-block text-sm font-semibold">
                Go to pay periods
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {periods.map((p) => {
                const label = formatPayPeriodLabel(p);
                const approved = p.timesheetsByStatus.APPROVED ?? 0;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/admin/history/${p.id}`}
                      className="flex flex-col gap-3 px-4 py-4 transition hover:bg-[var(--color-accent-soft)]/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-accent)]" aria-hidden />
                          <span className="font-semibold text-[var(--color-text-primary)]">{label}</span>
                          <PayPeriodStatusBadge status={p.status} />
                          {p.isCurrent ? (
                            <span className="rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent-light)]">
                              Current
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                          <span>
                            {p.timesheetCount} timesheet{p.timesheetCount === 1 ? "" : "s"}
                            {p.timesheetCount > 0 ? ` · ${approved} approved` : ""}
                          </span>
                          <span>
                            {p.payslipCount} payslip{p.payslipCount === 1 ? "" : "s"}
                          </span>
                          {p.payslipCount > 0 ? (
                            <span className="font-medium text-[var(--color-text-secondary)]">
                              Net {money(p.totalNet)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent-light)]">
                        View details
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : (
        <AdminAuditTrailPanel />
      )}
    </div>
  );
}

export default function AdminHistoryPageClient({ isMainAdmin }: { isMainAdmin: boolean }) {
  return (
    <Suspense
      fallback={
        <div className="page-container max-w-5xl">
          <p className="text-sm text-[var(--color-text-muted)]">Loading history…</p>
        </div>
      }
    >
      <AdminHistoryContent isMainAdmin={isMainAdmin} />
    </Suspense>
  );
}
