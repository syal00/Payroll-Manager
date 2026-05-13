"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ForgotAccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function onFind(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setMessage(data.message ?? "Check your details below.");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay z-[1200]" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
      <div className="modal w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-modal)]">
        <h2 id="forgot-title" className="text-lg font-bold text-[var(--color-text-primary)]">
          Reset Access
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Enter your email and we&apos;ll show your Employee ID so you can contact your admin.
        </p>
        <form onSubmit={onFind} className="mt-5 space-y-4">
          {error && <div className="alert-error text-sm">{error}</div>}
          {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">{message}</div>}
          <div>
            <label className="label-field" htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1.5 w-full"
              autoComplete="email"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Searching…" : "Find my account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
