"use client";

import { use, useEffect, useState } from "react";
import { shortDate } from "@/lib/format";

type PayslipRow = {
  id: string;
  payslipNumber: string;
  netPay: number;
  grossPay: number;
  createdAt: string;
  employee: { name: string; employeeCode: string };
  payPeriod: { name: string | null };
};

function money(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

export default function CompanyPayslipsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [items, setItems] = useState<PayslipRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/super-admin/companies/${companyId}/payslips?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else {
          setItems(j.items ?? []);
          setTotal(j.total ?? 0);
        }
      })
      .catch(() => setErr("Failed to load payslips"))
      .finally(() => setLoading(false));
  }, [companyId, page, q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page-container space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[var(--sa-heading)]">Payslips</h1>
        <p className="mt-1 text-sm text-[var(--sa-muted)]">Generated payslips for this tenant.</p>
      </div>

      <div className="sa-panel p-4">
        <input
          className="sa-input max-w-md"
          placeholder="Search employee name, username, ID…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
      </div>

      {err ? <div className="alert-error max-w-xl">{err}</div> : null}

      <div className="sa-panel overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-[var(--sa-muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--sa-muted)]">No payslips found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="sa-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Payslip #</th>
                  <th>Pay period</th>
                  <th>Gross</th>
                  <th>Net</th>
                  <th>Issued</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="font-medium text-[var(--sa-heading)]">{row.employee.name}</p>
                      <p className="sa-mono text-xs text-[var(--sa-muted)]">{row.employee.employeeCode}</p>
                    </td>
                    <td className="sa-mono text-xs">{row.payslipNumber}</td>
                    <td className="text-xs text-[var(--sa-muted)]">{row.payPeriod.name ?? "—"}</td>
                    <td className="text-sm">{money(row.grossPay)}</td>
                    <td className="text-sm font-semibold text-[var(--sa-heading)]">{money(row.netPay)}</td>
                    <td className="text-xs text-[var(--sa-muted)]">{shortDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-[var(--sa-muted)]">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <button type="button" className="sa-btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button
              type="button"
              className="sa-btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
