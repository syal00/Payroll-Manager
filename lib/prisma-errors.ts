import { Prisma } from "@prisma/client";

const CONNECTION_HINT =
  "Cannot connect to PostgreSQL. Check `DATABASE_URL` and `DIRECT_URL` in `.env` (Neon dashboard), internet access, and that the Neon project is active. Then run `npm run setup`.";

const CONFIG_HINT =
  "Database is misconfigured: set `DATABASE_URL` (pooled Neon URL) and `DIRECT_URL` (direct host, no `-pooler`) in `.env`. See `.env.example`. Then run `npm run db:migrate` and `npm run db:seed`.";

/**
 * Maps Prisma connectivity / env errors to a single user-facing message.
 * Note: an unreachable server often throws {@link Prisma.PrismaClientInitializationError}, not P1001.
 */
export function prismaDatabaseUnavailableMessage(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P1001" || error.code === "P1000") {
      return CONNECTION_HINT;
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    const msg = error.message ?? "";
    if (/Can't reach database server|P1001|P1000|connection (refused|timed out|closed)/i.test(msg)) {
      return CONNECTION_HINT;
    }
    if (/DATABASE_URL|Environment variable not found|invalid.*connection string/i.test(msg)) {
      return CONFIG_HINT;
    }
    // TLS / engine / other init failures — same practical next steps as connectivity
    return CONNECTION_HINT;
  }

  return null;
}

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
