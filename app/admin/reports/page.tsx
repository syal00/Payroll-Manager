"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";

type Stats = {
  totalEmployees: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  generatedPayslips: number;
};

type Log = { action: string };

const violet = "#7c3aed";
const indigo = "#6366f1";
const emerald = "#10b981";
const amber = "#f59e0b";

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [actions, setActions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, logRes] = await Promise.all([fetch("/api/admin/stats"), fetch("/api/admin/audit-logs?pageSize=80")]);
        const sJson = await sRes.json();
        const lJson = await logRes.json();
        if (!cancelled) {
          if (!sJson.error) setStats(sJson);
          const counts: Record<string, number> = {};
          const items = (lJson.items ?? []) as Log[];
          for (const row of items) {
            const a = row.action ?? "OTHER";
            counts[a] = (counts[a] ?? 0) + 1;
          }
          setActions(counts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pipeData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Approved", value: stats.approvedSubmissions, fill: violet },
      { name: "Pending", value: stats.pendingSubmissions, fill: amber },
    ];
  }, [stats]);

  const deptBar = useMemo(() => {
    const entries = Object.entries(actions).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return entries.map(([name, total]) => ({ name: name.length > 18 ? `${name.slice(0, 16)}â€¦` : name, total }));
  }, [actions]);

  return (
    <div className="page-container space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Operational analytics"
        description="High-signal aggregates from live payroll workloadsâ€”composed from submissions, approvals, and audit entries already in your workspace."
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card min-h-[260px] rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-md lg:col-span-2">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-tint)] text-[var(--color-accent-light)]">
                  <BarChart3 className="h-5 w-5" aria-hidden strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-primary)]">Throughput mix</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">Comparison of finalized vs queued timesheets.</p>
                </div>
              </div>
              <div className="mt-6 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipeData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis width={42} stroke="#64748b" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 6, 6]}>
                      {pipeData.map((entry, idx) => (
                        <Cell key={entry.name} fill={idx === 0 ? violet : amber} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent-tint)] text-[var(--color-accent-light)]">
                  <PieChartIcon className="h-5 w-5" aria-hidden strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-primary)]">Headcount footprint</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">Active employees versus issued payslips.</p>
                </div>
              </div>
              <div className="mt-6 h-[220px] w-full">
                {stats.totalEmployees === 0 && stats.generatedPayslips === 0 ? (
                  <p className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-accent-soft)]/80 px-4 text-center text-sm text-[var(--color-text-muted)]">
                    Hire employees and issue payslips to unlock ratio insights.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Employees", value: Math.max(stats.totalEmployees, 0), fill: violet },
                          { name: "Payslips", value: Math.max(stats.generatedPayslips, 0), fill: indigo },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={74}
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                      <Tooltip
                        formatter={(value) => [Number(value ?? 0), "Total"]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-md">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Audit action distribution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Top actions surfaced from recent compliance history.</p>
            <div className="mt-6 h-[280px] w-full">
              {deptBar.length === 0 ? (
                <p className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-accent-soft)]/80 px-6 text-center text-sm text-[var(--color-text-muted)]">
                  Logs will illuminate once admins take additional actions beyond seeding events.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={deptBar} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="#e2e8f0" horizontal />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={120} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="total" radius={[0, 10, 10, 0]} fill={emerald} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </>
      ) : (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">Analytics unavailable.</p>
      )}
    </div>
  );
}
