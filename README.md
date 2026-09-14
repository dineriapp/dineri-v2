# Dineri

**The operating system for your restaurant bio link.** Dineri gives every venue a fast, beautiful, fully‑branded profile page (menu, reservations, ordering, events, gallery, reviews, FAQ) with a no‑code appearance editor, per‑venue analytics, and commission‑free direct bookings.

---

## Tech stack

| Area          | Technology                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org) (App Router, Turbopack) · React 19                           |
| Language      | TypeScript                                                                                      |
| Styling       | Tailwind CSS v4                                                                                 |
| Auth          | [better-auth](https://better-auth.com) (email/password + Google OAuth) with the Stripe plugin  |
| Database      | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team)                                          |
| Payments      | [Stripe](https://stripe.com) (platform subscriptions + per‑venue connected accounts)           |
| Analytics     | Redis via [ioredis](https://github.com/redis/ioredis) (pageview tracking)                       |
| File storage  | AWS S3 (presigned uploads)                                                                      |
| Data fetching | TanStack Query                                                                                   |
| Validation    | Zod                                                                                              |
| Email         | External email queue service (transactional + tenant SMTP)                                      |

## Project structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Sign in / up, verify, reset password
│   ├── (dashboard)/            # Authenticated merchant dashboard
│   ├── (admin)/admin/          # Internal admin area
│   ├── (main)/                 # Marketing site + interactive /preview demo
│   ├── (preview)/r/[slug]/     # Public restaurant profile pages
│   └── api/                    # Route handlers (auth, qr, stripe, email check)
├── components/                 # Page components, shared UI, layout, ui-kit
├── drizzle/                    # Schema, migrations, seed
├── lib/                        # auth, stripe, aws, google, redis, email, validators, types
├── server/actions/             # Server actions
├── hooks/ · providers/ · stores/ · utils/
└── proxy.ts                    # Edge middleware (analytics on /r/:slug)
```

## Prerequisites

- **Node.js 20+**
- **pnpm** (this repo is managed with pnpm — a `pnpm-lock.yaml` is the source of truth)
- A **PostgreSQL** database
- A **Redis** server (e.g. `docker run -p 6379:6379 redis:7`) for analytics
- Accounts/credentials for Stripe, AWS S3, Google OAuth, and the email service

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
# Create a .env in the project root (see Environment variables below)

# 3. Set up the database
pnpm db:generate       # generate migrations from the schema
pnpm db:migrate        # apply them   (or: pnpm db:push for rapid dev)
pnpm db:seed           # optional: seed demo data

# 4. Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env` in the project root (it is git‑ignored — never commit real secrets).

| Variable                                          | Description                                              |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`                                    | PostgreSQL connection string                             |
| `BETTER_AUTH_SECRET`                              | Secret used to sign auth sessions                        |
| `BETTER_AUTH_URL`                                 | Server base URL (e.g. `http://localhost:3000`)           |
| `NEXT_PUBLIC_BETTER_AUTH_URL`                     | Public base URL for the auth client                      |
| `NEXT_PUBLIC_ROOT_DOMAIN`                         | Root domain used for venue routing                       |
| `NEXT_PUBLIC_SESSION_COOKIE_NAME`                 | Session cookie prefix (defaults to `dineri`)              |
| `ADMIN_EMAILS`                                    | Comma‑separated list of admin emails                      |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`       | Google OAuth credentials                                  |
| `REDIS_URL`                                       | Redis connection URL, e.g. `redis://127.0.0.1:6379`        |
| `EMAIL_SERVICE_URL` / `EMAIL_SERVICE_KEY`         | Transactional email queue endpoint + key                   |
| `AWS_BUCKET_NAME` / `AWS_BUCKET_REGION`           | S3 bucket for uploads                                       |
| `AWS_BUCKET_ACCESS_KEY` / `AWS_SECRET_ACCESS_KEY` | S3 credentials                                              |
| `STRIPE_SECRET_KEY`                               | Platform Stripe secret key                                  |
| `STRIPE_WEBHOOK_SECRET`                           | Platform Stripe webhook signing secret                      |
| `ENCRYPTION_KEY`                                  | Key for encrypting per‑venue Stripe/SMTP secrets at rest     |

## Scripts

| Script                               | What it does                                |
| ------------------------------------- | ---------------------------------------------- |
| `pnpm dev`                           | Start the dev server                        |
| `pnpm build`                         | Production build                            |
| `pnpm start`                         | Run the production build                    |
| `pnpm lint`                          | Lint with ESLint                            |
| `pnpm type-check`                    | `tsc --noEmit`                              |
| `pnpm format` / `pnpm format:check`  | Prettier write / check                      |
| `pnpm db:generate`                   | Generate Drizzle migrations from the schema |
| `pnpm db:migrate`                    | Apply migrations                            |
| `pnpm db:push`                       | Push the schema directly (rapid dev)        |
| `pnpm db:studio`                     | Open Drizzle Studio                         |
| `pnpm db:seed`                       | Seed demo data                              |
| `pnpm db:seed:reservations`          | Seed demo reservation data                  |
| `pnpm auth:generate`                 | Regenerate the better-auth Drizzle schema   |

## Database

Schema lives in `src/drizzle/schemas`. After editing it, run `pnpm db:generate` then `pnpm db:migrate` (or `pnpm db:push` in development). The better-auth tables are generated with `pnpm auth:generate` — don't hand-edit the generated schema file.

## Deployment

Optimised for [Vercel](https://vercel.com). Set every variable from the table above in the project's environment settings, and ensure `pnpm db:migrate` runs against the production database as part of your release. Configure the Stripe webhook endpoints (platform + connected accounts) to point at your deployed domain.

## Conventions

- Package manager: **pnpm** (avoid mixing in `npm install`, which can desync the lockfile).
- Formatting: **Prettier** + **ESLint** (`pnpm format`, `pnpm lint`).
- See [`CLAUDE.md`](./CLAUDE.md) for coding conventions and architecture notes.

---

© Dineri Inc.
