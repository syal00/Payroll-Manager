/** Dispatched after admin actions that should refresh dashboard metrics. */
export const ADMIN_STATS_REFRESH_EVENT = "admin-stats-refresh";

export function dispatchAdminStatsRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_STATS_REFRESH_EVENT));
}
