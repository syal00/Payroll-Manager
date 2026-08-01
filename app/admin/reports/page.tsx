"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { formatAuditAction } from "@/lib/format";

type Stats = {
  totalEmployees: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  generatedPayslips: number;
};

type Log = { action: string };

type AuditBarRow = {
  action: string;
  label: string;
  total: number;
};

const violet = "#7c3aed";
const indigo = "#6366f1";
const emerald = "#10b981";
const amber = "#f59e0b";

const chartGrid = "var(--color-border, #e2e8f0)";
const chartTick = "var(--color-text-muted, #64748b)";

function AuditTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: AuditBarRow }[];
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-[var(--color-text-primary)]">{row.label}</p>
      <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">{row.action}</p>
      <p className="mt-1 tabular-nums text-[var(--color-text-secondary)]">{row.total} events</p>
    </div>
  );
}

function ThroughputTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; value: number } }[];
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-[var(--color-text-primary)]">{row.name}</p>
      <p className="mt-0.5 tabular-nums text-[var(--color-text-secondary)]">{row.value} timesheets</p>
    </div>
  );
}

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

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Employees", value: Math.max(stats.totalEmployees, 0), fill: violet },
      { name: "Payslips issued", value: Math.max(stats.generatedPayslips, 0), fill: indigo },
    ];
  }, [stats]);

  const auditBars = useMemo((): AuditBarRow[] => {
    return Object.entries(actions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([action, total]) => ({
        action,
        label: formatAuditAction(action),
        total,
      }));
  }, [actions]);

  const throughputMax = useMemo(() => {
    const top = Math.max(stats?.approvedSubmissions ?? 0, stats?.pendingSubmissions ?? 0, 1);
    return Math.ceil(top * 1.15);
  }, [stats]);

  return (
    <div className="page-container space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Operational analytics"
        description="High-signal aggregates from live payroll workloads—composed from submissions, approvals, and audit entries already in your workspace."
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
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: violet }} aria-hidden />
                  Approved: <strong className="tabular-nums">{stats.approvedSubmissions}</strong>
                </span>
                <span className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: amber }} aria-hidden />
                  Pending: <strong className="tabular-nums">{stats.pendingSubmissions}</strong>
                </span>
              </div>
              <div className="mt-4 h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipeData} barCategoryGap="28%" margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="name" stroke={chartTick} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      width={36}
                      stroke={chartTick}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, throughputMax]}
                    />
                    <Tooltip content={<ThroughputTooltip />} cursor={{ fill: "var(--color-accent-soft)", opacity: 0.35 }} />
                    <Bar dataKey="value" maxBarSize={56} radius={[8, 8, 4, 4]}>
                      {pipeData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-accent-tint)] bg-[var(--color-accent-soft)] text-[var(--color-accent-light)]">
                  <PieChartIcon className="h-5 w-5" aria-hidden strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-primary)]">Headcount footprint</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">Active employees versus issued payslips.</p>
                </div>
              </div>
              {stats.totalEmployees === 0 && stats.generatedPayslips === 0 ? (
                <p className="mt-6 flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-accent-soft)]/80 px-4 text-center text-sm text-[var(--color-text-muted)]">
                  Hire employees and issue payslips to unlock ratio insights.
                </p>
              ) : (
                <>
                  <div className="mt-4 h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={68}
                          paddingAngle={3}
                          stroke="var(--color-bg-card, #fff)"
                          strokeWidth={2}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [Number(value ?? 0), name]}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid var(--color-border, #e2e8f0)",
                            fontSize: 12,
                            background: "var(--color-bg-card, #fff)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span className="text-xs text-[var(--color-text-secondary)]">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-3 text-center text-sm">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-soft)]/50 px-3 py-2">
                      <dt className="text-xs text-[var(--color-text-muted)]">Employees</dt>
                      <dd className="mt-0.5 text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                        {stats.totalEmployees}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-soft)]/50 px-3 py-2">
                      <dt className="text-xs text-[var(--color-text-muted)]">Payslips</dt>
                      <dd className="mt-0.5 text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                        {stats.generatedPayslips}
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </Card>
          </div>

          <Card className="border-[var(--color-border)] !bg-[var(--color-bg-card)]/95 backdrop-blur-md">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Audit action distribution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Top actions surfaced from recent compliance history.</p>
            <div className="mt-6 w-full" style={{ height: Math.max(280, auditBars.length * 52) }}>
              {auditBars.length === 0 ? (
                <p className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-accent-soft)]/80 px-6 text-center text-sm text-[var(--color-text-muted)]">
                  Logs will appear once admins take additional actions beyond seed events.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={auditBars}
                    margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} horizontal={false} />
                    <XAxis type="number" stroke={chartTick} tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={148}
                      stroke={chartTick}
                      tick={{ fontSize: 11, fill: chartTick }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<AuditTooltip />} cursor={{ fill: "var(--color-accent-soft)", opacity: 0.35 }} />
                    <Bar dataKey="total" maxBarSize={28} radius={[0, 8, 8, 0]} fill={emerald} />
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
