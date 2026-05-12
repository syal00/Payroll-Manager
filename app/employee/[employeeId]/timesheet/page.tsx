"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function PublicTimesheetIndexPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/public/pay-periods")
      .then((r) => r.json())
      .then((j) => {
        const id = j.current?.id ?? j.openPayPeriods?.[0]?.id;
        if (id) router.replace(`/employee/${employeeId}/timesheet/${id}`);
        else router.replace(`/employee/${employeeId}/dashboard`);
      });
  }, [employeeId, router]);

  return (
    <div className="flex items-center gap-3 text-sm text-slate-500">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent-tint)] border-t-violet-600"
        aria-hidden
      />
      Finding your open pay periodâ€¦
    </div>
  );
}
