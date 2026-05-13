"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const TEAM = ["1-10", "11-50", "51-200", "200+"] as const;

export function DemoRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState<(typeof TEAM)[number]>("1-10");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, teamSize }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setDone(false);
    setName("");
    setEmail("");
    setCompany("");
    setTeamSize("1-10");
    setError(null);
    onClose();
  }

  return (
    <div className="modal-overlay z-[1200]" role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <div className="modal w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-modal)]">
        <h2 id="demo-title" className="text-lg font-bold text-[var(--color-text-primary)]">
          Request a Demo
        </h2>
        {done ? (
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
            Thanks! We&apos;ll be in touch within 24 hours.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            {error && <div className="alert-error text-sm">{error}</div>}
            <div>
              <label className="label-field" htmlFor="demo-name">
                Full name <span className="text-rose-600">*</span>
              </label>
              <input
                id="demo-name"
                className="input-field mt-1.5 w-full"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="demo-email">
                Work email <span className="text-rose-600">*</span>
              </label>
              <input
                id="demo-email"
                type="email"
                className="input-field mt-1.5 w-full"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="demo-company">
                Company name <span className="text-rose-600">*</span>
              </label>
              <input
                id="demo-company"
                className="input-field mt-1.5 w-full"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="demo-team">
                Team size
              </label>
              <select
                id="demo-team"
                className="input-field mt-1.5 w-full"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value as (typeof TEAM)[number])}
              >
                {TEAM.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Request Demo"}
              </Button>
            </div>
          </form>
        )}
        {done && (
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
