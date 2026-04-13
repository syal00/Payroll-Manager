import { Prisma } from "@prisma/client";

/** User-facing hint when DB schema lags Prisma (e.g. missing `location` migration). */
export function friendlyPrismaSchemaError(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
    return "Database is missing a required column. Run: npx prisma migrate deploy — then stop and restart the dev server (and run npx prisma generate if needed).";
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (/no such column/i.test(msg) && /location/i.test(msg)) {
    return "Database is missing the location column. Run: npx prisma migrate deploy — then stop and restart the dev server (and run npx prisma generate if needed).";
  }
  return null;
}
