"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function EmployeeExistingAccessPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deactivated, setDeactivated] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDeactivated(false);
    setDevOtp(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/employees/access/send-code", {
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
        setError(data.error ?? "Could not send code");
        return;
      }
      if (typeof data.devOtp === "string") setDevOtp(data.devOtp);
      setStep(2);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/employees/access/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
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
            ← Back to employee access
          </Link>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            {step === 1 ? "Welcome back" : "Enter your code"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {step === 1
              ? "Enter your work email. We will send a one-time code to verify it is you."
              : "Enter the 6-digit code we generated for your account."}
          </p>
        </div>

        <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
          {step === 1 ? (
            <form onSubmit={sendCode} className="space-y-5">
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
                {loading ? "Sending…" : "Send code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-5">
              {devOtp && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
                  <p className="font-semibold">Your one-time code is: {devOtp}</p>
                  <p className="mt-1 text-xs text-violet-900/90">
                    (In production this would be emailed to you.)
                  </p>
                </div>
              )}
              {error && (
                <div className="alert-error" role="alert">
                  {error}
                </div>
              )}
              <div>
                <label className="label-field" htmlFor="ex-code">
                  One-time code
                </label>
                <input
                  id="ex-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="input-field mt-1.5 font-mono tracking-widest"
                  placeholder="000000"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 flex-1"
                  disabled={loading}
                  onClick={() => {
                    setStep(1);
                    setCode("");
                    setError(null);
                    setDevOtp(null);
                  }}
                >
                  Back
                </Button>
                <Button type="submit" className="h-11 flex-1" disabled={loading}>
                  {loading ? "Verifying…" : "Verify"}
                </Button>
              </div>
            </form>
          )}
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
