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

  if (record.deletedAt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#05020c] bg-app-pattern p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_0_60px_-20px_rgba(244,63,94,0.35)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-400">Account deactivated</p>
          <h1 className="mt-3 text-xl font-bold text-white">Access unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Your account has been deactivated. Please contact admin.
          </p>
          <Link
            href="/employee-access"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 hover:brightness-110"
          >
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
