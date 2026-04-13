# WorkLedger — Payroll manager

Next.js app with Prisma and PostgreSQL.

## Local setup

1. Create a **PostgreSQL** database (local install, [Neon](https://neon.tech) free tier, or Docker).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `AUTH_SECRET` (32+ random characters).
3. Install and migrate:

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push the project to GitHub and import it in [Vercel](https://vercel.com/new).
2. Add a **Postgres** database:
   - Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), **Neon**, or **Supabase**, then copy the connection string.
3. In the Vercel project → **Settings → Environment Variables**, add:
   - **`DATABASE_URL`** — your Postgres URL (include `?sslmode=require` if the host requires SSL).
   - **`AUTH_SECRET`** — at least 32 random characters (e.g. `openssl rand -base64 32`).
   - Optional: **`NEXT_PUBLIC_COMPANY_NAME`** — shown on the login page.
4. Deploy. The build runs `prisma migrate deploy` to create tables.
5. **Seed admins / demo data** (one-time). In Vercel → your project → **Deployments** → **⋯** on the latest deployment → **Redeploy** is not enough; run seed from your machine against production:

```bash
# Use the same DATABASE_URL as in Vercel (from Neon dashboard, etc.)
set DATABASE_URL=postgresql://...   # Windows
export DATABASE_URL=postgresql://... # macOS/Linux
npx prisma db seed
# or: npm run db:seed
```

Or use Neon's SQL editor / a local `tsx prisma/seed.ts` with production `DATABASE_URL`.

6. Open your Vercel URL and sign in with the seeded admin email/password from `prisma/seed.ts` (or your `db:add-admins` script).

### Neon note

If migrations fail with a **pooler** connection, use Neon's **direct** (non-pooled) connection string for `DATABASE_URL` on Vercel, or add `directUrl` in `schema.prisma` and set `DIRECT_URL` per [Prisma + Neon](https://www.prisma.io/docs/orm/overview/databases/neon).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server (LAN-friendly) |
| `npm run dev:local` | Dev server, default host only |
| `npm run build` | `prisma generate` + `migrate deploy` + `next build` |
| `npm run db:seed` | Seed demo data |
| `npm run live` | Temporary public tunnel (localtunnel) |

## Tech

Next.js 16, Prisma 5, PostgreSQL, Tailwind CSS 4.
