"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock3, FileCheck } from "lucide-react";
import { landingReveal } from "@/lib/landing-motion";

const metrics = [
  { label: "Pending review", value: "6", delta: "2 new" },
  { label: "Hours logged", value: "248", delta: "+32" },
  { label: "Employees", value: "12", delta: "+1" },
];

const rows = [
  { label: "Timesheets submitted", value: "10" },
  { label: "Approved this period", value: "8" },
  { label: "Payslips generated", value: "5" },
];

const chartHeights = [38, 52, 44, 72, 58, 64, 48];

export function DashboardPreview() {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    if (reduceMotion) return;
    const bars = cardRef.current?.querySelectorAll(".lp-dashboard-bar");
    bars?.forEach((bar, i) => {
      (bar as HTMLElement).style.animationDelay = `${i * 0.07}s`;
      bar.classList.add("is-animated");
    });
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;

      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1200px) rotateY(${current.current.x}deg) rotateX(${current.current.y}deg)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [reduceMotion]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    target.current = { x: x * 3, y: -y * 3 };
  }

  function handleMouseLeave() {
    target.current = { x: 0, y: 0 };
  }

  const inner = (
    <div className="lp-dashboard-wrap" data-testid="dashboard-preview">
      <div
        ref={cardRef}
        className="lp-dashboard lp-glass"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="lp-dashboard-chrome">
          <span className="lp-dashboard-dot" />
          <span className="lp-dashboard-dot" />
          <span className="lp-dashboard-dot" />
          <span className="lp-dashboard-title">Admin Dashboard</span>
          <span className="lp-dashboard-live-label">Current pay period</span>
        </div>

        <div className="lp-dashboard-body">
          <div className="lp-dashboard-metrics">
            {metrics.map((m) => (
              <div key={m.label} className="lp-dashboard-metric">
                <span className="lp-dashboard-metric-label">{m.label}</span>
                <span className="lp-dashboard-metric-value">
                  {m.value}{" "}
                  <span className="lp-dashboard-metric-delta">{m.delta}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="lp-dashboard-chart-header">
            <span>Hours by week</span>
            <span className="lp-dashboard-pill">This period</span>
          </div>
          <div className="lp-dashboard-chart" aria-hidden>
            {chartHeights.map((h, i) => (
              <div
                key={i}
                className={`lp-dashboard-bar ${i === 3 ? "is-highlight" : ""}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <div className="lp-dashboard-rows">
            {rows.map((row) => (
              <div key={row.label} className="lp-dashboard-row">
                <span className="flex items-center">
                  <span className="lp-dashboard-row-dot" />
                  {row.label}
                </span>
                <span className="lp-dashboard-pill">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lp-dashboard-float-card lp-glass lp-dashboard-float-card--tl">
        <Clock3 className="h-4 w-4 text-copper" strokeWidth={1.5} />
        <span>6 pending</span>
      </div>
      <div className="lp-dashboard-float-card lp-glass lp-dashboard-float-card--br">
        <FileCheck className="h-4 w-4 text-copper" strokeWidth={1.5} />
        <span>8 approved</span>
      </div>
    </div>
  );

  if (reduceMotion) return inner;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      custom={2}
      variants={landingReveal}
    >
      {inner}
    </motion.div>
  );
}
