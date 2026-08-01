"use client";

import { use, useEffect, useState } from "react";
import { Users, ClipboardClock, Timer, Wallet } from "lucide-react";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { PayrollSummaryStackedChart } from "@/components/dashboard/DashboardCharts";
import { DashboardPayPeriodCard } from "@/components/dashboard/DashboardPayPeriodCard";
import { DashboardRecentPayslips } from "@/components/dashboard/DashboardRecentPayslips";
import { DashboardActivityPanel } from "@/components/dashboard/DashboardActivityPanel";
import { Card } from "@/components/ui/Card";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";

/**
 * Reuses the same dashboard components MAIN_ADMIN sees (app/admin/page.tsx), fed from the
 * company-scoped /api/super-admin/companies/[companyId]/stats route instead of session-scoped
 * /api/admin/stats.
 *
 * Deliberately NOT reused: DashboardQuickActions and DashboardPendingQueue.
 *  - DashboardQuickActions / DashboardMetricCard / DashboardRecentPayslips all hardcode `/admin/...`
 *    hrefs. proxy.ts safely redirects a super admin away from those (back here), so nothing leaks —
 *    but the links are dead ends today. Making them work means threading a companyId/basePath prop
 *    through each component and building the corresponding pages under this route (employee list,
 *    timesheet review, payslip list) — not built yet, flagged as follow-up.
 *  - DashboardPendingQueue is the one component with a real gap, not just a dead link: its "Approve"
 *    button POSTs to /api/admin/timesheets/[id]/approval, which for SUPER_ADMIN bypasses company
 *    scoping entirely (assertStaffCanAccessEmployee returns true unconditionally). Wiring it in here
 *    would let a super admin approve ANY company's timesheet regardless of which company's dashboard
 *    is open, contradicting the whole point of this page. Shown below as a read-only count instead.
 */

type Stats = {
  totalEmployees: number;
  openPayPeriods: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  generatedPayslips: number;
  underReviewSubmissions: number;
  currentPayPeriod: {
    id: string;
    name: string | null;
    startDate: string;
    endDate: string;
    status: string;
    timesheetCount: number;
    payslipCount: number;
    pendingCount: number;
    approvedCount: number;
  } | null;
  timesheetsAwaitingAction: {
    id: string;
    status: string;
    totalHours?: number;
    submittedAt: string | null;
    employee: { name: string; employeeCode: string };
  }[];
  recentSubmissions: {
    id: string;
    status: string;
    totalHours?: number;
    submittedAt: string | null;
    employee: { name: string; employeeCode: string };
  }[];
  recentApprovals: {
    id: string;
    newStatus: string;
    createdAt: string;
    admin: { name: string };
    timesheet: { id: string; employee: { name: string } };
  }[];
  recentPayslips: {
    id: string;
    payslipNumber: string;
    netPay: number;
    createdAt: string;
    employee: { name: string };
    payPeriod: { name: string | null };
  }[];
  payrollSummary: { label: string; gross: number; deductions: number; net: number }[];
};

export default function CompanyDrilldownDashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = use(params);
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/super-admin/companies/${companyId}/stats`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) {
          setErr(j.error);
          return;
        }
        setData(j);
      })
      .catch(() => !cancelled && setErr("Failed to load"));
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (err) {
    return (
      <div className="page-container">
        <div className="alert-error max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm">{err}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card min-h-[148px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const pendingTotal = data.pendingSubmissions + data.underReviewSubmissions;

  const cards = [
    { label: "Total Employees", value: data.totalEmployees, icon: Users, iconVariant: "primary" as const },
    { label: "Payroll Run", value: data.generatedPayslips, icon: Wallet, iconVariant: "success" as const },
    { label: "Hours Logged", value: data.approvedSubmissions, icon: Timer, iconVariant: "success" as const },
    {
      label: "Pending Approvals",
      value: pendingTotal,
      trend: pendingTotal > 0 ? "Action required" : "All clear",
      trendUp: pendingTotal === 0,
      icon: ClipboardClock,
      iconVariant: "warning" as const,
    },
  ];

  return (
    <div className="page-container space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--sa-heading)]">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <DashboardMetricCard key={c.label} {...c} />
        ))}
      </div>

      {data.currentPayPeriod ? (
        <DashboardPayPeriodCard period={data.currentPayPeriod} payPeriodsPath={null} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="ui-panel !rounded-xl !border-[var(--elite-border)] !shadow-sm">
          <div className="card-header !mb-0">
            <h2 className="card-heading text-base text-[var(--elite-heading)]">Recent timesheets</h2>
            <p className="card-subtitle">Latest employee submissions</p>
          </div>
          <div className="table-wrap mt-5">
            <table className="table-shell min-w-[560px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Submission Date</th>
                  <th className="px-4 py-3">Total Hours</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                      No recent submissions
                    </td>
                  </tr>
                ) : (
                  data.recentSubmissions.map((row) => (
                    <tr key={row.id} className="table-row table-row-muted">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                        {row.employee.employeeCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--elite-text)]">{row.employee.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--text-muted)]">
                        {row.submittedAt ? shortDate(row.submittedAt) : "—"}
                      </td>
                      <td className="table-num px-4 py-3 text-[var(--text-muted)]">
                        {typeof row.totalHours === "number" ? `${row.totalHours}h` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <TimesheetStatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="ui-panel !rounded-xl !border-[var(--elite-border)] !shadow-sm">
          <div className="card-header !mb-1">
            <h2 className="card-heading text-base text-[var(--elite-heading)]">Payroll summary</h2>
            <p className="card-subtitle">Gross, deductions, and net pay by period</p>
          </div>
          <PayrollSummaryStackedChart data={data.payrollSummary ?? []} />
        </Card>
      </div>

      {/* Read-only — see file header for why DashboardPendingQueue's quick-approve isn't reused here. */}
      <Card className="ui-panel !rounded-xl !border-[var(--elite-border)] !shadow-sm">
        <div className="card-header !mb-0">
          <h2 className="card-heading text-base text-[var(--elite-heading)]">Awaiting action</h2>
          <p className="card-subtitle">Timesheets pending review for this company (view only)</p>
        </div>
        <div className="mt-5 space-y-3">
          {data.timesheetsAwaitingAction.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--elite-border)] px-4 py-10 text-center">
              <p className="text-sm font-semibold text-[var(--elite-heading)]">All caught up</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">No timesheets need approval right now.</p>
            </div>
          ) : (
            data.timesheetsAwaitingAction.map((row) => (
              <div key={row.id} className="dash-pending-row">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--elite-text)]">{row.employee.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    <span className="font-mono">{row.employee.employeeCode}</span>
                    {" · "}
                    {row.submittedAt ? shortDate(row.submittedAt) : "Not submitted"}
                  </p>
                </div>
                <TimesheetStatusBadge status={row.status} />
              </div>
            ))
          )}
        </div>
      </Card>

      <DashboardRecentPayslips
        items={data.recentPayslips}
        payslipsListPath={null}
        payslipDetailPathPrefix={null}
      />

      <DashboardActivityPanel
        recentApprovals={data.recentApprovals}
        recentAuditLogs={[]}
        isMainAdmin={false}
      />
    </div>
  );
}
