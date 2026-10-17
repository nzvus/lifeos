# ARCHITECTURE.md

> Current state of the system only. No history, no alternatives, no rationale —
> those live in `docs/decisions/`. Target: readable in 2 minutes, < ~150 lines.
> Update in the same commit as any change that alters what's written here.

## System overview

Two apps in one npm workspace (ADR-0056). **v1**, at the root: one Next.js 16 (App Router) app in TypeScript, one unit on Vercel (ADR-0004), in daily use and receiving fixes only. **v2**, in `apps/v2` (ADR-0053, target `docs/spec/v2/`): engines first, pure functions in `apps/v2/src/core/engines/*` with their tests (E1 Time, E2 Metrics, E3 Planning so far); no pages, Vercel project or database yet. The root's `typecheck`, `lint` and `test` run v1's and then v2's, so CI covers both; v1's configs exclude `apps/` and `packages/`. Below, everything describes v1. Routes in
`src/app/` are thin; domain and data logic live in `core/`, which imports no framework.
Postgres on Neon via Drizzle (ADR-0003), Better Auth in the same database (ADR-0006).
Modules: nutrition (ingredients, meals, log, day types, quality, trends), training (exercises,
routines, programs, sessions, gym mode, progress), body (weigh-ins, sleep, movement), energy and
goals, pantry, money (ADR-0036), an assistant (ADR-0018), trash, export, packs (ADR-0034).

## Component map

```
src/
  app/          routes, layouts, route handlers, SERVER ACTIONS (thin)
    _server/    composition root: env, the one Db + Auth, session -> Owner,
                dictionary selection. Server-only.
    (auth)/     /sign-in, /sign-up          (app)/  every signed-in page
    api/        auth/[...all], health, export
  features/     vertical slices (area/slice), components only:
                account/{auth,settings,trash}, nutrition/{ingredients,meals,log,nav,
                profiles,trends,pantry}, training/{body,exercises,live,programs,progress,
                routines,sessions,plan}, money
  core/         db/ (schema: auth, nutrition, training; client), identity/ (Owner,
                ownedBy), day/ (a day's targets), nutrition/, training/, pantry/, money/, energy/,
                assistant/, trash/, export/, import/, catalog/ (packs), auth/,
                shared/ (validation, search, browse, sorting, dates, trash…), testing/
  ui/           one component per repeated thing: button.ts, Badge, Section, Sheet,
                SubNav, Collapsible, ListItem, DeleteButton, ActionBar, Toast, …
  design/       theme.css (Tailwind v4 @theme tokens) + themes/<id>.css
  i18n/         messages.en.ts (reference shape), messages.it.ts, fill()
drizzle/        committed SQL migrations (generated, reviewed)
scripts/        check.py, backup.sh, restore-drill.sh, vercel-build.mjs,
                vercel-ignore.sh, importers/upserts (dry run by default)
docs/runbooks/  setup, restore drill, replace data, lint-rule proof
```

`ui/ + design/ + i18n/` are the reusable **kit**: a marked region, not a package.

## Key invariants

| Invariant (PROJECT.md §3) | Enforced where |
| --- | --- |
| Logged data is never lost or silently corrupted | Daily encrypted `pg_dump` outside Neon + drilled restore; migrations only via committed SQL, rehearsed on preview branches, applied to production by `migrate.yml` after a backup; log entries are snapshots (ADR-0007); decimals exact (`numeric` + big.js), money in integer cents; deletes go to a 30-day trash (ADR-0015) |
| A user can never read another user's data | Every repository takes an `Owner` (branded, only from a verified session) and filters with `ownedBy()`; composite foreign keys `(id, user_id)`; cross-user tests per entity. Never middleware (CVE-2025-29927) |
| A past day's targets never change | `day_plans` holds a copy of the profile's targets, fixed when the day is chosen or its first food is logged (ADR-0008); dynamic days under an accepted check-in are frozen numbers (ADR-0043) |
| A day/meal's totals equal the sum of its entries | `core/nutrition/totals.ts` only; computed on read, exact, rounded once at display; no stored aggregates |

