# Dineri

The operating system for a restaurant's bio link: a branded venue profile page (menu, reservations, ordering, events, gallery, reviews, FAQ) with a no-code appearance editor, per-venue analytics, and direct bookings.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**, TypeScript
- **Tailwind CSS v4**
- **better-auth** (email/password + Google OAuth, Stripe plugin) for auth
- **PostgreSQL** via **Drizzle ORM**
- **Stripe** — platform subscriptions + per-venue connected accounts
- **Redis** (via `ioredis`) — pageview analytics
- **AWS S3** — presigned uploads
- **TanStack Query** for client-side data fetching
- **Zod** for validation
- Package manager: **pnpm** (`pnpm-lock.yaml` is the source of truth — don't use `npm install`)

## Project structure

```
src/
├── app/
│   ├── (auth)/            # Sign in/up, verify, reset password
│   ├── (dashboard)/       # Authenticated merchant dashboard
│   ├── (admin)/admin/     # Internal admin area
│   ├── (main)/            # Marketing site + interactive /preview demo
│   ├── (preview)/r/[slug] # Public restaurant profile pages
│   └── api/                # Route handlers (auth, qr, stripe, email check)
├── components/
│   ├── pages/              # Page-specific components, grouped by route
│   ├── layout/, shared/, ui/, ui-kit/
│   └── hydrators/          # Client-side store hydration from server data
├── drizzle/
│   ├── schemas/            # Drizzle schema (source of truth for DB)
│   └── seed/                # Seed scripts
├── lib/
│   ├── auth/ (guards, hooks) · stripe/ · aws/ · google/ · radis/ (Redis) · email/ · email-publisher/
│   ├── tanstack-react-query/ (apis, hooks) · validators/ (zod, custom) · types/ · analytics/
├── server/
│   ├── actions/            # "use server" Server Actions
│   └── core/
├── hooks/ · providers/ · stores/ · utils/
└── proxy.ts                 # Edge middleware (analytics on /r/:slug)
```

## Scripts

| Command                                      | Purpose                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                   | Start dev server                                                                                    |
| `pnpm build` / `pnpm start`                  | Production build / run                                                                              |
| `pnpm lint`                                  | ESLint                                                                                              |
| `pnpm type-check`                            | `tsc --noEmit`                                                                                      |
| `pnpm format` / `pnpm format:check`          | Prettier write / check                                                                              |
| `pnpm db:generate`                           | Generate Drizzle migrations from schema                                                             |
| `pnpm db:migrate`                            | Apply migrations                                                                                    |
| `pnpm db:baseline`                           | Record existing migrations as applied on a database built with `db:push` (run once per environment) |
| `pnpm db:push`                               | Push schema directly (local dev only)                                                               |
| `pnpm db:studio`                             | Drizzle Studio                                                                                      |
| `pnpm db:seed` / `pnpm db:seed:reservations` | Seed demo data                                                                                      |
| `pnpm auth:generate`                         | Regenerate better-auth Drizzle schema                                                               |

## Conventions

- **Database**: edit schema under `src/drizzle/schemas`, then `pnpm db:generate` and commit the new files in `src/drizzle/migrations/` (SQL + `meta/`) alongside the schema change. Apply with `pnpm db:migrate`. Never hand-edit generated migrations or the better-auth generated schema (`better-auth-generated-schema.ts`) — regenerate with `pnpm auth:generate`.
- **`db:push` is local-only.** It diffs the schema against the database and will drop columns and tables it believes were removed, with no migration recorded. Never run it against a shared or production database — use `db:generate` + `db:migrate` there.
- **Existing databases must be baselined once.** A database created with `db:push` has the tables but no migration history, so `db:migrate` would try to re-create them and fail. `pnpm db:baseline` records the current migrations as already applied without running their SQL. It refuses to run on an empty database (which needs `db:migrate`) or on one that already has history.
- **Server actions**: `"use server"` files in `src/server/actions/*.action.ts` (mostly), guarded with helpers from `src/lib/auth/guards` (e.g. `ensureAuthenticatedUserLean`) — check auth before doing any work.
- **Path alias**: `@/*` maps to `src/*`.
- **Formatting**: Prettier config uses double quotes (`singleQuote: false`), semicolons on, trailing commas everywhere, 100-char print width, 2-space indent. Run `pnpm format` rather than hand-formatting.
- **Linting**: `eslint-config-next` (core-web-vitals + typescript) plus `prettier` — run `pnpm lint` before considering a change done.
- Route groups (`(auth)`, `(dashboard)`, `(admin)`, `(main)`, `(preview)`) segment the app by audience/layout; keep new routes in the matching group rather than inventing new ones.

## Environment

`.env.example` lists every variable with a short note; copy it to `.env` and fill it in. At minimum: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_SESSION_COOKIE_NAME`, `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `GOOGLE_MAPS_API_KEY`, `REDIS_URL`, `EMAIL_SERVICE_URL`/`EMAIL_SERVICE_KEY`, `AWS_BUCKET_NAME`/`AWS_BUCKET_REGION`/`AWS_BUCKET_ACCESS_KEY`/`AWS_SECRET_ACCESS_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET`.

## Deployment

Targets Vercel. Stripe webhooks (platform + connected accounts) must point at the deployed domain; `pnpm db:migrate` should run against production as part of release.

The first release after migrations were introduced needs `pnpm db:baseline` run once against each existing environment, before `db:migrate` is wired into the release. After that, `db:migrate` is the only command that should touch a deployed database.

Scheduled jobs are plain GET routes under `src/app/api/cron/`, guarded by `Authorization: Bearer $CRON_SECRET`. `vercel.json` declares their schedule, which applies **only on Vercel** — on the VPS deployment those declarations do nothing and the jobs must be registered with the server's own scheduler. See `deploy/CRON.md`. An unscheduled `release-stale-holds` is silent: expired holds simply accumulate and keep occupying tables.
