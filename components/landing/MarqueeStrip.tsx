function MarqueeGroup({
  items,
  variant,
}: {
  items: string[];
  variant: "serif" | "tags";
}) {
  return (
    <>
      {items.map((item) => (
        <span
          key={item}
          className={variant === "serif" ? "lp-marquee-serif" : "lp-marquee-tags"}
        >
          {variant === "tags" ? `${item} ·` : `${item} ·`}
        </span>
      ))}
    </>
  );
}

function MarqueeRow({
  items,
  variant,
  direction,
}: {
  items: string[];
  variant: "serif" | "tags";
  direction: "fwd" | "rev";
}) {
  return (
    <div className="lp-marquee-row" data-testid={`marquee-row-${direction}`}>
      <div className={`lp-marquee-track lp-marquee-track--${direction}`}>
        <div className="lp-marquee-group" aria-hidden={false}>
          <MarqueeGroup items={items} variant={variant} />
        </div>
        <div className="lp-marquee-group" aria-hidden>
          <MarqueeGroup items={items} variant={variant} />
        </div>
      </div>
    </div>
  );
}

const ROW1 = [
  "Timesheets",
  "Approvals",
  "Payslips",
  "Pay periods",
  "Employee portal",
  "Audit log",
  "Reports",
];

const ROW2 = [
  "admins",
  "managers",
  "supervisors",
  "employees",
  "hourly rates",
  "overtime",
  "leave hours",
  "PDF export",
];

export function MarqueeStrip() {
  return (
    <section className="lp-marquee-section lp-marquee-section--navy" aria-label="Trust indicators" data-testid="marquee-section">
      <MarqueeRow items={ROW1} variant="serif" direction="fwd" />
      <MarqueeRow items={ROW2} variant="tags" direction="rev" />
    </section>
  );
}
