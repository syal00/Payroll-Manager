"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "none",
  borderRadius: "12px",
  fontSize: "12px",
  padding: "10px 12px",
  boxShadow: "0 12px 32px rgba(15,23,42,0.2)",
};
const tooltipLabelStyle = { color: "#cbd5e1", fontWeight: 600 };
const tooltipItemStyle = { color: "#f8fafc" };

export function PayrollNetTrendChart({
  data,
  height = 220,
}: {
  data: { label: string; net: number }[];
  height?: number;
}) {
  if (!data.length) {
    return <ChartEmpty caption="Processed payslip amounts will visualize here." />;
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fillNetPay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(v) => `$${v}`}
            width={54}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Net pay"]}
          />
          <Area type="monotone" dataKey="net" stroke="#7c3aed" strokeWidth={2} fill="url(#fillNetPay)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HoursTrendChart({
  data,
  height = 220,
}: {
  data: { label: string; hours: number }[];
  height?: number;
}) {
  if (!data.length) {
    return <ChartEmpty caption="Submission hours trends appear when data exists." />;
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} width={44} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            formatter={(value) => [`${Number(value ?? 0)}h`, "Hours"]}
          />
          <Bar dataKey="hours" radius={[8, 8, 4, 4]} fill="url(#hoursGrad)" />
          <defs>
            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmpty({ caption }: { caption: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-slate-50/80 px-4 text-center">
      <p className="max-w-[220px] text-sm font-medium text-[var(--color-text-muted)]">{caption}</p>
    </div>
  );
}
