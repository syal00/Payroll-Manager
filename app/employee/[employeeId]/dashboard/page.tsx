"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { Calendar, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { formatPayPeriodLabel, shortDate, money } from "@/lib/format";

type DashboardPayload = {
  employee: {
    id: string;
    name: string;
    username: string;
    contactEmail: string;
    employeeCode: string;
  };
  currentPeriod: { id: string; name: string | null; startDate: string; endDate: string } | null;
  counts: { pending: number; approved: number; rejected: number; draft: number };
  recentTimesheets: {
    id: string;
    status: string;
    totalHours: number;
    updatedAt: string;
    payPeriod: { id: string; name: string | null; startDate: string; endDate: string };
    payslip: { id: string } | null;
  }[];
  recentPayslips: {
    id: string;
    payslipNumber: string;
    netPay: number;
    payPeriod: { name: string | null; startDate: string; endDate: string };
  }[];
  notifications: { id: string; title: string; body: string; readAt: string | null; createdAt: string }[];
};

export default function PublicEmployeeDashboardPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const base = `/employee/${employeeId}`;
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/public/employees/${employeeId}/dashboard`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) {
          setErr(j.error);
          setData(null);
          return;
        }
        setErr(null);
        setData(j);
      })
      .catch(() => setErr("Failed to load dashboard"));
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  if (err) {
    return <div className="alert-error max-w-xl">{err}</div>;
  }
  if (!data) {
    return (
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-muted)] border-t-[var(--color-primary)]"
          aria-hidden
        />
        Loading your dashboard…
      </div>
    );
  }

  const emailLine =
    data.employee.username.toLowerCase() === data.employee.contactEmail.toLowerCase()
      ? data.employee.contactEmail
      : `${data.employee.username} · ${data.employee.contactEmail}`;

  return (
    <div className="page-container max-w-5xl space-y-8">
      <div className="page-header !mb-2">
        <div className="page-header-left">
          <p className="page-eyebrow">Hello</p>
          <h1 className="page-title mt-1">Welcome, {data.employee.name}</h1>
          <p className="page-description mt-2 text-[var(--color-text-secondary)]">
            <span className="font-mono font-semibold">{data.employee.employeeCode}</span>
            <span> · </span>
            <span>{emailLine}</span>
          </p>
        </div>
      </div>

      <div className="employee-dash-top">
        <Card className="employee-dash-card h-full border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-start gap-3">
            <div className="stat-icon !border-[var(--color-primary-muted)] !bg-[var(--color-surface)] !text-[var(--color-primary)]">
              <Calendar className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="card-heading">Current pay period</h2>
              {data.currentPeriod ? (
                <>
                  <p className="mt-2 text-base font-semibold leading-snug text-[var(--color-text-primary)]">
                    {formatPayPeriodLabel(data.currentPeriod)}
                  </p>
                  <Link href={`${base}/timesheet/${data.currentPeriod.id}`} className="mt-4 inline-block">
                    <Button>Submit my hours</Button>
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  There isn&apos;t an active period right now. Check back when payroll opens a new window.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="employee-dash-card">
          <div className="flex items-start gap-3">
            <div className="stat-icon !border-[var(--color-info-border)] !bg-[var(--color-info-bg)] !text-[var(--color-info)]">
              <ListChecks className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="card-heading">Your submissions</h2>
              <p className="card-subtitle">Quick snapshot by status</p>
              <div className="employee-stat-inner mt-4 text-sm">
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-page-bg)] px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Pending review</p>
                  <p className="stat-card-value !text-[21px] !font-extrabold">{data.counts.pending}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-3">
                  <p className="text-xs font-semibold text-[var(--color-success-text)]">Approved</p>
                  <p className="text-2xl font-extrabold tabular-nums text-[var(--color-success-text)]">{data.counts.approved}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-3">
                  <p className="text-xs font-semibold text-[var(--color-danger-text)]">Rejected</p>
                  <p className="text-2xl font-extrabold tabular-nums text-[var(--color-danger-text)]">{data.counts.rejected}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-surface-secondary)] px-3 py-3">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">Draft</p>
                  <p className="stat-card-value !text-[21px] !font-extrabold">{data.counts.draft}</p>
                </div>
              </div>
              <Link href={`${base}/timesheet`} className="link-accent mt-4 inline-block text-sm font-semibold">
                Open timesheet →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <Card padding={false} className="employee-dash-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <div className="card-header !mb-0 flex-wrap">
            <div>
              <h2 className="card-heading">Recent submissions</h2>
              <p className="card-subtitle">Last updates across periods</p>
            </div>
            <Link href={`${base}/history`} className="link-accent text-sm">
              Full history
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[480px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                    <p className="font-medium text-[var(--color-text-primary)]">No submissions yet</p>
                    <p className="mt-1 text-xs">When you submit hours, they&apos;ll show up here.</p>
                  </td>
                </tr>
              ) : (
                data.recentTimesheets.map((t) => (
                  <tr key={t.id} className="table-row table-row-muted">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`${base}/timesheet/${t.payPeriod.id}`}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent-light)]"
                      >
                        {formatPayPeriodLabel(t.payPeriod)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <TimesheetStatusBadge status={t.status} />
                    </td>
                    <td className="table-num px-4 py-3 text-[var(--color-text-primary)]">{t.totalHours}h</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{shortDate(t.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="employee-dash-bottom-grid">
        <Card className="employee-dash-card">
          <div className="card-header flex-wrap">
            <h2 className="card-heading">Notifications</h2>
            <button
              type="button"
              className="btn btn-xs btn-violet-soft"
              onClick={() =>
                fetch(`/api/public/employees/${employeeId}/notifications/read-all`, {
                  method: "POST",
                }).then(() => load())
              }
            >
              Mark all read
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {data.notifications.length === 0 ? (
              <li className="empty-state !rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] !bg-[var(--color-page-bg)]">
                <p className="empty-state-desc mb-0">You&apos;re all caught up.</p>
              </li>
            ) : (
              data.notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-[var(--radius-lg)] border px-4 py-3 transition ${
                    n.readAt
                      ? "border-[var(--color-border)] bg-[var(--color-surface-secondary)]"
                      : "border-[var(--color-primary-muted)] bg-[var(--color-primary-light)] shadow-sm"
                  }`}
                >
                  <p className="font-semibold text-[var(--color-text-primary)]">{n.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{n.body}</p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="employee-dash-card">
          <div className="card-header">
            <h2 className="card-heading">Recent payslips</h2>
            <Link href={`${base}/payslips`} className="link-accent text-sm">
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {data.recentPayslips.length === 0 ? (
              <li className="empty-state !rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] !bg-[var(--color-page-bg)]">
                <p className="empty-state-desc mb-0 text-balance">
                  No payslips yet—your team will add them after approval.
                </p>
              </li>
            ) : (
              data.recentPayslips.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-xs"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-[var(--color-text-primary)]">{p.payslipNumber}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatPayPeriodLabel(p.payPeriod)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold tabular-nums text-[var(--color-text-primary)]">{money(p.netPay)}</p>
                    <Link href={`${base}/payslips/${p.id}`} className="link-accent text-xs font-semibold">
                      Open
                    </Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
