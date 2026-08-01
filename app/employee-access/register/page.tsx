"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function EmployeeRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [existsInfo, setExistsInfo] = useState<{ employeeCode?: string } | null>(null);
  const [deactivated, setDeactivated] = useState(false);
  const [pendingInfo, setPendingInfo] = useState<{ employeeCode: string; message: string } | null>(null);
  const [adminEmailInUse, setAdminEmailInUse] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExistsInfo(null);
    setDeactivated(false);
    setPendingInfo(null);
    setAdminEmailInUse(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public/employees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, contactEmail, password }),
      });
      const data = await res.json();
      if (res.status === 409 && data.adminEmailInUse) {
        setAdminEmailInUse(true);
        setError(
          data.error ??
            "This email is already used for an administrator account. Use the admin sign-in page or register with a different email."
        );
        return;
      }
      if (res.status === 409 && data.exists && data.alreadyRegistered) {
        setExistsInfo({ employeeCode: data.employeeCode });
        setError(data.error ?? "This contact email is already registered.");
        return;
      }
      if (res.status === 403 && data.deactivated) {
        setDeactivated(true);
        setError(
          data.error ??
            "This contact email belongs to a deactivated profile. Contact an administrator to restore access."
        );
        return;
      }
      if (res.ok && data.pendingApproval) {
        setPendingInfo({
          employeeCode: data.employeeCode,
          message:
            data.message ??
            "Your account is pending administrator approval. You can sign in once an admin approves your request.",
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
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Enter your name, email, and password. An administrator will review and approve your account before you can
            access the portal.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
          {pendingInfo ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-[var(--color-primary-muted)] bg-[var(--color-primary-light)] px-4 py-4 text-sm text-[var(--color-text-primary)]">
                <p className="font-semibold">Registration submitted</p>
                <p className="mt-2 text-[var(--color-text-secondary)]">{pendingInfo.message}</p>
                <p className="mt-3 text-[var(--color-text-secondary)]">
                  Your employee ID:{" "}
                  <span className="font-mono font-bold text-[var(--color-accent-light)]">{pendingInfo.employeeCode}</span>
                </p>
              </div>
              <Link
                href="/employee-access/existing"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-text-inverse)] shadow-sm transition hover:opacity-95"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <div className={deactivated ? "alert-warn" : "alert-error"} role="alert">
                  {error}
                </div>
              )}
              {adminEmailInUse && (
                <Link
                  href="/login"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:bg-[var(--color-bg-elevated)]"
                >
                  Go to administrator sign in
                </Link>
              )}
              {existsInfo && (
                <div className="rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-4 text-sm text-[var(--color-text-primary)]">
                  <p className="font-semibold">You&apos;re already registered</p>
                  {existsInfo.employeeCode ? (
                    <p className="mt-1 text-[var(--color-text-secondary)]">
                      Employee ID: <span className="font-mono font-bold">{existsInfo.employeeCode}</span>
                    </p>
                  ) : null}
                  <Link
                    href="/employee-access/existing"
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-text-inverse)] shadow-sm transition hover:opacity-95"
                  >
                    Sign in with email &amp; password
                  </Link>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field" htmlFor="reg-first-name">
                    First name
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field mt-1.5"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="label-field" htmlFor="reg-last-name">
                    Last name
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field mt-1.5"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="label-field" htmlFor="reg-contact-email">
                  Email
                </label>
                <input
                  id="reg-contact-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="input-field mt-1.5"
                />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Use the email your employer recognizes for notifications.
                </p>
              </div>
              <div>
                <label className="label-field" htmlFor="reg-password">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field mt-1.5"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="reg-confirm-password">
                  Confirm password
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field mt-1.5"
                />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? "Submitting…" : "Create account"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
