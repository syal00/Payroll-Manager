"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { shortDate, money } from "@/lib/format";

export default function PublicPayslipsPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const base = `/employee/${employeeId}`;
  const [items, setItems] = useState<
    { id: string; payslipNumber: string; netPay: number; payPeriod: { name: string | null; startDate: string } }[]
  >([]);

  useEffect(() => {
    fetch(`/api/public/employees/${employeeId}/payslips`)
      .then((r) => r.json())
      .then((j) => setItems(j.items ?? []));
  }, [employeeId]);

  return (
    <div className="page-container max-w-3xl space-y-8">
      <div>
        <p className="page-eyebrow">Payroll</p>
        <h1 className="page-title mt-1 flex flex-wrap items-center gap-2">
          <span className="stat-icon shrink-0">
            <FileText className="h-5 w-5 text-violet-200" aria-hidden />
          </span>
          Payslips
        </h1>
        <p className="page-description">Official pay records for your completed periods.</p>
      </div>

      <Card padding={false} className="overflow-hidden">
        <ul className="divide-y divide-violet-100/80">
          {items.length === 0 ? (
            <li className="px-6 py-12 text-center text-sm text-slate-500">
              <p className="font-medium text-slate-700">No payslips yet</p>
              <p className="mt-1 text-xs">They&apos;ll appear here after payroll generates them.</p>
            </li>
          ) : (
            items.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition hover:bg-violet-50/40"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-white">{p.payslipNumber}</p>
                  <p className="text-xs text-slate-500">
                    {p.payPeriod.name ?? shortDate(p.payPeriod.startDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-white">{money(p.netPay)}</p>
                  <Link href={`${base}/payslips/${p.id}`} className="text-xs font-semibold text-violet-700 hover:underline">
                    Details / PDF
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