Structural invariants, enforced by ESLint (proof: `docs/runbooks/lint-boundaries.md`):

- `core/` imports only `core/` and no framework package (ADR-0001).
- No feature slice imports another; slices meet in `core/`, or the page
  composes them (ADR-0002).
- No hex colour, arbitrary value, default text size, numeric border width or
  JSX text outside `design/`/`i18n/` (type scale: `text-title…meta`).
- i18n ↔ core consistency (nutrients, error codes, locales, themes) is a
  compile-time check in `app/_server/i18n.ts`.

## Boundaries & interfaces

```
app  →  features  →  core
 │         ↓          ↑
 └──→  ui  →  design, i18n     (app may also import core, ui, i18n directly)
```

- **Server actions live in `app/`**, next to their route: an action must read
  the session cookie, which ADR-0006 allows only in `app/`. Feature components
  receive actions as props (never inline functions into client components).
  Every action: `requireContext()` → core validation → repository → revalidate.
- `core/` never reads `process.env` or request state; `app/_server/` passes in
  what it needs (factories `createDb`, `createAuth`; an `Owner` per call).
- `ui/` is presentation only: translated strings in, no domain types; rule of three.
- CLI scripts get an `Owner` by email (`core/identity/local-admin.ts`), never the web app.

## Persistence & durability (ADR-0003, ADR-0007)

Schema: `core/db/schema/*.ts` → `npm run db:generate` → read the SQL → commit →
the PR preview applies it to its own Neon branch (`scripts/vercel-build.mjs`) →
`migrate.yml` on the PR branch (backup, then migrate) → the CI gate finds that run →
merge. No `drizzle-kit push`. New tables, not columns on old ones: safe in any order.

Backups: `backup.yml` daily → `scripts/backup.sh` (pg_dump -Fc, verified, encrypted with
age) → workflow artifact, 30 days. Restore: `scripts/restore-drill.sh` into an empty
database only. Export: `GET /api/export` (JSON v21: every owned table from `core/export/tables.ts`, trash included,
no secrets; ADR-0052); `core/import/replace.ts` replaces an account with any version (CLI today).

## Delivery (ADR-0004)

Vercel Hobby; production only from protected `main` with green CI (`ci.yml`: check.py,
typecheck, lint, tests, build). Previews only for schema changes or `*-preview` branches
(100 deployments a day). healthchecks.io gets a ping after each dump and from the
`app-health` job (`/api/health`): silence is the alarm.

## Cross-cutting concerns

- **Errors:** expected failures are `Result` codes (`core/shared/result.ts`, translated;
  Postgres 23505/23503/23001 mapped); the rest throw to `error.tsx`.
- **Config/secrets:** `app/_server/env.ts` (`.env.example`); Vercel env, GitHub secrets
  for backup/migrate, the age key only on the developer's machine.
- **Auth:** Better Auth, email+password, DB sessions (30 days, 5-min cookie cache), rate
  limits; sign-up with `ALLOW_SIGNUP=true`, by one-use invitation if `SIGNUP_INVITES=true`
  (ADR-0034); `requireContext` per page/action + `Owner`.
- **Targets:** one engine, `core/day` (ADR-0040): `readDays(from, to)` → `resolveDay` per day, for
  every screen and the assistant. A day's type (ADR-0008): its copy (`writePlan` only), else the
  default, else none; auto maxima; bands (ADR-0023; carbs take the rest). A dynamic day (ADR-0014):
  an accepted weekly check-in's frozen numbers (if the goal has it on, ADR-0048) (`week_checkins`, 7 days; ± each day's program shift, `week_checkin_days`, carbs take it), else the goal live
  (`goals`, a history: kind, target, day; the pace planned within ranges, ADR-0045), else its
  type's parameters (ADR-0043).
  With a goal a type is only the day's program (ADR-0046): training time, ± kcal shift, timed slots.
