"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { Users, ClipboardClock, Timer, Wallet, RefreshCw } from "lucide-react";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { PayrollSummaryStackedChart } from "@/components/dashboard/DashboardCharts";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardPayPeriodCard } from "@/components/dashboard/DashboardPayPeriodCard";
import { DashboardPendingQueue } from "@/components/dashboard/DashboardPendingQueue";
import { DashboardRecentPayslips } from "@/components/dashboard/DashboardRecentPayslips";
import { DashboardActivityPanel } from "@/components/dashboard/DashboardActivityPanel";
import { Card } from "@/components/ui/Card";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";
import { ADMIN_STATS_REFRESH_EVENT } from "@/lib/admin-stats-refresh";

type Stats = {
  isMainAdmin: boolean;
  totalEmployees: number;
  openPayPeriods: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  generatedPayslips: number;
  underReviewSubmissions: number;
  pendingEmployeeApprovals: number;
  demoRequestCount: number;
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
    employee: { name: string; employeeCode: string; user: { name: string } | null };
    payPeriod: { name: string | null; startDate: string; endDate: string };
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
  recentDemoRequests: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    createdAt: string;
  }[];
  recentAuditLogs: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { name: string } | null;
  }[];
  payrollSummary: {
    label: string;
    gross: number;
    deductions: number;
    net: number;
  }[];
};

export default function AdminDashboardPage() {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [statsRefreshing, setStatsRefreshing] = useState(false);

  const loadStats = useCallback(async (opts?: { manual?: boolean }) => {
    if (opts?.manual) setStatsRefreshing(true);
    setErr(null);
    try {
      const statsRes = await fetch("/api/admin/stats");
      const j = await statsRes.json();
      if (!statsRes.ok || j.error) {
        setErr(j.error ?? "Failed to load");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setErr("Failed to load");
      setData(null);
    } finally {
      if (opts?.manual) setStatsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
    const interval = setInterval(() => void loadStats(), 30000);
    const onRefresh = () => void loadStats();
    window.addEventListener(ADMIN_STATS_REFRESH_EVENT, onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(ADMIN_STATS_REFRESH_EVENT, onRefresh);
    };
  }, [loadStats]);

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
        <div className="skeleton skeleton-card min-h-[100px] rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton skeleton-card min-h-[360px] rounded-xl" />
          <div className="skeleton skeleton-card min-h-[360px] rounded-xl" />
        </div>
      </div>
    );
  }

  const pendingTotal = data.pendingSubmissions + data.underReviewSubmissions;

  const cards = [
    {
      label: "Total Employees",
      value: data.totalEmployees,
      href: "/admin/employees",
      icon: Users,
      trend: data.pendingEmployeeApprovals > 0 ? `${data.pendingEmployeeApprovals} pending signup` : `${data.openPayPeriods} open periods`,
      trendUp: data.pendingEmployeeApprovals === 0,
      iconVariant: "primary" as const,
    },
    {
      label: "Payroll Run",
      value: data.generatedPayslips,
      href: "/admin/payslips",
      icon: Wallet,
      trend: `${data.openPayPeriods} open period${data.openPayPeriods === 1 ? "" : "s"}`,
      trendUp: true,
      iconVariant: "success" as const,
    },
    {
      label: "Hours Logged",
      value: data.approvedSubmissions,
      href: "/admin/review",
      icon: Timer,
      trend: `${data.underReviewSubmissions} under review`,
      trendUp: data.underReviewSubmissions === 0,
      iconVariant: "success" as const,
    },
    {
      label: "Pending Approvals",
      value: pendingTotal,
      href: "/admin/timesheets",
      icon: ClipboardClock,
      trend: pendingTotal > 0 ? "Action required" : "All clear",
      trendUp: pendingTotal === 0,
      iconVariant: "warning" as const,
    },
  ];

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--elite-heading)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Overview of payroll operations and pending work.
          </p>
        </div>
        <button
          type="button"
          className="icon-btn shrink-0 border border-[var(--elite-border)]"
          aria-label="Refresh dashboard stats"
          title="Refresh stats"
          onClick={() => void loadStats({ manual: true })}
        >
          <RefreshCw className={`h-[18px] w-[18px] ${statsRefreshing ? "animate-spin" : ""}`} strokeWidth={2} />
        </button>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={reduceMotion ? undefined : staggerContainer}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? false : "visible"}
      >
        {cards.map((c) => (
          <DashboardMetricCard key={c.label} {...c} />
        ))}
      </motion.div>

      <DashboardQuickActions
        pendingSubmissions={pendingTotal}
        pendingEmployeeApprovals={data.pendingEmployeeApprovals}
        demoRequestCount={data.demoRequestCount ?? 0}
        isMainAdmin={data.isMainAdmin}
      />

      {data.currentPayPeriod ? <DashboardPayPeriodCard period={data.currentPayPeriod} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="ui-panel !rounded-xl !border-[var(--elite-border)] !shadow-sm">
          <div className="card-header !mb-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="card-heading text-base text-[var(--elite-heading)]">Recent timesheets</h2>
              <p className="card-subtitle">Latest employee submissions</p>
            </div>
            <Link href="/admin/timesheets" className="link-accent shrink-0 text-sm font-semibold">
              View all →
            </Link>
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
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm font-semibold text-[var(--elite-heading)]">No recent submissions</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Employee timesheets will appear here as they are submitted.
                      </p>
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
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/timesheets/${row.id}`}
                          className="inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--elite-accent)] hover:bg-[var(--elite-accent-soft)]"
                        >
                          Open
                        </Link>
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
            <div>
              <h2 className="card-heading text-base text-[var(--elite-heading)]">Payroll summary</h2>
              <p className="card-subtitle">Gross, deductions, and net pay by period</p>
            </div>
          </div>
          <PayrollSummaryStackedChart data={data.payrollSummary ?? []} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPendingQueue items={data.timesheetsAwaitingAction} />
        <DashboardRecentPayslips items={data.recentPayslips} />
      </div>

      <DashboardActivityPanel
        recentApprovals={data.recentApprovals}
        recentAuditLogs={data.recentAuditLogs ?? []}
        recentDemoRequests={data.recentDemoRequests ?? []}
        demoRequestCount={data.demoRequestCount ?? 0}
        pendingEmployeeApprovals={data.pendingEmployeeApprovals}
        isMainAdmin={data.isMainAdmin}
      />
    </div>
  );
}
