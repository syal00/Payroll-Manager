"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { landingReveal } from "@/lib/landing-motion";

const TRUST_ITEMS = [
  { label: "Timesheet submissions", sub: "Employees log hours each pay period" },
  { label: "Manager approvals", sub: "Review and sign off before payroll runs" },
  { label: "Payslip generation", sub: "PDF payslips from approved hours" },
];

type HeroProps = {
  onBookDemo: () => void;
};

export function Hero({ onBookDemo }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section ref={sectionRef} className="lp-hero" id="hero" data-testid="hero-section">
      <div className="lp-hero-orb-wrap" aria-hidden>
        <motion.div
          className="lp-hero-orb lp-hero-orb--1"
          style={reduceMotion ? undefined : { y: orbY1 }}
        />
        <motion.div
          className="lp-hero-orb lp-hero-orb--2"
          style={reduceMotion ? undefined : { y: orbY2 }}
        />
      </div>

      <div className="lp-container">
        <div className="lp-hero-grid">
          <div className="lp-hero-left">
            <motion.h1
              className="lp-display lp-hero-h1"
              initial="hidden"
              animate="visible"
              custom={0}
              variants={landingReveal}
            >
              Timesheets, approvals, and payslips{" "}
              <span className="lp-copper-italic">in one place</span>
            </motion.h1>

            <motion.p
              className="lp-hero-body"
              initial="hidden"
              animate="visible"
              custom={1}
              variants={landingReveal}
            >
              WorkLedger helps your team submit hours, route them through review, and
              generate payslips — with role-based access for admins, managers, and employees.
            </motion.p>

            <motion.ul
              className="lp-hero-features"
              initial="hidden"
              animate="visible"
              custom={2}
              variants={landingReveal}
            >
              {TRUST_ITEMS.map((item) => (
                <li key={item.label}>
                  <span className="lp-hero-check" aria-hidden>✓</span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.sub}</small>
                  </span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              className="lp-hero-actions"
              initial="hidden"
              animate="visible"
              custom={3}
              variants={landingReveal}
            >
              <MagneticButton onClick={onBookDemo} data-testid="hero-book-demo-btn">
                Request a Demo
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </MagneticButton>
              <a href="/login" className="lp-outline-btn" data-testid="hero-tour-btn">
                <Play className="h-4 w-4" strokeWidth={2} />
                Sign In to Dashboard
              </a>
            </motion.div>
          </div>

          <div className="lp-hero-right">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
