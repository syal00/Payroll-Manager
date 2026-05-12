"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { shortDate, money } from "@/lib/format";

export default function AdminPayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<{
    payslipNumber: string;
    hourlyRate: number;
    overtimeRate: number;
    regularHours: number;
    overtimeHours: number;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
    approvalDate: string | null;
    adminSignoff: string | null;
    markedSentAt: string | null;
    emailSentAt: string | null;
    items: { label: string; amount: number; type: string }[];
    payPeriod: { name: string | null; startDate: string; endDate: string };
    employee: { employeeCode: string; name: string; email: string };
    timesheet: { id: string };
  } | null>(null);
  const [emailPreview, setEmailPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/payslips/${id}`)
      .then((r) => r.json())
      .then((j) => setP(j.payslip));
  }, [id]);

  if (!p) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"
          aria-hidden
        />
        Loading payslip…
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl space-y-8 print:max-w-none">
      <div>
        <Link href="/admin/payslips" className="link-accent text-sm print-hidden">
          ← All payslips
        </Link>
        <div className="mt-4">
          <p className="page-eyebrow">Payslip</p>
          <h1 className="page-title mt-1 font-mono text-2xl tracking-tight md:text-3xl">{p.payslipNumber}</h1>
          <p className="page-description mt-2">
            {p.employee.name} · <span className="font-mono text-slate-700">{p.employee.employeeCode}</span>
          </p>
        </div>
      </div>

      <Card className="print:border print:shadow-none">
        <h2 className="card-heading">Pay period &amp; hours</h2>
        <p className="mt-1 text-sm text-slate-600">
          {p.payPeriod.name ?? `${shortDate(p.payPeriod.startDate)} – ${shortDate(p.payPeriod.endDate)}`}
        </p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-violet-50 bg-violet-50/30 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hours</dt>
            <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">
              {p.regularHours} reg · {p.overtimeHours} OT
            </dd>
          </div>
          <div className="rounded-xl border border-violet-50 bg-violet-50/30 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rates</dt>
            <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">
              {money(p.hourlyRate)} / {money(p.overtimeRate)} OT
            </dd>
          </div>
          <div className="rounded-xl border border-violet-50 bg-violet-50/30 px-4 py-3 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sign-off</dt>
            <dd className="mt-1 font-semibold text-[var(--color-text-primary)]">
              {p.adminSignoff ?? "—"} · {p.approvalDate ? shortDate(p.approvalDate) : "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="print:border print:shadow-none">
        <h2 className="card-heading">Earnings breakdown</h2>
        <ul className="mt-4 divide-y divide-violet-100/90 text-sm">
          {p.items.map((it, i) => (
            <li key={i} className="flex justify-between py-3 first:pt-0">
              <span className="text-slate-700">{it.label}</span>
              <span className="tabular-nums font-semibold text-[var(--color-text-primary)]">{money(it.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-white/12 pt-4 text-sm">
          <div className="flex justify-between font-semibold text-[var(--color-text-primary)]">
            <span>Gross pay</span>
            <span className="tabular-nums">{money(p.grossPay)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Deductions</span>
            <span className="tabular-nums">− {money(p.totalDeductions)}</span>
          </div>
          <div className="flex justify-between border-t border-violet-100 pt-3 text-lg font-bold text-violet-900">
            <span>Net pay</span>
            <span className="tabular-nums">{money(p.netPay)}</span>
          </div>
        </div>
      </Card>

      <Card className="print-hidden">
        <h2 className="card-heading">Actions</h2>
        <p className="mt-1 text-xs text-slate-500">Download, delivery, and related records</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/payslips/${id}/pdf`}
            className="btn btn-primary h-10 gap-2 px-4 shadow-sm"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download PDF
          </a>
          <Button
            variant="secondary"
            disabled={!!p.markedSentAt}
            onClick={async () => {
              await fetch(`/api/payslips/${id}/mark-sent`, { method: "POST" });
              const r = await fetch(`/api/payslips/${id}`).then((x) => x.json());
              setP(r.payslip);
            }}
          >
            {p.markedSentAt ? "Marked sent" : "Mark as sent"}
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const r = await fetch(`/api/payslips/${id}/email`, { method: "POST" });
              const j = await r.json();
              setEmailPreview(j.preview?.body ?? JSON.stringify(j));
            }}
          >
            Email preview / log
          </Button>
          <Link
            href={`/admin/timesheets/${p.timesheet.id}`}
            className="btn btn-secondary h-10 shadow-sm"
          >
            View timesheet
          </Link>
        </div>
        {emailPreview && (
          <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-page-bg)] p-4 text-xs text-[var(--color-text-muted)]">
            {emailPreview}
          </pre>
        )}
      </Card>
    </div>
  );
}
