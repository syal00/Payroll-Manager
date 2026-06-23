"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

import { landingReveal, landingViewport } from "@/lib/landing-motion";

const TESTIMONIALS = [
  {
    quote:
      "We cut payroll processing from half a day to under forty minutes. The audit trail alone changed how our ops team works.",
    name: "Sarah Chen",
    role: "CFO, Northwind Logistics",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
  },
  {
    quote:
      "Finally, payroll software that doesn't feel like enterprise software from 2005. Clean, fast, and our team actually enjoys using it.",
    name: "Marcus Webb",
    role: "Finance Director, Apex Manufacturing",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    quote:
      "The compliance review was painless. Every approval documented, every jurisdiction covered — zero scrambling.",
    name: "Priya Nair",
    role: "Head of Operations, Summit Healthcare",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
  },
];

export function TestimonialsSection() {
  return (
    <section className="lp-section lp-section--navy" id="voices" data-testid="testimonials-section">
      <div className="lp-container">
        <motion.div
          className="lp-testimonials-header"
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          custom={0}
          variants={landingReveal}
        >
          <p className="lp-overline">Voices · field notes</p>
          <h2 className="lp-display mt-6 text-[clamp(2rem,5vw,3.25rem)]">
            What operators <em className="lp-copper-italic">say</em>
          </h2>
          <span className="lp-sticker lp-testimonials-badge">Loved by CFOs</span>
        </motion.div>

        <div className="lp-testimonial-cards">
          {TESTIMONIALS.map((t, i) => (
            <motion.article
              key={t.name}
              className="lp-testimonial-card lp-glass"
              initial="hidden"
              whileInView="visible"
              viewport={landingViewport}
              custom={i + 1}
              variants={landingReveal}
              data-testid={`testimonial-${i}`}
            >
              <Quote className="h-6 w-6 text-copper opacity-60" strokeWidth={1.5} />
              <p className="lp-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="lp-testimonial-author">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt=""
                  className="lp-testimonial-avatar"
                  width={44}
                  height={44}
                  loading="lazy"
                />
                <div>
                  <p className="lp-testimonial-name">{t.name}</p>
                  <p className="lp-testimonial-role">{t.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
