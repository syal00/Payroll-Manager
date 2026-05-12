"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { shortDate } from "@/lib/format";

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
};

export default function AdminHistoryPage() {
  const [items, setItems] = useState<Log[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/admin/audit-logs?${params}`)
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
    <div className="page-container max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Compliance"
        title="Audit trail"
        description="Immutable ledger of decisive actions—from schedule mutations to disbursement confirmations."
      />

      <Card className="rounded-2xl border-[var(--color-border)] !bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="label-field" htmlFor="audit-q">
              Search action or entity
            </label>
            <input
              id="audit-q"
              className="input-field mt-1.5"
              value={q}
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
        <div className="divide-y divide-[var(--color-border)]">
          {items.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-slate-500">
              <p className="font-medium text-slate-700">No log entries match</p>
              <p className="mt-1 text-xs">Try a broader search or a different page.</p>
            </div>
          ) : (
            items.map((row) => (
              <div key={row.id} className="px-4 py-4 text-sm transition hover:bg-violet-50/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-violet-900">{row.action}</span>
                  <span className="text-xs text-slate-500">{shortDate(row.createdAt)}</span>
                  {row.actor && <span className="text-xs font-medium text-slate-600">{row.actor.name}</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {row.entityType}
                  {row.entityId ? ` · ${row.entityId}` : ""}
                </p>
                {row.details && (
                  <pre className="mt-2 max-h-24 overflow-auto rounded-xl border border-[var(--color-border)] bg-slate-950 p-3 text-xs text-slate-300">
                    {row.details}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
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
