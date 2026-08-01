"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

/** Fixed theme control for employee-access (register / sign-in) pages. */
export function EmployeeAccessThemeBar() {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
      <div className="pointer-events-auto rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]">
        <ThemeToggle className="topbar-action-btn !h-10 !w-10" />
      </div>
    </div>
  );
}
