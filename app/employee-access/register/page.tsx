"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function EmployeeRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [existsInfo, setExistsInfo] = useState<{ employeeCode: string; redirect: string } | null>(null);
  const [deactivated, setDeactivated] = useState(false);
  const [pendingInfo, setPendingInfo] = useState<{ employeeCode: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExistsInfo(null);
    setDeactivated(false);
    setPendingInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/employees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.status === 409 && data.exists && data.redirect) {
        setExistsInfo({ employeeCode: data.employeeCode, redirect: data.redirect });
        setError(data.error ?? "This email is already registered.");
        return;
      }
      if (res.status === 403 && data.deactivated) {
        setDeactivated(true);
        setError(
          data.error ??
            "This email belongs to a deactivated profile. Contact an administrator to restore access."
        );
        return;
      }
      if (res.ok && data.pendingApproval) {
        setPendingInfo({
          employeeCode: data.employeeCode as string,
          message:
            (data.message as string) ??
            "Your account is pending admin approval. You will be able to sign in after an administrator approves your profile.",
        });
        return;
      }
      if (!res.ok) {
        if (data.issues?.length) {
          setError(data.issues.map((i: { message: string }) => i.message).join(" "));
        } else {
          setError(data.error ?? "Could not create profile");
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
            ← Back to employee access
          </Link>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            Create your Employee ID
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            We validate your email, assign a unique ID, then open your personal dashboard.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div
                className={deactivated ? "alert-warn" : "alert-error"}
                role="alert"
              >
                {error}
              </div>
            )}
            {pendingInfo && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-950">
                <p className="font-semibold">Pending admin approval</p>
                <p className="mt-2 text-violet-900/90">{pendingInfo.message}</p>
                <p className="mt-3 font-mono text-xs font-bold text-violet-950">Employee ID: {pendingInfo.employeeCode}</p>
                <p className="mt-2 text-xs text-violet-800/90">
                  Save this ID. An administrator must approve your profile before you can use the employee portal.
                </p>
              </div>
            )}
            {existsInfo && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <p className="font-semibold">You&apos;re already set up</p>
                <p className="mt-1 text-amber-900/90">
                  Employee ID: <span className="font-mono font-bold">{existsInfo.employeeCode}</span>
                </p>
                <Link
                  href={existsInfo.redirect}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-amber-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900"
                >
                  Go to my dashboard
                </Link>
              </div>
            )}
            <div>
              <label className="label-field" htmlFor="reg-name">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field mt-1.5"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="reg-email">
                Work email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1.5"
                placeholder="you@company.com"
              />
              <p className="mt-1 text-xs text-slate-500">Use the email your employer recognizes.</p>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "Creating your profile…" : "Create profile & continue"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
