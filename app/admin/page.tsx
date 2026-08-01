"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { Users, ClipboardClock, Timer, Wallet, RefreshCw } from "lucide-react";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { PayrollSummaryStackedChart } from "@/components/dashboard/DashboardCharts";
import { DashboardPayPeriodCard } from "@/components/dashboard/DashboardPayPeriodCard";
import { DashboardPendingQueue } from "@/components/dashboard/DashboardPendingQueue";
import { DashboardPayPeriodPayouts } from "@/components/dashboard/DashboardPayPeriodPayouts";
import { DashboardRecentPayslips } from "@/components/dashboard/DashboardRecentPayslips";
import { DashboardActivityPanel } from "@/components/dashboard/DashboardActivityPanel";
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
      <div className="admin-dashboard page-container">
        <div className="alert-error max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm">{err}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-dashboard page-container space-y-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card min-h-[88px] rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="skeleton skeleton-card min-h-[320px] rounded-2xl xl:col-span-8" />
          <div className="skeleton skeleton-card min-h-[320px] rounded-2xl xl:col-span-4" />
        </div>
      </div>
    );
  }

  const pendingTotal = data.pendingSubmissions + data.underReviewSubmissions;

  const cards = [
    {
      label: "Employees",
      value: data.totalEmployees,
      href: "/admin/employees",
      icon: Users,
      trend: data.pendingEmployeeApprovals > 0 ? `${data.pendingEmployeeApprovals} pending signup` : undefined,
      trendUp: data.pendingEmployeeApprovals === 0,
      iconVariant: "primary" as const,
    },
    {
      label: "Payslips issued",
      value: data.generatedPayslips,
      href: "/admin/payslips",
      icon: Wallet,
      trend: `${data.openPayPeriods} open period${data.openPayPeriods === 1 ? "" : "s"}`,
      trendUp: true,
      iconVariant: "success" as const,
    },
    {
      label: "Approved timesheets",
      value: data.approvedSubmissions,
      href: "/admin/review",
      icon: Timer,
      trend: data.underReviewSubmissions > 0 ? `${data.underReviewSubmissions} in review` : undefined,
      trendUp: data.underReviewSubmissions === 0,
      iconVariant: "success" as const,
    },
    {
      label: "Needs approval",
      value: pendingTotal,
      href: "/admin/review",
      icon: ClipboardClock,
      trend: pendingTotal > 0 ? "Review queue" : "All clear",
      trendUp: pendingTotal === 0,
      iconVariant: "warning" as const,
    },
  ];

  return (
    <div className="admin-dashboard page-container space-y-8 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Overview</p>
          <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight text-[var(--elite-heading)] sm:text-[1.75rem]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
            Payroll operations at a glance — focus on what needs attention first.
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
      </header>

      <motion.div
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        variants={reduceMotion ? undefined : staggerContainer}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? false : "visible"}
      >
        {cards.map((c) => (
          <DashboardMetricCard key={c.label} {...c} />
        ))}
      </motion.div>

      {data.currentPayPeriod ? <DashboardPayPeriodCard period={data.currentPayPeriod} /> : null}

      <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
        <section className="ui-panel dash-panel rounded-2xl border border-[var(--elite-border)] bg-[var(--elite-surface)] p-5 shadow-sm xl:col-span-8">
          <div className="mb-1">
            <h2 className="text-base font-semibold text-[var(--elite-heading)]">Payroll summary</h2>
            <p className="text-sm text-[var(--text-muted)]">Gross, deductions, and net by period</p>
          </div>
          <PayrollSummaryStackedChart data={data.payrollSummary ?? []} />
        </section>

        <div className="xl:col-span-4">
          <DashboardPendingQueue items={data.timesheetsAwaitingAction} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
        <div className="xl:col-span-7">
          <DashboardPayPeriodPayouts defaultPayPeriodId={data.currentPayPeriod?.id ?? null} />
        </div>

        <div className="xl:col-span-5">
          <DashboardRecentPayslips items={data.recentPayslips} />
        </div>
      </div>

      <DashboardActivityPanel
        recentApprovals={data.recentApprovals}
        recentAuditLogs={data.recentAuditLogs ?? []}
        isMainAdmin={data.isMainAdmin}
      />
    </div>
  );
}
