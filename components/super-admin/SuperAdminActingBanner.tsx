import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function SuperAdminActingBanner({
  companyName,
  companyId,
}: {
  companyName: string;
  companyId: string;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-950 dark:text-amber-100"
      role="status"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <span>
          Super admin acting as <strong>Main admin</strong> for{" "}
          <strong>{companyName}</strong> — all actions apply to this company only.
        </span>
      </div>
      <Link
        href={`/super-admin/companies/${companyId}/dashboard`}
        className="font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-200"
      >
        Back to company inspect
      </Link>
    </div>
  );
}
