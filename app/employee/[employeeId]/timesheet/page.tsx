"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PayPeriodStatusBadge, TimesheetStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";
import { PayPeriodStatus } from "@/lib/enums";

type PeriodRow = {
  id: string;
  name: string | null;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
};

type TimesheetSummary = {
  status: string;
  totalHours: number;
  totalRegular: number;
  totalOvertime: number;
  totalLeave: number;
  submittedAt: string | null;
};

export default function PublicTimesheetIndexPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const base = `/employee/${employeeId}`;
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [timesheetByPeriod, setTimesheetByPeriod] = useState<Record<string, TimesheetSummary>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/employees/${employeeId}/pay-periods`)
      .then((r) => r.json())
      .then((j) => {
        setPeriods(j.payPeriods ?? []);
        setTimesheetByPeriod(j.timesheetByPeriod ?? {});
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent-tint)] border-t-[var(--color-primary)]"
          aria-hidden
        />
        Loading pay periods…
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl space-y-8">
      <Link href={`${base}/dashboard`} className="link-accent inline-flex items-center gap-1 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <div>
        <p className="page-eyebrow">Hours</p>
        <h1 className="page-title mt-1">My timesheets</h1>
        <p className="page-description">
          Open a period to submit or view your hours. Closed periods show your final submission (read-only).
        </p>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[640px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Pay period</th>
                <th className="px-4 py-3">Period status</th>
                <th className="px-4 py-3">Your submission</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                    No pay periods available yet.
                  </td>
                </tr>
              ) : (
                periods.map((p) => {
                  const ts = timesheetByPeriod[p.id];
                  const label = p.name ?? `${shortDate(p.startDate)} – ${shortDate(p.endDate)}`;
                  const canOpen =
                    p.status === PayPeriodStatus.OPEN || Boolean(ts);
                  return (
                    <tr key={p.id} className="table-row table-row-muted">
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                        {label}
                        {p.isCurrent && (
                          <span className="ml-2 text-xs font-semibold text-[var(--color-accent-light)]">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PayPeriodStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        {ts ? (
                          <TimesheetStatusBadge status={ts.status} />
                        ) : (
                          <span className="text-sm text-[var(--color-text-muted)]">Not started</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-primary)]">
                        {ts ? `${ts.totalHours}h` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canOpen ? (
                          <Link
                            href={`${base}/timesheet/${p.id}`}
                            className="link-accent text-sm font-semibold"
                          >
                            {p.status === PayPeriodStatus.OPEN && ts?.status === "DRAFT"
                              ? "Submit hours →"
                              : ts
                                ? "View hours →"
                                : "Start →"}
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
