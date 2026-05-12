"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";

export function UserMenu({
  userName,
  emailHint,
  onLogout,
}: {
  userName: string;
  emailHint?: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [open]);

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-2 py-1.5 pl-3 pr-2 text-left shadow-sm transition hover:border-violet-200 hover:shadow-[0_4px_20px_rgba(124,58,237,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
          {initials || "A"}
        </span>
        <span className="hidden min-w-0 text-left md:block">
          <span className="block truncate text-[13px] font-semibold text-[#0f172a]">{userName}</span>
          {emailHint ? <span className="block truncate text-[11px] text-[var(--color-text-muted)]">{emailHint}</span> : null}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[160] mt-2 w-[min(100vw-2rem,220px)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-[0_16px_48px_rgba(15,23,42,0.12)]"
        >
          <Link
            href="/admin/profile"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#0f172a] hover:bg-violet-50"
            onClick={() => setOpen(false)}
          >
            <UserCircle className="h-4 w-4 text-violet-600" aria-hidden />
            Profile
          </Link>
          <Link
            href="/admin/settings"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#0f172a] hover:bg-violet-50"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4 text-violet-600" aria-hidden />
            Settings
          </Link>
          <div className="my-1 h-px bg-[var(--color-border)]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
