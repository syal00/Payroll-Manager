"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock3, FileText, Receipt } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { PayPeriodStatusBadge, TimesheetStatusBadge } from "@/components/status-badges";
import { formatDateTime, formatPayPeriodLabel, money, shortDate } from "@/lib/format";
import { formatAuditAction, formatAuditActorName, formatAuditDetails, shortenEntityId } from "@/lib/audit-log-scope";

type PeriodDetail = {
  period: {
    id: string;
    name: string | null;
    startDate: string;
    endDate: string;
    status: string;
    isCurrent: boolean;
  };
  summary: {
    timesheetCount: number;
    payslipCount: number;
    totalHours: number;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    timesheetsByStatus: Record<string, number>;
  };
  timesheets: {
    id: string;
    status: string;
    totalHours: number;
    submittedAt: string | null;
    employee: { id: string; name: string; employeeCode: string };
    payslip: { id: string; payslipNumber: string; netPay: number } | null;
  }[];
  payslips: {
    id: string;
    payslipNumber: string;
    grossPay: number;
    netPay: number;
    totalDeductions: number;
    regularHours: number;
    overtimeHours: number;
    markedSentAt: string | null;
    emailSentAt: string | null;
    createdAt: string;
    employee: { id: string; name: string; employeeCode: string };
  }[];
  auditLogs: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    details: string | null;
    createdAt: string;
    actor: { name: string; contactEmail: string } | null;
  }[];
};

export default function PayPeriodHistoryDetailPage() {
  const params = useParams();
  const payPeriodId = params.payPeriodId as string;
  const [data, setData] = useState<PeriodDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!payPeriodId) return;
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/history/pay-periods/${payPeriodId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setErr(j.error ?? "Could not load period history");
          setData(null);
          return;
        }
        setData(j);
      })
      .catch(() => {
        setErr("Network error");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [payPeriodId]);

  if (loading) {
    return (
      <div className="page-container max-w-6xl">
        <p className="text-sm text-[var(--color-text-muted)]">Loading period history…</p>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="page-container max-w-6xl space-y-4">
        <Link href="/admin/history" className="link-accent inline-flex items-center gap-1 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to history
        </Link>
        <div className="alert-error text-sm">{err ?? "Pay period not found"}</div>
      </div>
    );
  }

  const { period, summary, timesheets, payslips, auditLogs } = data;
  const label = formatPayPeriodLabel(period);

  return (
    <div className="page-container max-w-6xl space-y-8">
      <Link href="/admin/history" className="link-accent inline-flex items-center gap-1 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All pay periods
      </Link>

      <PageHeader
        eyebrow="Pay period history"
        title={label}
        description="Timesheets, payslips, and activity for this pay period. Managers only see employees in their scope."
      >
        <div className="flex flex-wrap items-center gap-2">
          <PayPeriodStatusBadge status={period.status} />
          {period.isCurrent ? (
            <span className="rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent-light)]">
              Current
            </span>
          ) : null}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-4">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Clock3 className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Timesheets</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{summary.timesheetCount}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{summary.totalHours.toFixed(1)} total hours</p>
        </Card>
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-4">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Receipt className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Payslips</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{summary.payslipCount}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {summary.timesheetsByStatus.APPROVED ?? 0} approved timesheets
          </p>
        </Card>
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Gross pay</p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{money(summary.totalGross)}</p>
        </Card>
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Net pay</p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-accent-light)]">{money(summary.totalNet)}</p>
          {summary.totalDeductions > 0 ? (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Deductions {money(summary.totalDeductions)}</p>
          ) : null}
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
        <div className="border-b border-[var(--color-border)] px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
            <Receipt className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
            Payslips
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[720px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Number</th>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Hours</th>
                <th className="px-4 py-3.5">Gross</th>
                <th className="px-4 py-3.5">Net</th>
                <th className="px-4 py-3.5">Sent</th>
                <th className="px-4 py-3.5 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                    No payslips for this period.
                  </td>
                </tr>
              ) : (
                payslips.map((p) => (
                  <tr key={p.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5 font-mono text-sm text-[var(--color-text-secondary)]">{p.payslipNumber}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-[var(--color-text-primary)]">{p.employee.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-text-muted)]">
                        {p.employee.employeeCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm tabular-nums text-[var(--color-text-secondary)]">
                      {p.regularHours}h reg · {p.overtimeHours}h OT
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-sm text-[var(--color-text-secondary)]">
                      {money(p.grossPay)}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-[var(--color-text-primary)]">
                      {money(p.netPay)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {p.emailSentAt ? shortDate(p.emailSentAt) : p.markedSentAt ? shortDate(p.markedSentAt) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/payslips/${p.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-[var(--color-accent-tint)] px-3 text-sm font-semibold text-[var(--color-accent-light)] transition hover:bg-[var(--color-accent)] hover:text-white"
                      >
                        <FileText className="h-4 w-4" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
        <div className="border-b border-[var(--color-border)] px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
            <Clock3 className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
            Timesheets
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[640px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Hours</th>
                <th className="px-4 py-3.5">Submitted</th>
                <th className="px-4 py-3.5">Payslip</th>
                <th className="px-4 py-3.5 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                    No timesheets for this period.
                  </td>
                </tr>
              ) : (
                timesheets.map((t) => (
                  <tr key={t.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-[var(--color-text-primary)]">{t.employee.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-text-muted)]">
                        {t.employee.employeeCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <TimesheetStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-sm text-[var(--color-text-secondary)]">
                      {t.totalHours}h
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {t.submittedAt ? shortDate(t.submittedAt) : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--color-text-secondary)]">
                      {t.payslip?.payslipNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/timesheets/${t.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-accent-light)] transition hover:bg-[var(--color-accent-soft)]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {auditLogs.length > 0 ? (
        <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
          <div className="border-b border-[var(--color-border)] px-4 py-3.5">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Period activity</h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Recent audit entries for this pay period</p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {auditLogs.map((row) => {
              const details = formatAuditDetails(row.details);
              return (
                <div key={row.id} className="px-4 py-3.5 text-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent-light)]">
                      {row.action}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">{formatDateTime(row.createdAt)}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {formatAuditActorName(row.actor, row.action)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {formatAuditAction(row.action)} · {row.entityType}
                    {row.entityId ? (
                      <>
                        {" · "}
                        <span className="font-mono" title={row.entityId}>
                          {shortenEntityId(row.entityId)}
                        </span>
                      </>
                    ) : null}
                  </p>
                  {details ? (
                    <pre className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-2 font-mono text-[10px] leading-relaxed text-[var(--color-text-secondary)]">
                      {details}
                    </pre>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
