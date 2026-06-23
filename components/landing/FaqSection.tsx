"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { landingReveal, landingViewport } from "@/lib/landing-motion";

const FAQS = [
  {
    q: "How long does migration take?",
    a: "Most teams are live within two weeks. We handle data mapping, parallel runs, and a full reconciliation before you cut over.",
  },
  {
    q: "Which jurisdictions do you support?",
    a: "We currently support 14 jurisdictions across the UK, EU, and North America — with tax tables updated automatically each period.",
  },
  {
    q: "Is there an employee self-service portal?",
    a: "Yes. Employees submit timesheets, view payslips, and update personal details through a clean, mobile-friendly portal.",
  },
  {
    q: "How is pricing structured?",
    a: "Per-employee, per-month pricing with no hidden fees. Volume discounts apply above 200 employees. Book a demo for a tailored quote.",
  },
  {
    q: "What integrations are available?",
    a: "We integrate with major HRIS platforms, accounting software (Xero, QuickBooks, Sage), and bank payment rails via open banking APIs.",
  },
  {
    q: "How do you handle security?",
    a: "SOC 2 Type II certified, ISO 27001 compliant, GDPR-ready. All data encrypted at rest (AES-256) and in transit (TLS 1.3).",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="lp-section" id="faq" data-testid="faq-section">
      <div className="lp-container max-w-3xl">
        <motion.div
          className="mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          variants={landingReveal}
        >
          <p className="lp-overline">FAQ</p>
          <h2 className="lp-display mt-6 text-[clamp(2rem,5vw,3rem)]">
            Straight <em className="lp-copper-italic">answers</em>
          </h2>
        </motion.div>

        <div>
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="lp-faq-item" data-testid={`faq-item-${i}`}>
                <button
                  type="button"
                  className="lp-faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  data-testid={`faq-trigger-${i}`}
                >
                  {item.q}
                  <span className={`lp-faq-icon ${isOpen ? "is-open" : ""}`}>
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="lp-faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                      <div className="lp-faq-answer-inner">{item.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
