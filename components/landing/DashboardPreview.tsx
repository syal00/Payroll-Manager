"use client";

import { motion, useReducedMotion } from "framer-motion";
import { scaleIn, staggerContainer, staggerItem } from "@/lib/motion";

const metrics = [
  { label: "Payroll run", value: "2m", accent: true },
  { label: "Approved hrs", value: "1,248" },
  { label: "Team", value: "42" },
];

const activity = [
  { label: "Timesheets pending review", badge: "3", tone: "default" as const },
  { label: "Payslips ready to send", badge: "12", tone: "success" as const },
  { label: "Pay period closes Friday", badge: "Open", tone: "muted" as const },
];

const chartHeights = [38, 52, 44, 72, 58, 64, 48];

export function DashboardPreview() {
  const reduceMotion = useReducedMotion();

  const wrapperProps = reduceMotion
    ? { className: "landing-dashboard-preview" }
    : {
        className: "landing-dashboard-preview",
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: scaleIn,
      };

  const Wrapper = reduceMotion ? "div" : motion.div;

  return (
    <Wrapper {...wrapperProps}>
      <div className="landing-dashboard-glow" aria-hidden />
      <div className="landing-dashboard-preview-chrome">
        <span className="landing-dashboard-dot" />
        <span className="landing-dashboard-dot" />
        <span className="landing-dashboard-dot" />
        <span className="landing-dashboard-preview-title">Payroll overview</span>
        <span className="landing-dashboard-live">Live</span>
      </div>
      <div className="landing-dashboard-preview-body">
        {reduceMotion ? (
          <MetricsRow />
        ) : (
          <motion.div className="landing-dashboard-metrics" variants={staggerContainer} initial="hidden" animate="visible">
            {metrics.map((m) => (
              <motion.div key={m.label} className="landing-dashboard-metric" variants={staggerItem}>
                <span className="landing-dashboard-metric-label">{m.label}</span>
                <span className={`landing-dashboard-metric-value ${m.accent ? "is-accent" : ""}`}>{m.value}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="landing-dashboard-chart-wrap">
          <div className="landing-dashboard-chart-header">
            <span>Net pay trend</span>
            <span className="landing-dashboard-chart-pill">Last 7 periods</span>
          </div>
          <div className="landing-dashboard-chart" aria-hidden>
            {chartHeights.map((h, i) => (
              <div
                key={i}
                className={`landing-dashboard-bar ${i === 3 ? "is-highlight" : ""}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="landing-dashboard-rows">
          {activity.map((row) => (
            <div key={row.label} className="landing-dashboard-row">
              <span className="landing-dashboard-row-label">{row.label}</span>
              <span className={`landing-dashboard-badge ${row.tone === "success" ? "is-success" : ""} ${row.tone === "muted" ? "is-muted" : ""}`}>
                {row.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

function MetricsRow() {
  return (
    <div className="landing-dashboard-metrics">
      {metrics.map((m) => (
        <div key={m.label} className="landing-dashboard-metric">
          <span className="landing-dashboard-metric-label">{m.label}</span>
          <span className={`landing-dashboard-metric-value ${m.accent ? "is-accent" : ""}`}>{m.value}</span>
        </div>
      ))}
    </div>
  );
}
