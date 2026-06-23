const LOGOS = [
  "Northwind Logistics",
  "Apex Manufacturing",
  "Summit Healthcare",
  "BlueRiver Staffing",
  "Horizon Retail",
  "Pacific Services Co.",
  "Vertex Industries",
  "Cedar Point Group",
];

export function LogoTicker() {
  const items = [...LOGOS, ...LOGOS];

  return (
    <section className="lp-social" aria-label="Trusted by companies">
      <p className="lp-social-label">Trusted by industry leaders</p>
      <div className="lp-ticker-wrap">
        <div className="lp-ticker">
          {items.map((name, i) => (
            <span key={`${name}-${i}`} className="lp-ticker-item">
              <span className="lp-ticker-dot" aria-hidden />
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
