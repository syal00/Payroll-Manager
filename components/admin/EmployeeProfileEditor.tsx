"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function EmployeeProfileEditor({
  employeeId,
  initialJobTitle,
  initialDepartment,
  disabled,
}: {
  employeeId: string;
  initialJobTitle: string | null;
  initialDepartment: string | null;
  disabled: boolean;
}) {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [department, setDepartment] = useState(initialDepartment ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitle.trim() || null,
          department: department.trim() || null,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Save failed");
        return;
      }
      setMsg("Role and department saved.");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (disabled) {
    return (
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        Reactivate this employee to edit role and department.
      </p>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-bg)]/80 p-4">
      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Role &amp; department</h3>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Job title and team shown on the employee profile, directory, and payslip.
      </p>
      {err ? <p className="mt-2 text-sm text-[var(--color-danger-text)]">{err}</p> : null}
      {msg ? <p className="mt-2 text-sm text-[var(--color-success-text)]">{msg}</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor={`emp-role-${employeeId}`}>
            Job title / role
          </label>
          <input
            id={`emp-role-${employeeId}`}
            type="text"
            className="input-field mt-1.5"
            value={jobTitle}
            placeholder="e.g. Specialist"
            onChange={(e) => setJobTitle(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label-field" htmlFor={`emp-dept-${employeeId}`}>
            Department
          </label>
          <input
            id={`emp-dept-${employeeId}`}
            type="text"
            className="input-field mt-1.5"
            value={department}
            placeholder="e.g. Operations"
            onChange={(e) => setDepartment(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>
      <Button className="mt-3" type="button" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save role & department"}
      </Button>
    </div>
  );
}
