"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { parsePositiveRateInput } from "@/lib/format";

export function EmployeePayRatesEditor({
  employeeId,
  initialHourly,
  initialOvertime,
  disabled,
}: {
  employeeId: string;
  initialHourly: number;
  initialOvertime: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const [hourly, setHourly] = useState(String(initialHourly));
  const [ot, setOt] = useState(String(initialOvertime));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setHourly(String(initialHourly));
    setOt(String(initialOvertime));
  }, [initialHourly, initialOvertime]);

  async function save() {
    setErr(null);
    setMsg(null);
    if (hourly.trim() === "" || ot.trim() === "") {
      setErr("Enter both hourly and overtime rates.");
      return;
    }
    const hr = parsePositiveRateInput(hourly);
    const overtime = parsePositiveRateInput(ot);
    if (hr === undefined || overtime === undefined) {
      setErr("Use valid positive numbers (e.g. 25.50 and 38.25). You can use a comma instead of a dot for decimals.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: hr, overtimeRate: overtime }),
      });
      const j = (await res.json()) as {
        error?: string;
        employee?: { hourlyRate: number; overtimeRate: number };
      };
      setBusy(false);
      if (!res.ok) {
        setErr(j.error ?? "Save failed");
        return;
      }
      setMsg("Pay rates saved.");
      if (j.employee) {
        setHourly(String(j.employee.hourlyRate));
        setOt(String(j.employee.overtimeRate));
      }
      router.refresh();
    } catch {
      setBusy(false);
      setErr("Network error");
    }
  }

  if (disabled) {
    return (
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        Reactivate this employee to change pay rates.
      </p>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-bg)]/80 p-4">
      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Set pay rates</h3>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Applies to this employee for all future timesheets and payslips. Use a dot or comma for decimals.
      </p>
      {err && <p className="mt-2 text-sm text-[var(--color-danger-text)]">{err}</p>}
      {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor={`emp-rate-h-${employeeId}`}>
            Hourly rate (USD)
          </label>
          <input
            id={`emp-rate-h-${employeeId}`}
            type="text"
            inputMode="decimal"
            className="input-field mt-1.5"
            value={hourly}
            onChange={(e) => setHourly(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label-field" htmlFor={`emp-rate-ot-${employeeId}`}>
            Overtime rate (USD)
          </label>
          <input
            id={`emp-rate-ot-${employeeId}`}
            type="text"
            inputMode="decimal"
            className="input-field mt-1.5"
            value={ot}
            onChange={(e) => setOt(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>
      <Button className="mt-3" type="button" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save pay rates"}
      </Button>
    </div>
  );
}
