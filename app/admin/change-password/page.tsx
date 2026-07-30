"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (newPassword.length < 8) {
      setErr("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("New passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not update password");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-heading)]">Set a new password</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Your account requires a password change before you can continue.
        </p>
      </div>
      {err ? <div className="alert-error">{err}</div> : null}
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold" htmlFor="cur-pass">
            Current (temporary) password
          </label>
          <input
            id="cur-pass"
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="new-pass">
            New password
          </label>
          <input
            id="new-pass"
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="confirm-pass">
            Confirm new password
          </label>
          <input
            id="confirm-pass"
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          disabled={busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Update password
        </button>
      </form>
    </div>
  );
}
