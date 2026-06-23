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
import { useTheme } from "@/components/theme/ThemeProvider";

function useChartColors() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    axis: isDark ? "#94a3b8" : "#6c757d",
    grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    stroke: "#c5a021",
    fillStart: isDark ? "rgba(197,160,33,0.35)" : "rgba(197,160,33,0.45)",
    fillEnd: "rgba(197,160,33,0)",
    cursor: isDark ? "rgba(197,160,33,0.12)" : "rgba(197,160,33,0.08)",
    tooltip: {
      backgroundColor: isDark ? "#111d32" : "#ffffff",
      border: isDark ? "1px solid rgba(197,160,33,0.35)" : "1px solid #dee2e6",
      borderRadius: "12px",
      fontSize: "12px",
      padding: "10px 12px",
      boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.45)" : "0 8px 24px rgba(11,20,38,0.12)",
      color: isDark ? "#f1f5f9" : "#212529",
    },
    tooltipLabel: { color: isDark ? "#94a3b8" : "#6c757d", fontWeight: 600 },
    tooltipItem: { color: isDark ? "#f1f5f9" : "#212529" },
    barStart: isDark ? "#d4af37" : "#d4af37",
    barEnd: isDark ? "#a8861a" : "#c5a021",
  };
}

export function PayrollSummaryStackedChart({
  data,
  height = 260,
}: {
  data: { label: string; gross: number; deductions: number; net: number }[];
  height?: number;
}) {
  const colors = useChartColors();
  const isDark = colors.axis === "#94a3b8";

  if (!data.length) {
    return <ChartEmpty caption="Payroll totals by period will visualize here." />;
  }

  const series = {
    gross: isDark ? "#d4af37" : "#c5a021",
    deductions: isDark ? "#ef4444" : "#dc3545",
    net: isDark ? "#2dd4bf" : "#14b8a6",
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fillGross" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series.gross} stopOpacity={0.35} />
              <stop offset="100%" stopColor={series.gross} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillDeductions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series.deductions} stopOpacity={0.3} />
              <stop offset="100%" stopColor={series.deductions} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillNetSummary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series.net} stopOpacity={0.35} />
              <stop offset="100%" stopColor={series.net} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={colors.axis}
            tick={{ fill: colors.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={colors.axis}
            tick={{ fill: colors.axis, fontSize: 11 }}
            tickFormatter={(v) => `$${v}`}
            width={54}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={colors.tooltip}
            labelStyle={colors.tooltipLabel}
            itemStyle={colors.tooltipItem}
            cursor={{ fill: colors.cursor }}
            formatter={(value, name) => {
              const label =
                name === "gross" ? "Gross pay" : name === "deductions" ? "Deductions" : "Net pay";
              return [`$${Number(value ?? 0).toFixed(2)}`, label];
            }}
          />
          <Area
            type="monotone"
            dataKey="gross"
            stroke={series.gross}
            strokeWidth={2}
            fill="url(#fillGross)"
          />
          <Area
            type="monotone"
            dataKey="deductions"
            stroke={series.deductions}
            strokeWidth={2}
            fill="url(#fillDeductions)"
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke={series.net}
            strokeWidth={2}
            fill="url(#fillNetSummary)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PayrollNetTrendChart({
  data,
  height = 220,
}: {
  data: { label: string; net: number }[];
  height?: number;
}) {
  const colors = useChartColors();

  if (!data.length) {
    return <ChartEmpty caption="Processed payslip amounts will visualize here." />;
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fillNetPay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.45} />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={colors.axis}
            tick={{ fill: colors.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={colors.axis}
            tick={{ fill: colors.axis, fontSize: 11 }}
            tickFormatter={(v) => `$${v}`}
            width={54}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={colors.tooltip}
            labelStyle={colors.tooltipLabel}
            itemStyle={colors.tooltipItem}
            cursor={{ fill: colors.cursor }}
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Net pay"]}
          />
          <Area type="monotone" dataKey="net" stroke={colors.stroke} strokeWidth={2} fill="url(#fillNetPay)" />
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
  const colors = useChartColors();

  if (!data.length) {
    return <ChartEmpty caption="Submission hours trends appear when data exists." />;
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={colors.axis}
            tick={{ fill: colors.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={colors.axis}
            tick={{ fill: colors.axis, fontSize: 11 }}
            width={44}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={colors.tooltip}
            labelStyle={colors.tooltipLabel}
            itemStyle={colors.tooltipItem}
            cursor={{ fill: colors.cursor }}
            formatter={(value) => [`${Number(value ?? 0)}h`, "Hours"]}
          />
          <Bar dataKey="hours" radius={[8, 8, 4, 4]} fill="url(#hoursGrad)" />
          <defs>
            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.barStart} />
              <stop offset="100%" stopColor={colors.barEnd} />
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
