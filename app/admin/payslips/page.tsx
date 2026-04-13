"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileStack } from "lucide-react";
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
      <div>
        <p className="page-eyebrow">Payroll</p>
        <h1 className="page-title mt-1 flex flex-wrap items-center gap-2">
          <span className="stat-icon shrink-0">
            <FileStack className="h-5 w-5 text-violet-200" aria-hidden />
          </span>
          Payslips
        </h1>
        <p className="page-description">
          Search by employee, open records, and handle PDFs and delivery tracking.
        </p>
      </div>

      <Card>
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

      <Card padding={false} className="overflow-hidden">
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
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-slate-200">{p.payslipNumber}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-100">{p.employee.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {p.payPeriod.name ?? shortDate(p.payPeriod.startDate)}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-100">${p.netPay.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {p.markedSentAt ? shortDate(p.markedSentAt) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/payslips/${p.id}`}
                        className="link-accent text-sm font-semibold"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3.5 text-sm text-slate-600">
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
