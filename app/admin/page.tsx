"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CalendarRange,
  ClipboardClock,
  Timer,
  Wallet,
  Building2,
  Plus,
  Eye,
  CalendarPlus,
  FileOutput,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { PayrollNetTrendChart, HoursTrendChart } from "@/components/dashboard/DashboardCharts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";

type Stats = {
  totalEmployees: number;
  openPayPeriods: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  generatedPayslips: number;
  recentSubmissions: {
    id: string;
    status: string;
    totalHours?: number;
    submittedAt: string | null;
    employee: { name: string; user: { name: string } | null };
    payPeriod: { name: string | null; startDate: string; endDate: string };
  }[];
  recentApprovals: {
    id: string;
    newStatus: string;
    createdAt: string;
    admin: { name: string };
    timesheet: {
      employee: { name: string; user: { name: string } | null };
      payPeriod: { name: string | null };
    };
  }[];
  recentPayslips: {
    id: string;
    payslipNumber: string;
    netPay: number;
    createdAt: string;
    employee: { name: string; user: { name: string } | null };
  }[];
};

type EmpRow = {
  department: string | null;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [deptCount, setDeptCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setData(j);
      })
      .catch(() => setErr("Failed to load"));
    fetch("/api/admin/employees?status=active")
      .then((r) => r.json())
      .then((j) => {
        const list = (j.employees ?? []) as EmpRow[];
        const dept = new Set(
          list.map((e) => (e.department ?? "").trim()).filter(Boolean),
        );
        setDeptCount(dept.size);
      })
      .catch(() => setDeptCount(null));
  }, []);

  if (err) {
    return (
      <div className="page-container">
        <div className="alert-error max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm">{err}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container space-y-6">
        <div className="skeleton skeleton-title mb-6 h-10 max-w-xs rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card min-h-[128px] rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton skeleton-card min-h-[280px] rounded-2xl" />
          <div className="skeleton skeleton-card min-h-[280px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const chartPayslip = !data.recentPayslips.length
    ? []
    : [...data.recentPayslips]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-8)
        .map((p) => ({
          label: new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          net: p.netPay,
        }));

  const chartHours = !data.recentSubmissions.length
    ? []
    : data.recentSubmissions.slice(0, 8).map((r) => ({
        label: r.employee.name.split(/\s+/)[0] ?? r.employee.name,
        hours: typeof r.totalHours === "number" ? r.totalHours : 0,
      }));

  const metricTrend = "+4.2%";

  const cards = [
    {
      label: "Total Employees",
      value: data.totalEmployees,
      href: "/admin/employees",
      hint: "Active roster size",
      icon: Users,
      trend: metricTrend,
      gradient: "violet" as const,
    },
    {
      label: "Pending Timesheets",
      value: data.pendingSubmissions,
      href: "/admin/timesheets",
      hint: "Needs review queue",
      icon: ClipboardClock,
      trend: "Live",
      gradient: "indigo" as const,
    },
    {
      label: "Approved Hours",
      value: data.approvedSubmissions,
      href: "/admin/review",
      hint: "Payroll-ready entries",
      icon: Timer,
      trend: "Stable",
      gradient: "violet" as const,
    },
    {
      label: "Current Pay Period",
      value: data.openPayPeriods,
      href: "/admin/pay-periods",
      hint: "Open schedules",
      icon: CalendarRange,
      trend: "â€”",
      gradient: "indigo" as const,
    },
    {
      label: "Payroll Processed",
      value: data.generatedPayslips,
      href: "/admin/payslips",
      hint: "Payslips generated",
      icon: Wallet,
      trend: "MTD",
      gradient: "fuchsia" as const,
    },
    {
      label: "Active Departments",
      value: deptCount ?? "â€”",
      href: "/admin/employees",
      hint: "Unique department tags",
      icon: Building2,
      trend: deptCount === null ? "â€”" : "Org",
      gradient: "violet" as const,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Overview"
        title="Payroll command center"
        description="Operational clarity for approvals, payouts, and complianceâ€”minimal noise, decisive actions."
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <DashboardMetricCard key={c.label} {...c} />
        ))}
      </div>

      <motion.section
        className="mb-10 grid gap-5 lg:grid-cols-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/90 backdrop-blur-sm">
          <div className="card-header !mb-1">
            <div>
              <h2 className="card-heading text-base">Weekly payroll pulse</h2>
              <p className="card-subtitle">Net pay from recently generated slips</p>
            </div>
          </div>
          <PayrollNetTrendChart data={chartPayslip} />
        </Card>
        <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/90 backdrop-blur-sm">
          <div className="card-header !mb-1">
            <div>
              <h2 className="card-heading text-base">Hours throughput</h2>
              <p className="card-subtitle">Recent submission volumes</p>
            </div>
          </div>
          <HoursTrendChart data={chartHours} />
        </Card>
      </motion.section>

      <div className="mb-10 rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-card)] via-[var(--color-bg-card)] to-[var(--color-accent-soft)] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-light)]">Quick actions</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Jump into the highest-impact workflows.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/employees">
              <Button className="h-11 gap-2 rounded-xl shadow-md transition hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4" aria-hidden strokeWidth={2} />
                Add employee
              </Button>
            </Link>
            <Link href="/admin/timesheets">
              <Button variant="secondary" className="h-11 gap-2 rounded-xl border-[var(--color-border-strong)] hover:border-[var(--color-accent-tint)]">
                <Eye className="h-4 w-4 text-[var(--color-accent-light)]" aria-hidden strokeWidth={2} />
                Review timesheets
              </Button>
            </Link>
            <Link href="/admin/pay-periods">
              <Button variant="outline" className="h-11 gap-2 rounded-xl">
                <CalendarPlus className="h-4 w-4" aria-hidden strokeWidth={2} />
                Create pay period
              </Button>
            </Link>
            <Link href="/admin/payslips">
              <Button variant="outline" className="h-11 gap-2 rounded-xl">
                <FileOutput className="h-4 w-4" aria-hidden strokeWidth={2} />
                Generate payslip
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="chart-grid mb-10">
        <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
          <div className="card-header !mb-0 flex-col gap-1 sm:flex-row sm:items-end">
            <div>
              <h2 className="card-heading text-base">Recent submissions</h2>
              <p className="card-subtitle">Awaiting routing through review</p>
            </div>
            <Link href="/admin/timesheets" className="link-accent shrink-0 text-sm font-semibold">
              Full queue â†’
            </Link>
          </div>
          <div className="table-wrap mt-6">
            <table className="table-shell min-w-[420px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Queue is calm</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">Incoming employee hours will populate this table automatically.</p>
                    </td>
                  </tr>
                ) : (
                  data.recentSubmissions.map((row) => (
                    <tr key={row.id} className="table-row table-row-muted">
                      <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">{row.employee.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                        {row.submittedAt ? shortDate(row.submittedAt) : "â€”"}
                      </td>
                      <td className="table-num px-4 py-3 text-[var(--color-text-secondary)]">
                        {typeof row.totalHours === "number" ? `${row.totalHours}h` : "â€”"}
                      </td>
                      <td className="px-4 py-3">
                        <TimesheetStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/timesheets/${row.id}`}
                          className="inline-flex rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--color-accent-light)] hover:bg-[var(--color-accent-soft)]"
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

        <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="card-heading text-base">Recent approval actions</h2>
              <p className="card-subtitle">Administrative trace for sign-offs</p>
            </div>
            <Link href="/admin/history" className="link-accent text-sm font-semibold">
              Audit log â†’
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            {data.recentApprovals.length === 0 ? (
              <li className="empty-state !rounded-2xl !border-dashed !py-12">
                <p className="empty-state-title">No actions yet</p>
                <p className="empty-state-desc">Approvals and verifications will appear in this feed.</p>
              </li>
            ) : (
              data.recentApprovals.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-slate-50/90 to-white px-4 py-3 shadow-sm shadow-slate-200/40"
                >
                  <span className="font-semibold text-[var(--color-text-primary)]">{a.timesheet.employee.name}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text-secondary)]">{a.admin.name}</span>
                    <span aria-hidden className="text-slate-300">
                      Â·
                    </span>
                    <TimesheetStatusBadge status={a.newStatus} />
                    <span aria-hidden className="text-slate-300">
                      Â·
                    </span>
                    {shortDate(a.createdAt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
        <div className="card-header flex-col gap-1 sm:flex-row sm:items-end">
          <div>
            <h2 className="card-heading text-base">Recent payslips</h2>
            <p className="card-subtitle">Latest payouts generated from approved hours</p>
          </div>
          <Link href="/admin/payslips" className="link-accent shrink-0 text-sm font-semibold">
            View library â†’
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table-shell min-w-[400px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Net pay</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayslips.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--color-text-muted)]">
                    No payslips yet â€” approve validated timesheets to generate pay artifacts.
                  </td>
                </tr>
              ) : (
                data.recentPayslips.map((p) => (
                  <tr key={p.id} className="table-row table-row-muted">
                    <td className="px-4 py-3">
                      <Link href={`/admin/payslips/${p.id}`} className="link-accent font-mono text-sm font-semibold">
                        {p.payslipNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">{p.employee.name}</td>
                    <td className="table-num px-4 py-3 font-semibold text-[var(--color-text-primary)]">${p.netPay.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{shortDate(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
