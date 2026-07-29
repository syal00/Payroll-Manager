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
  /** Override for super-admin drill-down (e.g. hide links by passing null). */
  payslipsListPath?: string | null;
  payslipDetailPathPrefix?: string | null;
}) {
  return (
    <Card className="ui-panel !rounded-xl !border-[var(--elite-border)] !shadow-sm">
      <div className="card-header !mb-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="card-heading text-base text-[var(--elite-heading)]">Recent payslips</h2>
          <p className="card-subtitle">Latest generated payroll slips</p>
        </div>
        {payslipsListPath ? (
          <Link href={payslipsListPath} className="link-accent shrink-0 text-sm font-semibold">
            View all →
          </Link>
        ) : null}
      </div>

      <div className="table-wrap mt-5">
        <table className="table-shell min-w-[400px]">
          <thead>
            <tr className="table-head">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Net pay</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  No payslips generated yet.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="table-row table-row-muted">
                  <td className="px-4 py-3 font-medium text-[var(--elite-text)]">{row.employee.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                    {row.payPeriod.name ?? "—"}
                  </td>
                  <td className="table-num px-4 py-3 font-medium text-[var(--elite-heading)]">
                    {money(row.netPay)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--text-muted)]">
                    {shortDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payslipDetailPathPrefix ? (
                      <Link
                        href={`${payslipDetailPathPrefix}/${row.id}`}
                        className="inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--elite-accent)] hover:bg-[var(--elite-accent-soft)]"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
