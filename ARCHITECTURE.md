# ARCHITECTURE.md

> Current state of the system only. No history, no alternatives, no rationale —
> those live in `docs/decisions/`. Target: readable in 2 minutes, < ~150 lines.
> Update in the same commit as any change that alters what's written here.

## System overview

One Next.js 16 (App Router) app in TypeScript, deployed as one unit to Vercel (ADR-0004).
Routes in `src/app/` are thin: session, `core/`, feature components. Domain and data logic
live in `core/`, which imports no framework. Postgres on Neon through Drizzle (ADR-0003);
Better Auth in the same database (ADR-0006). Modules: nutrition (ingredients, meals, log
with snapshots, day types and targets, quality, trends), training (exercises with guides,
routines, programs, sessions, gym mode, progress), body (weigh-ins, sleep, movement) and
energy; pantry (products, purchases, derived stock, batches, reminders); money (one ledger of
movements, categories, receipts; ADR-0036); an assistant over
core tools (ADR-0018); trash; export; packs that add only what is missing, or plan estimates on a day (ADR-0034).

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
                ownedBy), nutrition/, training/, pantry/, money/, energy/, assistant/, trash/,
                export/, import/, catalog/ (packs), auth/,
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
| A past day's targets never change | `day_plans` holds a copy of the profile's targets, fixed when the day is chosen or its first food is logged (ADR-0008) |
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
database only. Export: `GET /api/export` (versioned JSON, live records, no secrets).

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
- **Targets:** per day (ADR-0008) fixed / default profile / none; auto maxima; bands (ADR-0023).
  A day's copy of its type is made only by `writePlan` (profiles.ts), with a dynamic type's
  parameters. A dynamic day (ADR-0014) computes them from `core/energy` (ranges, done +
  planned; no double counts, ADR-0021; × the accepted calibration, ADR-0020/0026; steps at
  one cost per step, ADR-0032). Weigh-ins carry a reliability (ADR-0027); sleep feeds day
  quality and trends, not energy (ADR-0031).
- **Log entries** (ADR-0009/0011/0022): planned or eaten, time/moment, servings −/+; totals =
  eaten, every panel also shows the day with the plan; tick and −/+ optimistic (`log/LiveDay`).
- **Editing (ADR-0015):** edit pages share ui/ActionBar (pinned ↺ / Cancel /
  Save), drafts in the browser, `?from=` for back and after-save, toasts with
  Undo. Rows open on tap; delete is a bin that asks first (ui/DeleteButton), "⋯"
  only for other actions. Delete = trash (`deleted_at`, `live()`); `/settings/trash`
  restores or deletes for good; `backup.yml`'s `purge-trash` job empties it after 30 days.
- **Short tasks in sheets:** adding food, training, a night, movement, a weigh-in, sorting —
  ui/Sheet via a `#id` link; long forms stay pages. Settings save themselves (ui/useAutoSave).
- **Assistant (ADR-0018):** the model runs on the server with the user's key
  (AES-GCM, `ASSISTANT_KEY_SECRET`); tools wrap core with the session's Owner;
  writes come back with Undo, deletes/imports wait for a tap; files are read on
  the phone; a data summary (`assistant/context.ts`) goes with every turn.
- **Derived, never stored:** pantry stock (ADR-0017, `core/pantry/stock.ts`: purchases −
  eaten − cooked ± counts), a program's coming days (ADR-0024, `core/training/program.ts`;
  only per-day overrides are stored, ADR-0029) and today's exercise target
  (`core/training/targets.ts`, double progression over the pattern guides, ADR-0028).
- **PWA (ADR-0019):** `app/manifest.ts` + `public/sw.js`: pages network-only, offline page
  as fallback, static files cache-first; no user data cached; dark splash.
- **Time:** `date` strings; "today" from `user_settings.timezone`, never the server's clock.
  **Search:** `core/shared/search.ts` (accent-insensitive, every word, match then 60-day use).
- **Responsive UI:** tabs by moment (ADR-0035), views as URLs (ADR-0033) — Today (summary |
  food | training, under a fixed day header; gym mode starts here) · Training (plan: a week or
  month swiped sideways, the programs | routines | exercises; ADR-0036) · Food (meals |
  ingredients | pantry) · Money (overview | movements) · Progress (trends | weight | training);
  the Assistant in the header; a bottom bar on phones, header on md+. `sm:/md:/lg:` obey
  `data-layout` (ADR-0010); container queries in cards; checked at 360 px, text 120 %.
- **Visual language:** colour = state (short / in the zone / over: `bandState`,
  ui/NutrientRow); nutrients keep their colour on icons and bars, numbers are ink; planned =
  lighter on rings and bars, dashed on chips; `ui/button.ts`, `ui/Badge`; plain SVG charts.
- **Theming:** tokens in `design/` (ADR-0010); themes `label` (default) / `quaderno` /
  `sport` / `minimal` / `notte` override them (`data-theme`, per user), same components.
- **Speed / testing:** `fra1`, cookie cache, `loading.tsx`, one parallel round of queries per
  page, pool of 10, router cache 30 s; Today's views switched in the browser (`ui/ViewSwitch`,
  URL by replaceState). Vitest + PGlite with the real migrations.
