"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { shortDate } from "@/lib/format";

type P = {
  id: string;
  payslipNumber: string;
  netPay: number;
  grossPay: number;
  markedSentAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
  employee: { name: string; user: { name: string } | null };
  payPeriod: { name: string | null; startDate: string };
};

export default function AdminPayslipsPage() {
  const [items, setItems] = useState<P[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/payslips?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.error) {
          setItems(j.items);
          setTotal(j.total);
        }
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="page-container max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Payroll"
        title="Payslip library"
        description="Locate historical payouts, prep PDF exports, and cross-check disbursement timelines without disrupting accounting sources."
      >
        <Link
          href="/admin/timesheets"
          className="btn btn-primary inline-flex h-11 shrink-0 items-center rounded-xl px-5 text-sm font-semibold shadow-lg shadow-violet-500/25"
        >
          Generate payslip
        </Link>
      </PageHeader>

      <Card className="rounded-2xl border-[var(--color-border)] !bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="label-field" htmlFor="payslip-q">
              Employee name
            </label>
            <input
              id="payslip-q"
              className="input-field mt-1.5"
              value={q}
              placeholder="Search…"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
            />
          </div>
          <Button variant="secondary" className="sm:mb-0.5" onClick={() => (setPage(1), load())}>
            Search
          </Button>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-white/95 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[640px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Number</th>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Period</th>
                <th className="px-4 py-3.5">Net</th>
                <th className="px-4 py-3.5">Sent</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-slate-500">
                    <p className="font-medium text-slate-700">No payslips found</p>
                    <p className="mt-1 text-xs">Try another name or generate payslips from approved timesheets.</p>
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-slate-700">{p.payslipNumber}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{p.employee.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {p.payPeriod.name ?? shortDate(p.payPeriod.startDate)}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-700">${p.netPay.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {p.markedSentAt ? shortDate(p.markedSentAt) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/payslips/${p.id}`}
                        className="inline-flex h-8 items-center rounded-lg bg-violet-100 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-200"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-violet-200 px-4 py-3.5 text-sm text-slate-600">
          <span>Total {total}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
