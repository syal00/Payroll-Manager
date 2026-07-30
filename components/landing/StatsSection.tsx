"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/landing/CountUp";

import { landingReveal, landingViewport } from "@/lib/landing-motion";

const STATS = [
  { end: 3, suffix: "", label: "User roles — admin, manager, employee", decimals: 0 },
  { end: 3, suffix: "", label: "Steps from hours to payslip", decimals: 0 },
  { end: 100, suffix: "%", label: "Audit trail on key actions", decimals: 0 },
  { end: 2, suffix: "", label: "Portals — admin and employee", decimals: 0 },
];

export function StatsSection() {
  return (
    <section className="lp-section lp-section--navy" id="numbers" data-testid="stats-section">
      <div className="lp-container">
        <motion.div
          className="mb-16 max-w-xl"
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          custom={0}
          variants={landingReveal}
        >
          <p className="lp-overline">Built for teams</p>
          <h2 className="lp-display mt-6 text-[clamp(2rem,5vw,3.25rem)]">
            What you get out of the <em className="lp-copper-italic">box</em>
          </h2>
        </motion.div>

        <div className="lp-stats-grid">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="visible"
              viewport={landingViewport}
              custom={i + 1}
              variants={landingReveal}
              data-testid={`stat-${i}`}
            >
              <CountUp
                end={stat.end}
                suffix={stat.suffix}
                decimals={stat.decimals}
                data-testid={`stat-value-${i}`}
              />
              <div className="lp-editorial-line my-4" />
              <p className="lp-stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
