"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";

type Row = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  teamSize: string | null;
  createdAt: string;
};

export default function AdminDemoRequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/demo-requests")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setRows(j.items ?? []);
      })
      .catch(() => setErr("Failed to load"));
  }, []);

  return (
    <div className="page-container max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Marketing"
        title="Demo requests"
        description="Contacts who requested a demo from the public site."
      />
      {err && <div className="alert-error">{err}</div>}
      <Card padding={false} className="overflow-hidden rounded-2xl border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="table-shell min-w-[720px]">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Company</th>
                <th className="px-4 py-3.5">Team size</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    No demo requests yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="table-row table-row-muted">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]">{r.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{r.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.company ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.teamSize ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
