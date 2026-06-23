"use client";

import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PayPeriodStatusBadge } from "@/components/status-badges";
import { shortDate } from "@/lib/format";

type PayPeriod = {
  id: string;
  name: string | null;
  startDate: string;
  endDate: string;
  status: string;
  timesheetCount: number;
  payslipCount: number;
  pendingCount: number;
  approvedCount: number;
};

export function DashboardPayPeriodCard({ period }: { period: PayPeriod }) {
  const title = period.name ?? "Current pay period";

  return (
    <Card className="ui-panel dash-pay-period !rounded-xl !border-[var(--elite-border)] !shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="dash-pay-period-icon" aria-hidden>
            <CalendarDays className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--elite-heading)]">{title}</h2>
              <PayPeriodStatusBadge status={period.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {shortDate(period.startDate)} – {shortDate(period.endDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="dash-pay-period-stat">
            <span className="dash-pay-period-stat-value">{period.timesheetCount}</span>
            <span className="dash-pay-period-stat-label">Timesheets</span>
          </div>
          <div className="dash-pay-period-stat">
            <span className="dash-pay-period-stat-value">{period.approvedCount}</span>
            <span className="dash-pay-period-stat-label">Approved</span>
          </div>
          <div className="dash-pay-period-stat">
            <span className="dash-pay-period-stat-value text-[var(--elite-warning)]">
              {period.pendingCount}
            </span>
            <span className="dash-pay-period-stat-label">Pending</span>
          </div>
          <div className="dash-pay-period-stat">
            <span className="dash-pay-period-stat-value">{period.payslipCount}</span>
            <span className="dash-pay-period-stat-label">Payslips</span>
          </div>
          <Link
            href="/admin/pay-periods"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--elite-accent)] hover:underline"
          >
            Manage
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </Card>
  );
}
