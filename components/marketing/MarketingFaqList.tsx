"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MARKETING_FAQS } from "@/lib/marketing-content";

export function MarketingFaqList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mkt-section">
      {MARKETING_FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="mkt-faq-item">
            <button
              type="button"
              className="mkt-faq-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              {item.q}
              <span style={{ transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>
                <Plus className="h-4 w-4" strokeWidth={1.5} />
              </span>
            </button>
            {isOpen ? <div className="mkt-faq-answer">{item.a}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
