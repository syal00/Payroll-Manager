"use client";

import type { ReactNode } from "react";

export function MobileMenuHamburger({
  open,
  onClick,
  label = "Open menu",
  className = "",
}: {
  open: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`mobile-menu-hamburger ${open ? "mobile-menu-hamburger-open" : ""} ${className}`.trim()}
      aria-label={label}
      aria-expanded={open}
      onClick={onClick}
    >
      <span className="mobile-menu-hamburger-line" />
      <span className="mobile-menu-hamburger-line" />
      <span className="mobile-menu-hamburger-line" />
    </button>
  );
}

export function MobileSlideMenu({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="mobile-slide-menu-root" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" className="mobile-slide-menu-backdrop" aria-label="Close menu" onClick={onClose} />
      <div className="mobile-slide-menu-panel">
        <div className="mobile-slide-menu-header">
          <div className="min-w-0 flex-1 truncate text-sm font-extrabold uppercase tracking-[0.12em] text-white">
            {title}
          </div>
          <button type="button" className="icon-btn border-0 text-white" aria-label="Close menu" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mobile-slide-menu-body">{children}</div>
      </div>
    </div>
  );
}
