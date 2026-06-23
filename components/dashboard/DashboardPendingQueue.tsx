"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";
import { dispatchAdminStatsRefresh } from "@/lib/admin-stats-refresh";

type Row = {
  id: string;
  status: string;
  totalHours?: number;
  submittedAt: string | null;
  employee: { name: string; employeeCode: string };
};

export function DashboardPendingQueue({ items }: { items: Row[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function quickApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/timesheets/${id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus: "APPROVED" }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "Approval failed");
        return;
      }
      dispatchAdminStatsRefresh();
    } catch {
      setError("Approval failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="ui-panel !rounded-xl !border-[var(--elite-border)] !shadow-sm">
      <div className="card-header !mb-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="card-heading text-base text-[var(--elite-heading)]">Pending approvals</h2>
          <p className="card-subtitle">Timesheets waiting for your action</p>
        </div>
        <Link href="/admin/review" className="link-accent shrink-0 text-sm font-semibold">
          Review queue →
        </Link>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--elite-border)] px-4 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--elite-heading)]">All caught up</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">No timesheets need approval right now.</p>
          </div>
        ) : (
          items.map((row) => (
            <div key={row.id} className="dash-pending-row">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--elite-text)]">{row.employee.name}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  <span className="font-mono">{row.employee.employeeCode}</span>
                  {" · "}
                  {row.submittedAt ? shortDate(row.submittedAt) : "Not submitted"}
                  {typeof row.totalHours === "number" ? ` · ${row.totalHours}h` : ""}
                </p>
              </div>
              <TimesheetStatusBadge status={row.status} />
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/timesheets/${row.id}`}
                  className="text-xs font-semibold text-[var(--elite-accent)] hover:underline"
                >
                  Open
                </Link>
                <Button
                  variant="primary"
                  className="!h-8 !px-3 !text-xs"
                  disabled={busyId === row.id}
                  onClick={() => void quickApprove(row.id)}
                >
                  {busyId === row.id ? "…" : "Approve"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
