"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { staggerItem } from "@/lib/motion";

type IconVariant = "primary" | "success" | "warning" | "info";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  href: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  iconVariant?: IconVariant;
};

export function DashboardMetricCard({
  label,
  value,
  href,
  icon: Icon,
  trend,
  trendUp = true,
  iconVariant = "primary",
}: Props) {
  const reduceMotion = useReducedMotion();
  const hasTrend = Boolean(trend);

  const inner = (
    <Link href={href} className="dash-stat-card group">
      <div className="dash-stat-body">
        <span className={`dash-stat-icon dash-stat-icon--${iconVariant}`} aria-hidden>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="dash-stat-label">{label}</span>
        <span className="dash-stat-value tabular-nums">{value}</span>
        {hasTrend ? (
          <span className={`dash-stat-trend ${trendUp ? "positive" : "negative"}`}>
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden />
            )}
            <span>{trend}</span>
          </span>
        ) : null}
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