- **Energy:** `core/energy` `getEnergyRange` (ranges, done + planned, no double counts ADR-0021,
  every step from zero, the level = time on your feet, the trend weight ADR-0051) × the accepted factor, learnt by a Kalman filter over log,
  closed days and scale (ADR-0041/0042/0026). Weigh-ins carry a reliability (ADR-0027; an
  implausible one asks first, counts 0.02, never sets a day's weight); sleep feeds quality and trends, not energy (ADR-0031).
- **Log entries** (ADR-0009/0011/0022): planned or eaten, time/moment (groups in time order,
  snacks placed by their time; on Today one timeline of slots, entries, sessions and "now", `core/day/timeline.ts`, ADR-0050), servings −/+; a day closed complete / partial (ADR-0042); totals =
  eaten, every panel also shows the day with the plan; tick and −/+ optimistic (`log/LiveDay`).
- **Editing (ADR-0015):** edit pages share ui/ActionBar (↺ / Cancel / Save), browser drafts,
  `?from=`, toasts with Undo; rows open on tap; delete = a bin that asks, then the 30-day trash
  (`deleted_at`, `live()`, `/settings/trash`, purged by `backup.yml`). Short tasks in ui/Sheet
  via `#id`; settings save themselves (ui/useAutoSave).
- **Assistant (ADR-0018):** off unless `ASSISTANT_ENABLED=true`. Server-side with the user's
  key (AES-GCM, `ASSISTANT_KEY_SECRET`); tools wrap core with the Owner; writes come back with
  Undo, deletes/imports wait for a tap; a data summary (`assistant/context.ts`) goes along.
- **Compounds (ADR-0039):** caffeine and creatine levels estimated per ingredient. **Gym mode
  (ADR-0037):** one screen; each set saves start and end, the clock and resuming derive from them.
- **Derived, never stored:** pantry stock (ADR-0017, `core/pantry/stock.ts`: purchases −
  eaten − cooked ± counts), a program's coming days (ADR-0024, `core/training/program.ts`;
  only per-day overrides are stored, ADR-0029) and today's exercise target
  (`core/training/targets.ts`, double progression over the pattern guides, ADR-0028).
- **PWA (ADR-0019):** `app/manifest.ts` + `public/sw.js`: pages network-only, offline page
  as fallback, static files cache-first; no user data cached; dark splash.
- **Time:** `date` strings; "today" from `user_settings.timezone`, never the server's clock.
  **Search:** `core/shared/search.ts` (accent-insensitive, every word, match then 60-day use).
- **Responsive UI (ADR-0038):** four areas around the day, views as URLs (ADR-0033) — Body (plan |
  routines | exercises | progress: training, weight) · Food (meals | ingredients | pantry | trends)
  · **Today** (a raised circle in the middle: one page — totals, the day's timeline, detail panels; ADR-0050) ·
  Money (overview | movements | receipts) · Mind (the day's check-in, the last 30 days); Assistant
  and Settings in the header; bottom bar on phones, header on md+; checked at 360 px, text 120 %.
- **Visual language:** colour = state (short / in the zone / over: `bandState`,
  ui/NutrientRow); nutrients keep their colour on icons and bars, numbers are ink; planned =
  lighter on rings and bars, dashed on chips; `ui/button.ts`, `ui/Badge`; plain SVG charts.
- **Theming:** tokens in `design/` (ADR-0010); themes `label` (default) / `quaderno` /
  `sport` / `minimal` / `notte` override them (`data-theme`, per user), same components. Density compact (default) /
  comfortable per device (cookie, `data-density`: the root size scales every rem, ADR-0038).
- **Speed / testing:** `fra1`, cookie cache, one round of queries per page, pool 10, router cache
  30 s, Today's views switched in the browser (`ui/ViewSwitch`). Vitest + PGlite: the migrations
  run once, each test copies the result; CI: static checks, tests, build in parallel.
