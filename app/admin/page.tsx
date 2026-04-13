"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarRange,
  ClipboardClock,
  ClipboardCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
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

export default function AdminDashboardPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setData(j);
      })
      .catch(() => setErr("Failed to load"));
  }, []);

  if (err) {
    return <div className="alert-error max-w-xl">{err}</div>;
  }
  if (!data) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/100/30 border-t-violet-300"
          aria-hidden
        />
        Loading dashboard…
      </div>
    );
  }

  const cards = [
    {
      label: "Total employees",
      value: data.totalEmployees,
      href: "/admin/employees",
      hint: "Active roster",
      icon: Users,
    },
    {
      label: "Open pay periods",
      value: data.openPayPeriods,
      href: "/admin/pay-periods",
      hint: "Scheduling",
      icon: CalendarRange,
    },
    {
      label: "Pending reviews",
      value: data.pendingSubmissions,
      href: "/admin/review",
      hint: "Needs attention",
      icon: ClipboardClock,
    },
    {
      label: "Approved this period",
      value: data.approvedSubmissions,
      href: "/admin/review",
      hint: "Timesheets cleared",
      icon: ClipboardCheck,
    },
    {
      label: "Payroll overview",
      value: data.generatedPayslips,
      href: "/admin/payslips",
      hint: "Payslips issued",
      icon: FileText,
    },
  ];

  return (
    <div className="page-container space-y-10">
      <div>
        <p className="page-eyebrow">Overview</p>
        <h1 className="page-title mt-1">Payroll dashboard</h1>
        <p className="page-description">
          Manage payroll operations from one place—review hours, approve faster, stay audit-ready.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="group block h-full outline-none">
              <Card className="h-full transition duration-300 hover:-translate-y-0.5 hover:border-white/100/25 hover:shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
                    <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-white">{c.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{c.hint}</p>
                  </div>
                  <div className="stat-icon">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-300 opacity-0 transition group-hover:opacity-100">
                  Open <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="card-heading">Recent submissions</h2>
              <p className="mt-0.5 text-xs text-slate-500">Latest employee timesheet activity</p>
            </div>
            <Link href="/admin/review" className="link-accent text-sm">
              View queue
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table-shell min-w-[480px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                      <p className="font-medium text-slate-200">Nothing in the queue yet</p>
                      <p className="mt-1 text-xs">Submissions appear when employees send hours.</p>
                    </td>
                  </tr>
                ) : (
                  data.recentSubmissions.map((row) => (
                    <tr key={row.id} className="table-row table-row-muted">
                      <td className="px-4 py-3 font-medium text-slate-100">{row.employee.name}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {row.payPeriod.name ?? shortDate(row.payPeriod.startDate)}
                      </td>
                      <td className="px-4 py-3">
                        <TimesheetStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.submittedAt ? shortDate(row.submittedAt) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="card-heading">Recent approval actions</h2>
            <p className="mt-0.5 text-xs text-slate-500">Who changed what, and when</p>
          </div>
          <ul className="space-y-3 text-sm">
            {data.recentApprovals.length === 0 ? (
              <li className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-slate-400">
                <p className="font-medium text-slate-200">No actions yet</p>
                <p className="mt-1 text-xs">Approvals and verifications will show up here.</p>
              </li>
            ) : (
              data.recentApprovals.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 shadow-inner shadow-black/20"
                >
                  <span className="font-medium text-slate-100">{a.timesheet.employee.name}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-300">{a.admin.name}</span>
                    <span className="text-slate-600">·</span>
                    <TimesheetStatusBadge status={a.newStatus} />
                    <span className="text-slate-600">·</span>
                    {shortDate(a.createdAt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="card-heading">Recent payslips</h2>
            <p className="mt-0.5 text-xs text-slate-500">Latest generated documents</p>
          </div>
          <Link href="/admin/payslips" className="link-accent text-sm">
            View all
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
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                    No payslips yet. Approve timesheets to generate pay.
                  </td>
                </tr>
              ) : (
                data.recentPayslips.map((p) => (
                  <tr key={p.id} className="table-row table-row-muted">
                    <td className="px-4 py-3">
                      <Link href={`/admin/payslips/${p.id}`} className="link-accent font-mono text-sm">
                        {p.payslipNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">{p.employee.name}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-white">${p.netPay.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500">{shortDate(p.createdAt)}</td>
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
