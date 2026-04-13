"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate, money } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function PublicHistoryPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const base = `/employee/${employeeId}`;
  const [payPeriodId, setPayPeriodId] = useState("");
  const [periods, setPeriods] = useState<{ id: string; name: string | null; startDate: string }[]>([]);
  const [timesheets, setTimesheets] = useState<
    {
      id: string;
      status: string;
      totalHours: number;
      payPeriod: { name: string | null; startDate: string; endDate: string };
      payslip: { id: string; payslipNumber: string } | null;
    }[]
  >([]);
  const [payslips, setPayslips] = useState<
    { id: string; payslipNumber: string; netPay: number; payPeriod: { name: string | null; startDate: string } }[]
  >([]);

  function load() {
    const params = new URLSearchParams();
    if (payPeriodId) params.set("payPeriodId", payPeriodId);
    fetch(`/api/public/employees/${employeeId}/history?${params}`)
      .then((r) => r.json())
      .then((j) => {
        setTimesheets(j.timesheets ?? []);
        setPayslips(j.payslips ?? []);
        if (j.payPeriods) setPeriods(j.payPeriods);
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  return (
    <div className="page-container max-w-5xl space-y-8">
      <div>
        <p className="page-eyebrow">Records</p>
        <h1 className="page-title mt-1">Your history</h1>
        <p className="page-description">Past periods, submissions, and payslips in one place.</p>
      </div>

      <Card>
        <label className="label-field" htmlFor="hist-period">
          Filter by pay period
        </label>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <select
            id="hist-period"
            className="select-field min-w-[12rem] max-w-full flex-1"
            value={payPeriodId}
            onChange={(e) => setPayPeriodId(e.target.value)}
          >
            <option value="">All periods</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? shortDate(p.startDate)}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={load}>
            Apply
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-white">Timesheets</h2>
        <div className="mt-4 -mx-2 overflow-x-auto rounded-xl border border-violet-50/80">
          <table className="table-shell min-w-[560px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Payslip</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    No timesheets for this filter.
                  </td>
                </tr>
              ) : (
                timesheets.map((t) => (
                  <tr key={t.id} className="table-row table-row-muted">
                    <td className="px-4 py-3 text-slate-200">
                      {t.payPeriod.name ?? `${shortDate(t.payPeriod.startDate)} – ${shortDate(t.payPeriod.endDate)}`}
                    </td>
                    <td className="px-4 py-3">
                      <TimesheetStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-white">{t.totalHours}h</td>
                    <td className="px-4 py-3">
                      {t.payslip ? (
                        <Link className="link-accent font-mono text-xs" href={`${base}/payslips/${t.payslip.id}`}>
                          {t.payslip.payslipNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-white">Payslips</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {payslips.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-slate-500">
              No payslips yet for this view.
            </li>
          ) : (
            payslips.map((p) => (
              <li
                key={p.id}
                className="flex justify-between gap-4 rounded-xl border border-violet-100/80 px-4 py-3 shadow-sm shadow-violet-950/[0.02]"
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
                    View
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
