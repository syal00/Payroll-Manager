"use client";

import { motion } from "framer-motion";
import {
  Banknote,
  Eye,
  FileCheck,
  FileText,
  Lock,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { landingReveal, landingViewport } from "@/lib/landing-motion";

const FEATURES: {
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  span: string;
}[] = [
  {
    num: "01",
    icon: Lock,
    title: "Role-based access",
    desc: "Granular permissions for admins, managers, and employees — every action scoped to the right person.",
    span: "md:col-span-7",
  },
  {
    num: "02",
    icon: FileCheck,
    title: "Audit trail",
    desc: "A complete, immutable log of approvals, edits, and payslip generations for compliance reviews.",
    span: "md:col-span-5",
  },
  {
    num: "03",
    icon: FileText,
    title: "Payslips",
    desc: "Precision payslips generated from approved hours — accurate net pay, every period.",
    span: "md:col-span-5",
  },
  {
    num: "04",
    icon: ShieldCheck,
    title: "Compliance",
    desc: "Multi-jurisdiction rules baked in. Tax tables updated before your team notices.",
    span: "md:col-span-7",
  },
  {
    num: "05",
    icon: PenLine,
    title: "E-signed contracts",
    desc: "Onboarding documents signed digitally and filed alongside payroll records.",
    span: "md:col-span-4",
  },
  {
    num: "06",
    icon: Eye,
    title: "Quiet by design",
    desc: "No notification noise. Status updates when you need them, silence when you don't.",
    span: "md:col-span-4",
  },
  {
    num: "07",
    icon: Banknote,
    title: "Bank-grade controls",
    desc: "Dual-authorization on pay runs, encrypted at rest and in transit, SOC 2 audited.",
    span: "md:col-span-4",
  },
];

const reveal = landingReveal;

export function FeaturesBento() {
  return (
    <section className="lp-section" id="features" data-testid="features-section">
      <div className="lp-container">
        <motion.div
          className="mb-16 max-w-2xl"
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          custom={0}
          variants={reveal}
        >
          <p className="lp-overline">Platform capabilities</p>
          <h2 className="lp-display mt-6 text-[clamp(2rem,5vw,3rem)]">
            Everything you need to run <em className="lp-copper-italic">payroll</em>
          </h2>
        </motion.div>

        <div className="lp-bento">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.num}
                className={`lp-bento-card ${f.span}`}
                initial="hidden"
                whileInView="visible"
                viewport={landingViewport}
                custom={i}
                variants={reveal}
                data-testid={`feature-card-${f.num}`}
              >
                <p className="lp-bento-num">— {f.num}</p>
                <div className="lp-bento-icon">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="lp-bento-title">{f.title}</h3>
                <p className="lp-bento-desc">{f.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
