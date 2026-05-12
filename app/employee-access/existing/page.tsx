"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function EmployeeExistingAccessPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deactivated, setDeactivated] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDeactivated(false);
    setLoading(true);
    try {
      const res = await fetch("/api/public/employees/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.deactivated) {
          setDeactivated(true);
          setError(data.error ?? "Your account has been deactivated. Please contact admin.");
          return;
        }
        if (data.issues?.length) {
          setError(data.issues.map((i: { message: string }) => i.message).join(" "));
        } else {
          setError(data.error ?? "Could not find your profile");
        }
        return;
      }
      window.location.href = data.redirect ?? "/employee-access";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-page-bg)]">
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 w-full max-w-md text-center">
          <Link href="/employee-access" className="link-accent text-sm">
            â† Back to employee access
          </Link>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Enter the same work email you used when you created your Employee ID.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className={deactivated ? "alert-warn" : "alert-error"} role="alert">
                {error}
              </div>
            )}
            <div>
              <label className="label-field" htmlFor="ex-email">
                Work email
              </label>
              <input
                id="ex-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1.5"
                placeholder="you@company.com"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "Looking you upâ€¦" : "Go to my dashboard"}
            </Button>
          </form>
          <p className="mt-6 border-t border-[var(--color-accent-tint)] pt-5 text-center text-xs text-slate-500">
            First visit?{" "}
            <Link href="/employee-access/register" className="link-accent font-semibold">
              Create your Employee ID
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
