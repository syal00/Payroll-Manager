"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPayPeriodLabel, money } from "@/lib/format";

type PayPeriodOption = {
  id: string;
  name: string | null;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

type PayoutRow = {
  payslipId: string;
  payslipNumber: string;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  regularHours: number;
  overtimeHours: number;
  employee: { id: string; name: string; employeeCode: string };
};

type PayoutSummary = {
  period: PayPeriodOption & { label: string; status: string };
  totals: {
    payslipCount: number;
    gross: number;
    net: number;
    deductions: number;
  };
  payouts: PayoutRow[];
};

type Props = {
  defaultPayPeriodId?: string | null;
  historyPathPrefix?: string;
};

export function DashboardPayPeriodPayouts({
  defaultPayPeriodId,
  historyPathPrefix = "/admin/history",
}: Props) {
  const [periods, setPeriods] = useState<PayPeriodOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingPeriods(true);
    fetch("/api/pay-periods")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Could not load pay periods");
        return j.payPeriods as PayPeriodOption[];
      })
      .then((rows) => {
        if (cancelled) return;
        setPeriods(rows);
        const initial =
          defaultPayPeriodId && rows.some((p) => p.id === defaultPayPeriodId)
            ? defaultPayPeriodId
            : rows.find((p) => p.isCurrent)?.id ?? rows[0]?.id ?? "";
        setSelectedId(initial);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingPeriods(false);
      });
    return () => {
      cancelled = true;
    };
  }, [defaultPayPeriodId]);

  const loadSummary = useCallback(async (payPeriodId: string) => {
    if (!payPeriodId) {
      setSummary(null);
      return;
    }
    setLoadingSummary(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/pay-periods/payouts?payPeriodId=${encodeURIComponent(payPeriodId)}`);
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Could not load payouts");
        setSummary(null);
        return;
      }
      setSummary(j as PayoutSummary);
    } catch {
      setErr("Network error");
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadSummary(selectedId);
  }, [selectedId, loadSummary]);

  const periodLabel = (p: PayPeriodOption) => {
    const label = formatPayPeriodLabel(p);
    return p.isCurrent ? `${label} (current)` : label;
  };

  return (
    <section className="ui-panel dash-panel rounded-2xl border border-[var(--elite-border)] bg-[var(--elite-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--elite-heading)]">Pay period payouts</h2>
          <p className="text-sm text-[var(--text-muted)]">Total paid to each employee in the selected period</p>
        </div>
        {selectedId && historyPathPrefix ? (
          <Link
            href={`${historyPathPrefix}/${selectedId}`}
            className="link-accent text-sm font-semibold"
          >
            Period details
          </Link>
        ) : null}
      </div>

      <div className="mt-4">
        <label className="label-field sr-only" htmlFor="dash-payout-period">
          Pay period
        </label>
        <select
          id="dash-payout-period"
          className="input-field max-w-full sm:max-w-md"
          value={selectedId}
          disabled={loadingPeriods || periods.length === 0}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {periods.length === 0 ? (
            <option value="">No pay periods</option>
          ) : (
            periods.map((p) => (
              <option key={p.id} value={p.id}>
                {periodLabel(p)}
              </option>
            ))
          )}
        </select>
      </div>

      {err ? (
        <p className="alert-error mt-4 text-sm" role="alert">
          {err}
        </p>
      ) : null}

      {loadingPeriods || loadingSummary ? (
        <p className="mt-6 py-8 text-center text-sm text-[var(--text-muted)]">Loading payouts…</p>
      ) : summary && summary.payouts.length === 0 ? (
        <p className="mt-6 py-10 text-center text-sm text-[var(--text-muted)]">
          No payslips issued for this pay period yet.
        </p>
      ) : summary ? (
        <>
          <ul className="mt-5 divide-y divide-[var(--elite-border)]">
            {summary.payouts.map((row) => (
              <li key={row.payslipId} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--elite-text)]">{row.employee.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {row.regularHours + row.overtimeHours}h
                    {row.overtimeHours > 0 ? ` (${row.overtimeHours}h OT)` : ""}
                    {" · "}
                    <span className="font-mono">{row.employee.employeeCode}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="tabular-nums text-sm font-semibold text-[var(--elite-heading)]">{money(row.netPay)}</p>
                    <p className="text-xs text-[var(--text-muted)]">Gross {money(row.grossPay)}</p>
                  </div>
                  <Link
                    href={`/admin/payslips/${row.payslipId}`}
                    className="text-xs font-semibold text-[var(--elite-accent)] hover:underline"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--elite-border)] bg-[var(--elite-surface)] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Total paid</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {summary.totals.payslipCount} employee{summary.totals.payslipCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="text-right">
              <p className="tabular-nums text-lg font-bold text-[var(--elite-heading)]">{money(summary.totals.net)}</p>
              <p className="text-xs text-[var(--text-muted)]">
                Gross {money(summary.totals.gross)}
                {summary.totals.deductions > 0 ? ` · Deductions ${money(summary.totals.deductions)}` : ""}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
