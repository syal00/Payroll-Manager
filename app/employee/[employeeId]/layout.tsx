import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicEmployeeShell } from "@/components/shells/PublicEmployeeShell";
import { findEmployeeByCodeAnyStatus } from "@/lib/public-employee";
import { isValidEmployeeCodeFormat } from "@/lib/employee-code";

export default async function PublicEmployeeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  if (!isValidEmployeeCodeFormat(employeeId)) {
    notFound();
  }

  const record = await findEmployeeByCodeAnyStatus(employeeId);
  if (!record) {
    notFound();
  }

  if (!record.isApproved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-page-bg)] p-6">
        <div className="modal w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent-light)]">
            Pending admin approval
          </p>
          <h1 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">Almost there</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Your account is pending admin approval. You will be able to access the portal once an administrator approves
            your profile.
          </p>
          <p className="mt-4 font-mono text-sm font-semibold text-[var(--color-text-primary)]">{record.employeeCode}</p>
          <Link href="/employee-access" className="btn btn-primary mt-6 inline-block px-7 py-3">
            Back to employee access
          </Link>
        </div>
      </div>
    );
  }

  if (record.deletedAt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-page-bg)] p-6">
        <div className="modal w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-danger-text)]">
            Account deactivated
          </p>
          <h1 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">Access unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-danger-text)]">
            Your account has been deactivated. Please contact admin.
          </p>
          <Link href="/employee-access" className="btn btn-primary mt-6 inline-block px-7 py-3">
            Back to employee access
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PublicEmployeeShell employeeId={record.employeeCode} displayName={record.name}>
      {children}
    </PublicEmployeeShell>
  );
}
