# WorkLedger — Payroll manager

Next.js 16, Prisma 5, and PostgreSQL (**Neon**). Demo app for hours, approvals, and payslips.

## Quick start

1. **Install:** `npm install`
2. **Configure:** copy `.env.example` to `.env`. Set `DATABASE_URL` (Neon **pooler**), `DIRECT_URL` (Neon **direct**, no `-pooler` in the host), and `AUTH_SECRET` (32+ characters — see `.env.example`).
3. **Database + demo data:** `npm run setup` (runs `prisma generate`, `prisma migrate deploy`, and `tsx prisma/seed.ts`)
4. **Dev server:** `npm run dev` → [http://localhost:3000](http://localhost:3000)

For a step-by-step checklist with copy buttons, **[open `setup.html` in your browser](setup.html)** (double-click the file — no server required).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled connection (e.g. Neon `*-pooler.*.neon.tech`). Used by the app at runtime. |
| `DIRECT_URL` | Direct/non-pooler host (no `-pooler`). Required in `schema.prisma` so **`prisma migrate deploy`** works against Neon. |
| `AUTH_SECRET` | JWT/session signing; minimum 32 characters. |
| `NEXT_PUBLIC_COMPANY_NAME` | Optional branding on login and employee screens. |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Demo logins (after `npm run setup`)

Password for both admins: **`PayrollDemo2026!`** (from `lib/demo-credentials.ts`)

- `syalrakesh00@gmail.com`
- `anmolchahal871@gmail.com`

## Deploy on Vercel

1. Push to GitHub and import the repo in [Vercel](https://vercel.com/new).
2. Create or connect a **Neon** Postgres database.
3. In **Settings → Environment Variables**, add:
   - **`DATABASE_URL`** — Neon **pooled** URL (often includes `-pooler`).
   - **`DIRECT_URL`** — Neon **direct** URL (host without `-pooler`). **Both** are required for builds that run `prisma migrate deploy`.
   - **`AUTH_SECRET`** — 32+ random characters.
   - Optional: **`NEXT_PUBLIC_COMPANY_NAME`**
4. Deploy. The build runs `prisma generate`, `prisma migrate deploy`, and `next build`.
5. **Seed production once** from your machine (or any environment with the same `DATABASE_URL` / `DIRECT_URL`):

```bash
npm run setup
```

Or: `npx prisma migrate deploy` then `npm run db:seed`.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Validates `.env`, then starts Next.js dev server |
| `npm run build` | Generate client, migrate, production build |
| `npm run start` | Production server |
| `npm run setup` | Generate + migrate + seed (local/staging bootstrap) |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:seed` | Run `prisma/seed.ts` only |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | `prisma db push` (prototyping only) |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

## Troubleshooting

### `P3009` / failed migration recorded in `_prisma_migrations`

If a previous run failed (e.g. once-off UTF-8 BOM in an old `migration.sql`), mark it rolled back and redeploy:

```bash
npx prisma migrate resolve --rolled-back "20260413230000_postgresql_init"
npx prisma migrate deploy
```

Only do this on disposable databases, or after you understand [Prisma migrate resolve](https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting-development).

### Neon pooler and migrations

Always set **both** `DATABASE_URL` (pooled) and `DIRECT_URL` (direct host, no `-pooler`). Migrations use `directUrl` in `schema.prisma`.

## Tech stack

Next.js 16, Prisma 5, PostgreSQL (Neon), Tailwind CSS 4, bcrypt + jose for auth.
