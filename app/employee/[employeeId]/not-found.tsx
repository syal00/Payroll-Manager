import Link from "next/link";

export default function EmployeeNotFound() {
  return (
    <div className="empty-state min-h-[50vh] px-4">
      <div className="empty-state-icon" aria-hidden>
        <span className="text-lg font-bold text-[var(--color-primary)]">?</span>
      </div>
      <h1 className="empty-state-title">Employee not found</h1>
      <p className="empty-state-desc">
        This employee ID is invalid or does not exist. Check your code (e.g. EMP001) or use employee access
        with your email.
      </p>
      <Link href="/employee-access" className="btn btn-primary mt-2">
        Employee access
      </Link>
    </div>
  );
}
