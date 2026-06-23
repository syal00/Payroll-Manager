"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/landing/CountUp";

import { landingReveal, landingViewport } from "@/lib/landing-motion";

const STATS = [
  { end: 2, prefix: "£", suffix: "B+", label: "Processed annually", decimals: 0 },
  { end: 99.98, suffix: "%", label: "Accuracy rate", decimals: 2 },
  { end: 11000, suffix: "+", label: "Pay runs completed", decimals: 0 },
  { end: 37, suffix: " min", label: "Average run time", decimals: 0 },
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
          <p className="lp-overline">By the numbers</p>
          <h2 className="lp-display mt-6 text-[clamp(2rem,5vw,3.25rem)]">
            Proof, not <em className="lp-copper-italic">promises</em>
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
                prefix={stat.prefix}
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
