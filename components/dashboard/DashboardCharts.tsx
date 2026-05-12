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
  backgroundColor: "#1c0e0a",
  border: "1px solid rgba(232, 101, 10, 0.35)",
  borderRadius: "12px",
  fontSize: "12px",
  padding: "10px 12px",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
  color: "#f5f0e8",
};
const tooltipLabelStyle = { color: "#a09080", fontWeight: 600 };
const tooltipItemStyle = { color: "#f5f0e8" };

const AXIS_COLOR = "#6b5f58";
const GRID_COLOR = "#2a1a12";

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
              <stop offset="0%" stopColor="#e8650a" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#e8650a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={AXIS_COLOR}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={AXIS_COLOR}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            tickFormatter={(v) => `$${v}`}
            width={54}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ fill: "rgba(232, 101, 10, 0.08)" }}
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Net pay"]}
          />
          <Area type="monotone" dataKey="net" stroke="#e8650a" strokeWidth={2} fill="url(#fillNetPay)" />
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
          <CartesianGrid strokeDasharray="3 6" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={AXIS_COLOR}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={AXIS_COLOR}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            width={44}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ fill: "rgba(232, 101, 10, 0.08)" }}
            formatter={(value) => [`${Number(value ?? 0)}h`, "Hours"]}
          />
          <Bar dataKey="hours" radius={[8, 8, 4, 4]} fill="url(#hoursGrad)" />
          <defs>
            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffa563" />
              <stop offset="100%" stopColor="#e8650a" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmpty({ caption }: { caption: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-accent-soft)] px-4 text-center">
      <p className="max-w-[220px] text-sm font-medium text-[var(--color-text-muted)]">{caption}</p>
    </div>
  );
}
