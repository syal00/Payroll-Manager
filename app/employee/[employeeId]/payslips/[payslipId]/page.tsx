"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { shortDate, money } from "@/lib/format";

export default function PublicPayslipDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string; payslipId: string }>;
}) {
  const { employeeId, payslipId } = use(params);
  const base = `/employee/${employeeId}`;
  const [p, setP] = useState<{
    payslipNumber: string;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
    regularHours: number;
    overtimeHours: number;
    hourlyRate: number;
    overtimeRate: number;
    items: { label: string; amount: number; type: string }[];
    payPeriod: { name: string | null; startDate: string; endDate: string };
    adminSignoff: string | null;
    approvalDate: string | null;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/employees/${employeeId}/payslips/${payslipId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setP(j.payslip);
      });
  }, [employeeId, payslipId]);

  if (err) {
    return <div className="alert-error max-w-xl">{err}</div>;
  }
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
    <div className="page-container max-w-2xl space-y-8 print:max-w-none">
      <div>
        <Link href={`${base}/payslips`} className="link-accent text-sm print-hidden">
          ← All payslips
        </Link>
        <p className="page-eyebrow mt-4">Payslip</p>
        <h1 className="page-title mt-1 font-mono text-2xl md:text-3xl">{p.payslipNumber}</h1>
      </div>

      <Card className="print:border print:shadow-none">
        <h2 className="card-heading">Pay period</h2>
        <p className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">
          {p.payPeriod.name ?? `${shortDate(p.payPeriod.startDate)} – ${shortDate(p.payPeriod.endDate)}`}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {p.regularHours}h regular · {p.overtimeHours}h OT · {money(p.hourlyRate)} base ·{" "}
          {money(p.overtimeRate)} OT
        </p>
        <a
          href={`/api/public/employees/${employeeId}/payslips/${payslipId}/pdf`}
          className="print-hidden mt-5 btn btn-primary h-10 gap-2 px-4 shadow-sm"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download PDF
        </a>
      </Card>

      <Card className="print:border print:shadow-none">
        <h2 className="card-heading">Earnings</h2>
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
            <span>Gross</span>
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
        <p className="mt-5 border-t border-violet-50 pt-4 text-xs text-slate-500">
          Approved by {p.adminSignoff ?? "—"} · {p.approvalDate ? shortDate(p.approvalDate) : "—"}
        </p>
      </Card>
    </div>
  );
}
