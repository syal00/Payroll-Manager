import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="page-eyebrow small-label">{eyebrow}</p> : null}
        <h1 className="page-title dashboard-title mt-1">{title}</h1>
        {description ? <p className="page-description mt-2 max-w-2xl text-[var(--color-text-secondary)]">{description}</p> : null}
      </div>
      {children ? <div className="page-header-actions flex flex-shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}
