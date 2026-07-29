"use client";

export function SuperAdminSignOutButton() {
  async function onClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--elite-text)]"
    >
      Sign out
    </button>
  );
}
