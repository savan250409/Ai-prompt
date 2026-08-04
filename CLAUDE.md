# Prompt Studio — Project Map & Handoff

> **START HERE.** This file is auto-loaded each session. It's the map so you (the AI)
> don't have to re-read the whole codebase. Read this, then jump straight to the
> relevant file. The build is **complete and on `main`, green**.

---

## TL;DR — current state

- A richly-animated, dark-first **website** version of an "AI Prompts" mobile app.
- **All 7 milestones done** + post-build hardening. On branch **`main`** (no git remote).
- **Runs with zero config** on mock data: `npm run dev` → http://localhost:3000.
- Real DB / payment / AI keys **drop in via env, no code changes** (that's the design).
- Quality gate is **green**: `npx tsc --noEmit` clean · `npm test` 32 pass · `npm run build` 29 pages.
- Original build brief (the spec): `~/Downloads/CLAUDE_1.md` (sections referenced as §N in code comments).

## Run / verify

```bash
npm run dev      # dev server (mock mode, no env needed)
npm test         # vitest, 32 tests
npm run build    # prod build
```

⚠️ **GOTCHA (this has bitten us 5+ times):** never run `npm run build` while the dev/preview
server is running — it overwrites `.next` under the live process and the preview goes blank.
Fix: `lsof -ti:3000 | xargs kill -9; pkill -f next-server; rm -rf .next` then start dev again.
Nothing in the code is wrong when this happens.

## Stack & locked decisions (do NOT "upgrade")

Next **14** + React **18** + Tailwind **3** (chosen over 15/19 for ecosystem stability across the
animation libs). App Router, `src/`, import alias `@/* → src/*`. Prisma **7** (needs a driver
adapter — `@prisma/adapter-mariadb`), Auth.js **v5** (next-auth beta), **Cashfree** payments,
**Runware** generation, TanStack Query, Zustand, framer-motion, lenis, embla, next-themes, sonner,
lucide-react, vitest.

---

## Architecture map (where things live)

| Area | Path | Notes |
|---|---|---|
| Catalog data | `src/data/catalog.ts` | Async facade: DB (`db/catalog.ts`) when `DATABASE_URL` set, else `mock/catalog.ts`. READ-ONLY. |
| Mock seed | `src/data/mock/catalog.ts` | Categories, prompts, filters, tools (picsum + sample videos). |
| Web data store | `src/server/store/` | `index.ts` picks `prisma-store.ts` (DB) vs `memory.ts` (mock). Users, coins ledger, subscriptions, unlocks, favorites, generations. |
| Entitlements | `src/server/entitlements.ts` | **ONLY authority** for unlock/Pro/coins. Client never trusted. |
| Auth | `src/server/auth.ts` | Auth.js v5, email+Google, JWT (adapter-less). Fails fast in prod w/o `NEXTAUTH_SECRET`. |
| Unlock | `src/server/unlock.ts` + `reward/` | Pro instant / free-quota "watch ad". |
| Billing | `src/server/billing.ts` | **Cashfree** orders + webhook sig + `activatePlan`. |
| Generation | `src/server/generation/` | `index.ts` (runGeneration: spend/refund), `mock.ts`, `runware.ts` (§7a), `types.ts`. |
| Rate limit | `src/server/rate-limit.ts` | In-memory (single-process). |
| Config (env) | `src/lib/config.ts` | All env-driven costs/keys/flags. `publicConfig` = safe client subset. |
| Pages + API | `src/app/` | Pages + `app/api/*` route handlers. |
| UI components | `src/components/` | `ui/`, `catalog/`, `studio/` (generation), `billing/`, `account/`, `layout/`, `providers/`. |
| Client state | `src/store/session.ts` | Zustand mirror of `/api/me` (optimistic coins/unlock/phone). |
| Design tokens | `src/app/globals.css` | CSS vars (dark default + light). **Never hardcode hex in components.** |
| Prisma | `prisma/schema.prisma` | Existing `ngendev_*`/`filter_*` mapped + marked **external** (never migrated); new web tables app-owned. `seed.ts` seeds the 6 AI tools. |
| Tests | `test/` | Vitest; `vitest.config.ts` stubs `server-only` + `@/server/auth`; `test/setup.ts` sets env. |

## Conventions & gotchas to remember

- **Design tokens** = CSS vars in `globals.css`; map in `tailwind.config.ts`. Never hardcode hex.
- **Prompt gating**: the full `ai_prompt` is read server-side ONLY after the entitlement check
  (`unlock.ts`, detail pages). It is **never** sent to the client while locked. Tests lock this in.
- **Catalog is read-only**; existing content tables are `external` in `prisma.config.ts` — never migrate them.
- **Pure helpers in a `"use client"` module become non-callable from Server Components** ("X is not a
  function" at prerender). Keep style/util helpers in NON-client modules — see `src/components/ui/button-variants.ts`.
- **Nav = Home-first** (user override of the brief's centered layout): `src/components/layout/nav-items.ts`.
- **next-themes** via `attribute="data-theme"`, dark default, no FOUC.
- **Cashfree** (swapped from Razorpay): amounts in **rupees not paise**; webhook sig =
  `base64(HMAC-SHA256(timestamp + rawBody, secretKey))`; user phone collected on `/account`
  (`PhoneField`) + checkout modal (`mode:"need_phone"`).
- **Generation**: atomic coin spend + **refund on failure** (sync & async). Video is async (poll
  `/api/generations/:id`). Runware models via env (`RUNWARE_MODEL_*`), never hardcoded.
- Dev test-mode simulates a successful purchase when no Cashfree keys + non-prod.

## What's done (git history, newest first)

```
fa43340 feat(billing): optional mobile number for Cashfree checkout
813966f feat(billing): replace Razorpay with Cashfree
24e7633 test: add Vitest suite for critical server logic
cddd4b0 fix(security): fail-fast in production without NEXTAUTH_SECRET
59be3ba feat: M7 — polish (SEO, legal pages, rate limiting, analytics)
a57cd77 feat: M6 — generation
7879870 feat: M5 — monetization (pricing, ledger, favorites)
cfab81f feat: M4 — unlock flow (RewardProvider, Prompt Reveal)
58b08ef feat: M3 — auth (Auth.js v5) + store + account
70b88d6 feat: M2 — catalog data layer, API, browse pages
e5a6480 feat: M1 — scaffold, design system, theme, nav, home
```

Verified live end-to-end on mocks: browse → locked detail (no leak) → register/login →
unlock (Pro + watch-ad) → go Pro (coins) → generate image/video (spend/refund) `→ favorites →
My Media → phone save. Both themes ship.

---

## TODO before PRODUCTION (mostly env, a few code)

**Env vars only (NO code edit)** — set in host:
`DATABASE_URL`, `MEDIA_BASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (required — app refuses to boot
in prod without it), `GOOGLE_CLIENT_ID/SECRET`, `CASHFREE_APP_ID/SECRET_KEY`, `CASHFREE_ENV=production`,
`RUNWARE_API_KEY`, `RUNWARE_MODEL_IMAGE/VIDEO` (real AIR ids — override the `placeholder:` defaults at
`config.ts:60-61`). See `.env.example`.

**Code edits needed** (grep the marker; line numbers may drift):
| Priority | File | Marker | Action |
|---|---|---|---|
| Required | `src/app/privacy/page.tsx` | "Template notice" | Replace placeholder legal text |
| Required | `src/app/terms/page.tsx` | "Template notice" | Replace placeholder legal text |
| Required | `src/server/generation/runware.ts` | `NOTE(integration)`, `imageURL`, `req.resolution === 720` | Confirm response fields + 480/720 px mapping vs the real Runware model |
| Required | `src/lib/config.ts` | `durations: [6, 12]`, `resolutions: [480, 720]` | Match the chosen video model's supported set |
| Recommended | `src/lib/upload.ts` | `TODO(§10): strip EXIF` | Add `sharp` to strip EXIF from uploads |
| Recommended | `src/app/support/page.tsx` | `support@promptstudio.app` | Real support email |
| Recommended | `src/server/billing.ts` | `noreply@promptstudio.app` | Real fallback email |
| If multi-instance | `src/server/rate-limit.ts` | `TODO(integration)` | Swap in-memory limiter for Redis/Upstash |
| Optional | `next.config.mjs` | `picsum.photos` etc. | Drop mock image hosts for prod |

**External setup (not code):** `npm run db:pull` → `db:migrate:dev` → `db:seed`; Cashfree dashboard
keys + webhook → `https://DOMAIN/api/billing/webhook`; Google OAuth redirect URI →
`https://DOMAIN/api/auth/callback/google`.

**Owner still owes:** the real Runware **model AIR ids** (marked TBD), and all the keys above.

---

## How to resume work

1. Read this file (done). 2. `git log --oneline | head` for the latest. 3. `npm run dev` (mock mode).
4. To verify a change in the browser, use the preview tools — and remember the build/dev `.next` gotcha above.
5. Standing instruction from the owner: **commit directly to `main`** (no feature branches needed here).
