# Prompt Studio

A modern, richly animated, responsive **website** version of an AI Prompts mobile
app. It reuses the same MySQL database (`category_template`) for catalog content,
adds web-native accounts, an unlock flow, subscriptions + a coin ledger, and AI
generation behind a provider abstraction.

> **Runs with zero configuration.** With no env set, the app boots on a local
> mock catalog, an in-memory data store, mock auth, dev-mode billing, and a mock
> generation provider — so every flow works before any DB/keys are supplied.
> Real DB/keys drop in via `.env` with **no code changes**.

## Quick start

```bash
npm install        # also runs `prisma generate` (postinstall)
npm run dev        # http://localhost:3000
```

Optionally `cp .env.example .env.local` and fill in values as you go.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**, **Tailwind CSS 3** (mobile-first)
- **Prisma 7** (MySQL via the MariaDB driver adapter) — chosen over newer majors
  for ecosystem stability across the animation libs
- **Auth.js v5** (NextAuth) — email/password + Google, adapter-less JWT
- **Cashfree** (INR) billing with signed webhooks
- **Runware** for AI generation (server-side only), behind a `GenerationProvider`
- **TanStack Query**, **Zustand**, **framer-motion**, **lenis**, **embla**,
  **next-themes**, **sonner**, **lucide-react**

## How it runs without a backend

Each external dependency sits behind an abstraction with a working mock:

| Concern        | Abstraction                       | Mock (default)            | Real (when configured)         |
| -------------- | --------------------------------- | ------------------------- | ------------------------------ |
| Catalog        | `src/data/catalog.ts`             | local seed                | Prisma/MySQL (`DATABASE_URL`)  |
| Web data       | `src/server/store`                | in-memory                 | Prisma/MySQL                   |
| Auth           | Auth.js (JWT)                     | email/pw on memory store  | + Google (`GOOGLE_*`)          |
| Billing        | `src/server/billing.ts`           | dev test-mode (instant)   | Cashfree (`CASHFREE_*`)        |
| Reward ("ad")  | `src/server/reward`               | free-quota                | pluggable web ad network       |
| Generation     | `src/server/generation`           | placeholder media         | Runware (`RUNWARE_API_KEY`)    |

## Architecture

- **`src/data`** — catalog facade (DB | mock), seed data, tool defs.
- **`src/server`** — `auth`, `entitlements` (the only authority for Pro/unlock/
  coins), `store` (users, coins ledger, subscriptions, unlocks, favorites,
  generations), `billing`, `unlock`, `reward`, `generation`, `rate-limit`.
- **`src/app`** — pages + API route handlers (`/api/*`). Catalog is **read-only**;
  all writes/generation enforce entitlement server-side and never leak a locked
  prompt's full text.
- **`src/components`** — design-system UI, catalog, studio (generation), billing,
  account, auth.
- **`src/lib`** — config (env-driven), utils, fonts, types, analytics.
- **`prisma`** — schema (existing `ngendev_*`/`filter_*` mapped exactly and marked
  *external* so migrations never alter them; new web tables are app-owned), seed.

## Scripts

| Script                | What                                              |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Dev server                                        |
| `npm run build`       | Production build                                  |
| `npm run db:pull`     | Introspect the existing DB into the schema        |
| `npm run db:migrate`  | Apply web-table migrations (`migrate deploy`)     |
| `npm run db:seed`     | Seed the six fixed AI tools                        |

## Connecting the real backend

1. Set `DATABASE_URL` to the `category_template` MySQL.
2. `npm run db:pull` to reconcile the existing tables, then
   `npm run db:migrate:dev` to create the new web tables, then `npm run db:seed`.
3. Set `MEDIA_BASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_*`, `CASHFREE_*`,
   `RUNWARE_API_KEY` (+ the `RUNWARE_MODEL_*` AIR ids) as they become available.

See `.env.example` for the full list. Secrets stay server-side; the Runware key
never reaches the browser.

## Notes / TODO(integration)

- EXIF stripping on uploads is stubbed (`src/lib/upload.ts`) — add `sharp` to
  strip metadata server-side before forwarding to the provider.
- Rate limiting and the mock store are per-process — use Redis/Upstash and a real
  DB for multi-instance deployments.
- Analytics and feedback are logged; forward them to your provider of choice.
