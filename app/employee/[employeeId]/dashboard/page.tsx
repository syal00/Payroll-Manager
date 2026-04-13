"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { Calendar, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate, money } from "@/lib/format";

type DashboardPayload = {
  employee: {
    id: string;
    name: string;
    email: string;
    employeeCode: string;
  };
  currentPeriod: { id: string; name: string | null; startDate: string; endDate: string } | null;
  counts: { pending: number; approved: number; rejected: number; draft: number };
  recentTimesheets: {
    id: string;
    status: string;
    totalHours: number;
    updatedAt: string;
    payPeriod: { name: string | null; startDate: string };
    payslip: { id: string } | null;
  }[];
  recentPayslips: {
    id: string;
    payslipNumber: string;
    netPay: number;
    payPeriod: { name: string | null; startDate: string };
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
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-300"
          aria-hidden
        />
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl space-y-10">
      <div>
        <p className="page-eyebrow">Hello</p>
        <h1 className="page-title mt-1">Welcome, {data.employee.name}</h1>
        <p className="page-description mt-2">
          <span className="font-mono font-semibold text-slate-200">{data.employee.employeeCode}</span>
          <span className="text-slate-300"> · </span>
          {data.employee.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-violet-500/15 bg-gradient-to-br from-violet-950/40 via-transparent to-indigo-950/30">
          <div className="flex items-start gap-3">
            <div className="stat-icon shrink-0">
              <Calendar className="h-5 w-5 text-violet-200" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-white">Current pay period</h2>
              {data.currentPeriod ? (
                <>
                  <p className="mt-2 text-lg font-semibold leading-snug text-slate-200">
                    {data.currentPeriod.name ??
                      `${shortDate(data.currentPeriod.startDate)} – ${shortDate(data.currentPeriod.endDate)}`}
                  </p>
                  <Link href={`${base}/timesheet/${data.currentPeriod.id}`} className="mt-4 inline-block">
                    <Button>Submit my hours</Button>
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  There isn&apos;t an active period right now. Check back when payroll opens a new window.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/25 shadow-[0_0_24px_-8px_rgba(99,102,241,0.4)]">
              <ListChecks className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-white">Your submissions</h2>
              <p className="mt-1 text-xs text-slate-500">Quick snapshot by status</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-violet-100/80 bg-violet-50/40 px-3 py-3">
                  <p className="text-xs font-semibold text-slate-500">Pending review</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">{data.counts.pending}</p>
                </div>
                <div className="rounded-xl border border-emerald-100/80 bg-emerald-50/40 px-3 py-3">
                  <p className="text-xs font-semibold text-slate-500">Approved</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">{data.counts.approved}</p>
                </div>
                <div className="rounded-xl border border-rose-100/80 bg-rose-50/40 px-3 py-3">
                  <p className="text-xs font-semibold text-slate-500">Rejected</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">{data.counts.rejected}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
                  <p className="text-xs font-semibold text-slate-500">Draft</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">{data.counts.draft}</p>
                </div>
              </div>
              <Link href={`${base}/timesheet`} className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
                Open timesheet →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">Recent submissions</h2>
            <p className="text-xs text-slate-500">Last updates across periods</p>
          </div>
          <Link href={`${base}/history`} className="link-accent text-sm">
            Full history
          </Link>
        </div>
        <div className="-mx-2 overflow-x-auto rounded-xl border border-violet-50/80">
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
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    <p className="font-medium text-slate-700">No submissions yet</p>
                    <p className="mt-1 text-xs">When you submit hours, they&apos;ll show up here.</p>
                  </td>
                </tr>
              ) : (
                data.recentTimesheets.map((t) => (
                  <tr key={t.id} className="table-row table-row-muted">
                    <td className="px-4 py-3 text-slate-200">
                      {t.payPeriod.name ?? shortDate(t.payPeriod.startDate)}
                    </td>
                    <td className="px-4 py-3">
                      <TimesheetStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-white">{t.totalHours}h</td>
                    <td className="px-4 py-3 text-slate-500">{shortDate(t.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-white">Notifications</h2>
            <button
              type="button"
              className="text-xs font-semibold text-violet-700 hover:underline"
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
              <li className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-slate-500">
                You&apos;re all caught up.
              </li>
            ) : (
              data.notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-xl border px-4 py-3 transition ${
                    n.readAt
                      ? "border-white/8 bg-white/[0.03]"
                      : "border-violet-500/30 bg-violet-500/10 shadow-[0_0_24px_-8px_rgba(139,92,246,0.35)]"
                  }`}
                >
                  <p className="font-semibold text-white">{n.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{n.body}</p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-white">Recent payslips</h2>
            <Link href={`${base}/payslips`} className="link-accent text-sm">
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {data.recentPayslips.length === 0 ? (
              <li className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-slate-500">
                No payslips yet—your team will add them after approval.
              </li>
            ) : (
              data.recentPayslips.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-inner shadow-black/20"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-white">{p.payslipNumber}</p>
                    <p className="text-xs text-slate-500">
                      {p.payPeriod.name ?? shortDate(p.payPeriod.startDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold tabular-nums text-white">{money(p.netPay)}</p>
                    <Link href={`${base}/payslips/${p.id}`} className="text-xs font-semibold text-violet-700 hover:underline">
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
