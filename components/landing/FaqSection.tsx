"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { landingReveal, landingViewport } from "@/lib/landing-motion";
import { MARKETING_FAQS } from "@/lib/marketing-content";

const FAQS = MARKETING_FAQS;

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
