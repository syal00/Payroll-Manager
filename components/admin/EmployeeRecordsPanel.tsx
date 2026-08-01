"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate, money, formatPayPeriodLabel } from "@/lib/format";

type TimesheetRow = {
  id: string;
  status: string;
  totalHours: number;
  submittedAt: string | null;
  payPeriod: { name: string | null; startDate: string; endDate: string };
  payslip: { id: string; payslipNumber: string } | null;
};

type PayslipRow = {
  id: string;
  payslipNumber: string;
  netPay: number;
  createdAt: string;
  payPeriod: { name: string | null; startDate: string; endDate: string };
};

export function EmployeeRecordsPanel({
  employeeId,
  timesheets,
  payslips,
  disabled,
}: {
  employeeId: string;
  timesheets: TimesheetRow[];
  payslips: PayslipRow[];
  disabled: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function deleteTimesheet(id: string) {
    if (!window.confirm("Delete this timesheet and any linked payslip? It will be removed from the employee portal too.")) {
      return;
    }
    setErr(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/timesheets/${id}`, { method: "DELETE" });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function deletePayslip(id: string) {
    if (!window.confirm("Delete this payslip? It will be removed from the employee portal too.")) {
      return;
    }
    setErr(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/payslips/${id}`, { method: "DELETE" });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Submitted hours and payslips for this employee. Deleting here removes them from the employee portal as well.
      </p>
      {err ? <p className="text-sm text-[var(--color-danger-text)]">{err}</p> : null}

      <div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Timesheets ({timesheets.length})</h3>
        {timesheets.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">No timesheets on file.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
            {timesheets.map((ts) => (
              <li key={ts.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {formatPayPeriodLabel(ts.payPeriod)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {ts.totalHours}h · {ts.submittedAt ? `Submitted ${shortDate(ts.submittedAt)}` : "Not submitted"}
                    {ts.payslip ? ` · Payslip ${ts.payslip.payslipNumber}` : ""}
                  </p>
                  <TimesheetStatusBadge status={ts.status} />
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/admin/timesheets/${ts.id}`}
                    className="btn btn-secondary h-8 px-3 text-xs"
                  >
                    Open
                  </Link>
                  {!disabled ? (
                    <Button
                      type="button"
                      variant="danger"
                      className="h-8 gap-1 px-3 text-xs"
                      disabled={busyId === ts.id}
                      onClick={() => void deleteTimesheet(ts.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Payslips ({payslips.length})</h3>
        {payslips.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">No payslips on file.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
            {payslips.map((ps) => (
              <li key={ps.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono font-medium text-[var(--color-text-primary)]">{ps.payslipNumber}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {formatPayPeriodLabel(ps.payPeriod)} · Net {money(ps.netPay)} · {shortDate(ps.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/admin/payslips/${ps.id}`} className="btn btn-secondary h-8 px-3 text-xs">
                    Open
                  </Link>
                  {!disabled ? (
                    <Button
                      type="button"
                      variant="danger"
                      className="h-8 gap-1 px-3 text-xs"
                      disabled={busyId === ps.id}
                      onClick={() => void deletePayslip(ps.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
