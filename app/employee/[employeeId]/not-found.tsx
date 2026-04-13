import Link from "next/link";

export default function EmployeeNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-white">Employee not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        This employee ID is invalid or does not exist. Check your code (e.g. EMP001) or use employee
        access with your email.
      </p>
      <Link
        href="/employee-access"
        className="mt-6 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
      >
        Employee access
      </Link>
    </div>
  );
}
