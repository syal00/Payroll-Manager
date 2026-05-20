"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp, Minus } from "lucide-react";
import { staggerItem } from "@/lib/motion";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  href: string;
  icon: LucideIcon;
  trend?: string;
};

export function DashboardMetricCard({ label, value, hint, href, icon: Icon, trend }: Props) {
  const reduceMotion = useReducedMotion();
  const hasTrend = Boolean(trend && trend !== "—" && trend !== "-" && trend !== "Live");

  const inner = (
    <Link href={href} className="metric-card group">
      <div className="metric-card-top">
        <div className="metric-card-copy">
          <p className="metric-card-label">{label}</p>
          <p className="metric-card-value tabular-nums">{value}</p>
          {hint ? <p className="metric-card-hint">{hint}</p> : null}
        </div>
        <span className="metric-card-icon" aria-hidden>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
      <div className="metric-card-footer">
        <span className="metric-card-trend">
          {hasTrend ? (
            <TrendingUp className="h-3 w-3 text-emerald-600" aria-hidden />
          ) : (
            <Minus className="h-3 w-3 text-[var(--color-text-muted)]" aria-hidden />
          )}
          <span>{hasTrend ? trend : "Overview"}</span>
        </span>
        <span className="metric-card-link">Open →</span>
      </div>
    </Link>
  );

  if (reduceMotion) {
    return <div className="h-full">{inner}</div>;
  }

  return (
    <motion.div className="h-full" variants={staggerItem} whileHover={{ y: -2 }}>
      {inner}
    </motion.div>
  );
}
