"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TimesheetStatusBadge, PayPeriodStatusBadge } from "@/components/status-badges";
import { shortDate, money } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { PayPeriodStatus, TimesheetStatus } from "@/lib/enums";

export default function PublicHistoryPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const base = `/employee/${employeeId}`;
  const [payPeriodId, setPayPeriodId] = useState("");
  const [periods, setPeriods] = useState<
    { id: string; name: string | null; startDate: string; status: string }[]
  >([]);
  const [timesheets, setTimesheets] = useState<
    {
      id: string;
      status: string;
      totalHours: number;
      totalRegular: number;
      totalOvertime: number;
      totalLeave: number;
      payPeriodId: string;
      payPeriod: { id: string; name: string | null; startDate: string; endDate: string; status: string };
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
      <Link href={`${base}/dashboard`} className="link-accent inline-flex items-center gap-1 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

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
                {p.status === "CLOSED" ? " (closed)" : p.status === "OPEN" ? " (open)" : ""}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={load}>
            Apply
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="card-heading">Timesheets</h2>
        <div className="mt-4 -mx-2 overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="table-shell min-w-[560px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Period status</th>
                <th className="px-4 py-3">Submission</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Payslip</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                    No timesheets for this filter.
                  </td>
                </tr>
              ) : (
                timesheets.map((t) => {
                  const periodLabel =
                    t.payPeriod.name ??
                    `${shortDate(t.payPeriod.startDate)} – ${shortDate(t.payPeriod.endDate)}`;
                  const timesheetHref = `${base}/timesheet/${t.payPeriod.id}`;
                  const canSubmit =
                    t.payPeriod.status === PayPeriodStatus.OPEN &&
                    (t.status === TimesheetStatus.DRAFT || t.status === TimesheetStatus.REJECTED);
                  return (
                  <tr key={t.id} className="table-row table-row-muted">
                    <td className="px-4 py-3">
                      <Link href={timesheetHref} className="link-accent font-medium">
                        {periodLabel}
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        {t.totalRegular}h reg · {t.totalOvertime}h OT · {t.totalLeave}h leave
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <PayPeriodStatusBadge status={t.payPeriod.status} />
                    </td>
                    <td className="px-4 py-3">
                      <TimesheetStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-[var(--color-text-primary)]">
                      {t.totalHours}h
                    </td>
                    <td className="px-4 py-3">
                      {t.payslip ? (
                        <Link className="link-accent font-mono text-xs hover:underline" href={`${base}/payslips/${t.payslip.id}`}>
                          {t.payslip.payslipNumber}
                        </Link>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={timesheetHref} className="link-accent text-sm font-semibold whitespace-nowrap">
                        {canSubmit ? "Submit hours →" : "View hours →"}
                      </Link>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="card-heading">Payslips</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {payslips.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-[var(--color-text-muted)]">
              No payslips yet for this view.
            </li>
          ) : (
            payslips.map((p) => (
              <li
                key={p.id}
                className="flex justify-between gap-4 rounded-xl border border-[var(--color-accent-tint)]/80 px-4 py-3 shadow-sm shadow-violet-950/[0.02]"
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">{p.payslipNumber}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {p.payPeriod.name ?? shortDate(p.payPeriod.startDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-[var(--color-text-primary)]">{money(p.netPay)}</p>
                  <Link href={`${base}/payslips/${p.id}`} className="text-xs font-semibold text-[var(--color-accent-light)] hover:underline">
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
