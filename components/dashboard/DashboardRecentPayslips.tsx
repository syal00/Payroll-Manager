"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { money, shortDate } from "@/lib/format";

type Row = {
  id: string;
  payslipNumber: string;
  netPay: number;
  createdAt: string;
  employee: { name: string };
  payPeriod: { name: string | null };
};

export function DashboardRecentPayslips({
  items,
  payslipsListPath = "/admin/payslips",
  payslipDetailPathPrefix = "/admin/payslips",
}: {
  items: Row[];
  payslipsListPath?: string | null;
  payslipDetailPathPrefix?: string | null;
}) {
  return (
    <Card className="ui-panel dash-panel !rounded-2xl !border-[var(--elite-border)] !shadow-sm">
      <div className="card-header !mb-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="card-heading text-base text-[var(--elite-heading)]">Recent payslips</h2>
          <p className="card-subtitle">Latest disbursements</p>
        </div>
        {payslipsListPath ? (
          <Link href={payslipsListPath} className="link-accent shrink-0 text-sm font-semibold">
            View all
          </Link>
        ) : null}
      </div>

      <ul className="mt-5 divide-y divide-[var(--elite-border)]">
        {items.length === 0 ? (
          <li className="py-10 text-center text-sm text-[var(--text-muted)]">No payslips generated yet.</li>
        ) : (
          items.slice(0, 5).map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0">
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--elite-text)]">{row.employee.name}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  {row.payPeriod.name ?? row.payslipNumber} · {shortDate(row.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-sm font-semibold text-[var(--elite-heading)]">
                  {money(row.netPay)}
                </span>
                {payslipDetailPathPrefix ? (
                  <Link
                    href={`${payslipDetailPathPrefix}/${row.id}`}
                    className="text-xs font-semibold text-[var(--elite-accent)] hover:underline"
                  >
                    Open
                  </Link>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
