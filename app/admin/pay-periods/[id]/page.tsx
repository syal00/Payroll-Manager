"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock3, Receipt } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PayPeriodStatusBadge, TimesheetStatusBadge } from "@/components/status-badges";
import { formatPayPeriodLabel, money, shortDate } from "@/lib/format";
import { dispatchAdminStatsRefresh } from "@/lib/admin-stats-refresh";

type PeriodDetail = {
  period: {
    id: string;
    name: string | null;
    startDate: string;
    endDate: string;
    status: string;
    isCurrent: boolean;
  };
  summary: {
    timesheetCount: number;
    payslipCount: number;
    totalHours: number;
    timesheetsByStatus: Record<string, number>;
  };
  timesheets: {
    id: string;
    status: string;
    totalHours: number;
    submittedAt: string | null;
    employee: { id: string; name: string; employeeCode: string };
    payslip: { id: string; payslipNumber: string; netPay: number } | null;
  }[];
  payslips: {
    id: string;
    payslipNumber: string;
    netPay: number;
    employee: { name: string; employeeCode: string };
  }[];
};

export default function PayPeriodWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const payPeriodId = params.id as string;
  const [data, setData] = useState<PeriodDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!payPeriodId) return;
    setLoading(true);
    setErr(null);
    fetch(`/api/admin/history/pay-periods/${payPeriodId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setErr(j.error ?? "Could not load pay period");
          setData(null);
          return;
        }
        setData(j as PeriodDetail);
      })
      .catch(() => {
        setErr("Network error");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [payPeriodId]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchPeriod(patch: { status?: string; isCurrent?: boolean }) {
    setErr(null);
    setMsg(null);
    const res = await fetch(`/api/pay-periods/${payPeriodId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? "Update failed");
      return;
    }
    setMsg(patch.status === "CLOSED" ? "Pay period closed." : "Pay period opened.");
    load();
  }

  async function applyAction(id: string, newStatus: "APPROVED" | "REJECTED") {
    if (newStatus === "REJECTED") {
      const reason = window.prompt("Rejection reason (shown to the employee):");
      if (!reason?.trim()) return;
      setBusyId(id);
      try {
        const res = await fetch(`/api/admin/timesheets/${id}/approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus, comment: null, rejectionReason: reason.trim() }),
        });
        if (res.ok) {
          setMsg("Timesheet rejected.");
          load();
          dispatchAdminStatsRefresh();
        } else {
          const j = await res.json();
          setErr(j.error ?? "Reject failed");
        }
      } finally {
        setBusyId(null);
      }
      return;
    }

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/timesheets/${id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, comment: null, rejectionReason: null }),
      });
      if (res.ok) {
        setMsg("Timesheet approved.");
        load();
        dispatchAdminStatsRefresh();
      } else {
        const j = await res.json();
        setErr(j.error ?? "Approve failed");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function genPayslip(timesheetId: string) {
    setBusyId(timesheetId);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/timesheets/${timesheetId}/payslip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Payslip generation failed");
        return;
      }
      setMsg("Payslip generated.");
      load();
      dispatchAdminStatsRefresh();
      if (j.payslip?.id) {
        router.push(`/admin/payslips/${j.payslip.id}`);
      }
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="page-container max-w-6xl">
        <p className="text-sm text-[var(--color-text-muted)]">Loading pay period…</p>
      </div>
    );
  }

  if (err && !data) {
    return (
      <div className="page-container max-w-6xl space-y-4">
        <Link href="/admin/pay-periods" className="link-accent inline-flex items-center gap-1 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to pay periods
        </Link>
        <div className="alert-error text-sm">{err}</div>
      </div>
    );
  }

  if (!data) return null;

  const { period, summary, timesheets, payslips } = data;
  const label = formatPayPeriodLabel(period);

  return (
    <div className="page-container max-w-6xl space-y-8">
      <Link href="/admin/pay-periods" className="link-accent inline-flex items-center gap-1 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to pay periods
      </Link>

      <PageHeader
        eyebrow="Pay period workspace"
        title={label}
        description="Review submitted hours, approve or reject timesheets, and generate payslips for this period."
      >
        <div className="flex flex-wrap items-center gap-2">
          <PayPeriodStatusBadge status={period.status} />
          {period.isCurrent ? (
            <span className="rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent-light)]">
              Current
            </span>
          ) : null}
          {period.status !== "OPEN" ? (
            <Button variant="secondary" className="h-9 text-xs" onClick={() => void patchPeriod({ status: "OPEN", isCurrent: true })}>
              Open period
            </Button>
          ) : null}
          {period.status !== "CLOSED" ? (
            <Button variant="secondary" className="h-9 text-xs" onClick={() => void patchPeriod({ status: "CLOSED" })}>
              Close period
            </Button>
          ) : null}
        </div>
      </PageHeader>

      {err ? <div className="alert-error rounded-2xl text-sm">{err}</div> : null}
      {msg ? <div className="alert-success rounded-2xl text-sm">{msg}</div> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-4">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Clock3 className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Timesheets</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{summary.timesheetCount}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{summary.totalHours.toFixed(1)} total hours</p>
        </Card>
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-4">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Receipt className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Payslips</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{summary.payslipCount}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {summary.timesheetsByStatus.PENDING ?? 0} pending · {summary.timesheetsByStatus.APPROVED ?? 0} approved
          </p>
        </Card>
        <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Period dates</p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
            {shortDate(period.startDate)} — {shortDate(period.endDate)}
          </p>
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
        <div className="border-b border-[var(--color-border)] px-4 py-3.5">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Submitted hours</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Approve, reject, open details, or generate payslips for approved timesheets.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[900px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Hours</th>
                <th className="px-4 py-3.5">Submitted</th>
                <th className="px-4 py-3.5">Payslip</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">
                    No timesheets submitted for this period yet.
                  </td>
                </tr>
              ) : (
                timesheets.map((row) => (
                  <tr key={row.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-[var(--color-text-primary)]">{row.employee.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-text-muted)]">
                        {row.employee.employeeCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <TimesheetStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-[var(--color-text-primary)]">
                      {row.totalHours}h
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {row.submittedAt ? shortDate(row.submittedAt) : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--color-text-secondary)]">
                      {row.payslip ? (
                        <Link href={`/admin/payslips/${row.payslip.id}`} className="link-accent font-semibold">
                          {row.payslip.payslipNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="h-8 px-2.5 text-xs"
                          disabled={busyId === row.id || row.status === "APPROVED" || row.status === "DRAFT"}
                          onClick={() => void applyAction(row.id, "APPROVED")}
                        >
                          {row.status === "REJECTED" ? "Approve again" : "Approve"}
                        </Button>
                        <Button
                          variant="danger"
                          className="h-8 px-2.5 text-xs"
                          disabled={busyId === row.id || row.status === "REJECTED" || row.status === "DRAFT"}
                          onClick={() => void applyAction(row.id, "REJECTED")}
                        >
                          {row.status === "APPROVED" ? "Revoke" : "Reject"}
                        </Button>
                        {row.status === "APPROVED" && !row.payslip ? (
                          <Button
                            className="h-8 px-2.5 text-xs"
                            disabled={busyId === row.id}
                            onClick={() => void genPayslip(row.id)}
                          >
                            Generate slip
                          </Button>
                        ) : null}
                        <Link
                          href={`/admin/timesheets/${row.id}`}
                          className="inline-flex h-8 items-center rounded-lg bg-[var(--color-accent-tint)] px-3 text-xs font-semibold text-[var(--color-accent-light)] hover:bg-[var(--color-accent)] hover:text-white"
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {payslips.length > 0 ? (
        <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95">
          <div className="border-b border-[var(--color-border)] px-4 py-3.5">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Payslips ({payslips.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table-shell min-w-[640px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3.5">Number</th>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Net</th>
                  <th className="px-4 py-3.5 text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5 font-mono text-sm text-[var(--color-text-secondary)]">{p.payslipNumber}</td>
                    <td className="px-4 py-3.5 text-[var(--color-text-primary)]">
                      {p.employee.name}
                      <span className="ml-2 font-mono text-[10px] text-[var(--color-text-muted)]">{p.employee.employeeCode}</span>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-[var(--color-text-primary)]">
                      {money(p.netPay)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/payslips/${p.id}`}
                        className="inline-flex h-8 items-center rounded-lg bg-[var(--color-accent-tint)] px-3 text-xs font-semibold text-[var(--color-accent-light)] hover:bg-[var(--color-accent)] hover:text-white"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
