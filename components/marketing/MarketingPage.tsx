import Link from "next/link";
import { ArrowRight } from "lucide-react";

type MarketingAction = {
  label: string;
  href: string;
  primary?: boolean;
};

type MarketingPageProps = {
  overline?: string;
  title: string;
  lead?: string;
  actions?: MarketingAction[];
  wide?: boolean;
  children: React.ReactNode;
};

export function MarketingPage({
  overline,
  title,
  lead,
  actions,
  wide = false,
  children,
}: MarketingPageProps) {
  return (
    <article className={`mkt-page ${wide ? "mkt-page--wide" : ""}`}>
      {overline ? <p className="mkt-overline">{overline}</p> : null}
      <h1 className="mkt-title">{title}</h1>
      {lead ? <p className="mkt-lead">{lead}</p> : null}
      {actions && actions.length > 0 ? (
        <div className="mkt-actions">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={`mkt-btn ${action.primary ? "mkt-btn--primary" : "mkt-btn--secondary"}`}
            >
              {action.label}
              {action.primary ? <ArrowRight className="h-4 w-4" strokeWidth={2} /> : null}
            </Link>
          ))}
        </div>
      ) : null}
      {children}
    </article>
  );
}
