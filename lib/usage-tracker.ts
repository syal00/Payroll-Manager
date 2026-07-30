import { prisma } from "@/lib/prisma";

/** UTC calendar date (midnight) — used as UsageDaily primary key. */
export function utcDateOnly(from: Date = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
}

/**
 * Increment today's API request count. Fire-and-forget — never await in the request hot path.
 * UsageDaily rows older than 90 days can be safely pruned by an optional cron job.
 */
export function trackApiRequestFireAndForget(): void {
  const today = utcDateOnly();
  void prisma.usageDaily
    .upsert({
      where: { date: today },
      create: { date: today, requestCount: 1 },
      update: { requestCount: { increment: 1 } },
    })
    .catch((err) => {
      console.error("[usage-tracker] failed to increment daily request count:", err);
    });
}

/** Real-time PostgreSQL database size via pg_database_size (bytes → MB). */
export async function getDatabaseSizeMB(): Promise<number> {
  const rows = await prisma.$queryRaw<{ size_bytes: bigint }[]>`
    SELECT pg_database_size(current_database()) AS size_bytes
  `;
  const bytes = rows[0]?.size_bytes ?? BigInt(0);
  return Math.round((Number(bytes) / (1024 * 1024)) * 100) / 100;
}

export async function getUsageRequestCounts(): Promise<{ requestsToday: number; requestsLast30Days: number }> {
  const today = utcDateOnly();
  const thirtyDaysAgo = utcDateOnly();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const [todayRow, aggregate] = await Promise.all([
    prisma.usageDaily.findUnique({ where: { date: today }, select: { requestCount: true } }),
    prisma.usageDaily.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { requestCount: true },
    }),
  ]);

  return {
    requestsToday: todayRow?.requestCount ?? 0,
    requestsLast30Days: aggregate._sum.requestCount ?? 0,
  };
}
