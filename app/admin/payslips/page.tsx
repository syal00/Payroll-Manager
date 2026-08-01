"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSearchBar } from "@/components/ui/PageSearchBar";
import { shortDate, money, formatPayPeriodLabel } from "@/lib/format";

type P = {
  id: string;
  payslipNumber: string;
  netPay: number;
  grossPay: number;
  markedSentAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
  employee: { name: string; user: { name: string } | null };
  payPeriod: { name: string | null; startDate: string; endDate: string };
};

export default function AdminPayslipsPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<P[]>([]);
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (appliedQ) params.set("q", appliedQ);

    let cancelled = false;
    fetch(`/api/payslips?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || j.error) return;
        setItems(j.items ?? []);
        setTotal(j.total ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [page, appliedQ]);

  useEffect(() => {
    const urlQ = searchParams.get("q");
    if (urlQ) {
      setQ(urlQ);
      setAppliedQ(urlQ);
      setPage(1);
    }
  }, [searchParams]);

  function applySearch() {
    setPage(1);
    setAppliedQ(q.trim());
  }

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

      <Card className="rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <PageSearchBar
              id="payslip-q"
              label="Employee name"
              value={q}
              placeholder="Name, email, or employee ID"
              onChange={setQ}
              onSubmit={applySearch}
            />
          </div>
          <Button type="button" variant="secondary" className="sm:mb-0.5 shrink-0" onClick={applySearch}>
            Search
          </Button>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="table-shell table-payslips min-w-[640px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Number</th>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Period</th>
                <th className="px-4 py-3.5">Net</th>
                <th className="px-4 py-3.5">Sent</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-[var(--color-text-muted)]">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {appliedQ ? `No payslips found for "${appliedQ}".` : "No payslips found"}
                    </p>
                    <p className="mt-1 text-xs">
                      {appliedQ
                        ? "Try a different name or clear the search."
                        : "Try another name or generate payslips from approved timesheets."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="table-row table-row-muted">
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-[var(--color-text-secondary)]">
                      {p.payslipNumber}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--color-text-primary)]">{p.employee.name}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
                      {formatPayPeriodLabel(p.payPeriod)}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold text-[var(--color-text-primary)]">
                      {money(p.netPay)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {p.markedSentAt ? shortDate(p.markedSentAt) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/payslips/${p.id}`}
                        title="Open payslip"
                        className="inline-flex h-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-[var(--color-accent-tint)] px-3 text-sm font-semibold text-[var(--color-accent-light)] transition hover:bg-[var(--color-accent)] hover:text-white md:min-h-0 md:min-w-0"
                      >
                        <FileText className="h-4 w-4 md:hidden" aria-hidden />
                        <span className="hidden md:inline">Open</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-accent-tint)] px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
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
