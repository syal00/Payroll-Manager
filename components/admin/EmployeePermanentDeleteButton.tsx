"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function EmployeePermanentDeleteButton({
  employeeId,
  employeeName,
}: {
  employeeId: string;
  employeeName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDelete() {
    const typed = window.prompt(
      `Permanently delete ${employeeName}? This removes all timesheets, payslips, and portal access. Type DELETE to confirm.`
    );
    if (typed !== "DELETE") return;

    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/employees/${employeeId}/permanent`, { method: "DELETE" });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Delete failed");
        return;
      }
      router.push("/admin/employees");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]/40 p-4">
      <h3 className="text-sm font-bold text-[var(--color-danger-text)]">Permanently delete employee</h3>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
        Removes this profile, all submitted hours, payslips, and portal login. This cannot be undone. Use{" "}
        <strong>Archive</strong> on the employees list if you only need to deactivate access.
      </p>
      {err ? <p className="mt-2 text-sm text-[var(--color-danger-text)]">{err}</p> : null}
      <Button
        type="button"
        variant="danger"
        className="mt-3"
        disabled={busy}
        onClick={() => void handleDelete()}
      >
        {busy ? "Deleting…" : "Delete employee permanently"}
      </Button>
    </div>
  );
}
