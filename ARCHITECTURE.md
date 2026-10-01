# ARCHITECTURE.md

> Current state of the system only. No history, no alternatives, no rationale —
> those live in `docs/decisions/`. Target: readable in 2 minutes, < ~150 lines.
> Update in the same commit as any change that alters what's written here.

## System overview

A single Next.js 16 (App Router) application in TypeScript, deployed as one
unit to Vercel (ADR-0004). Routes under `src/app/` are thin: they resolve the
session, call `core/`, and render feature components. All domain and data
logic lives in `core/`, which imports no framework. Data is Postgres on Neon
through Drizzle (ADR-0003); identity is Better Auth in the same database
(ADR-0006). Modules: nutrition (ingredients, meals, daily log with snapshots,
day types and targets, quality, trends) and training (exercises, routines,
sessions incl. estimates and live mode, body measurements, progress); pantry
(products, purchases, derived stock, batches, reminders); an assistant that
acts through core tools (ADR-0018); a trash for everything deletable; export.

## Component map

```
src/
  app/          routes, layouts, route handlers, SERVER ACTIONS (thin)
    _server/    composition root: env, the one Db + Auth, session -> Owner,
                dictionary selection. Server-only.
    (auth)/     /sign-in, /sign-up          (app)/  every signed-in page
    api/        auth/[...all], health, export
  features/     vertical slices (area/slice), components only:
                account/{auth,settings,trash}, nutrition/{ingredients,meals,log,
                profiles,trends,pantry}, training/{body,exercises,live,progress,routines,sessions}
  core/         db/ (schema: auth, nutrition, training; client), identity/ (Owner,
                ownedBy), nutrition/, training/, pantry/, energy/, assistant/, trash/,
                export/, import/, auth/,
                shared/ (validation, search, browse, sorting, dates, trash…), testing/
  ui/           one component per repeated thing: button.ts, Badge, Section,
                Collapsible, ListItem, Menu/TrashMenu, ActionBar, Toast, MacroStrip, …
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
- `ui/` is presentation only: translated strings in, no domain types.
- Local CLI scripts get an `Owner` by email (`core/identity/local-admin.ts`);
  the web app never imports it. Promotion into `ui/` follows the rule of three.

## Persistence & durability (ADR-0003, ADR-0007)

Schema: `core/db/schema/{auth,nutrition,training,pantry}.ts`. Change path: edit schema
→ `npm run db:generate` → read the SQL in `drizzle/` → commit → the PR preview
applies it to its own Neon branch (`scripts/vercel-build.mjs`, when
`PREVIEW_DB_IS_BRANCH=true`) → `migrate.yml` on the PR branch (backup, then
migrate) → label `production-migrated` (CI gate) → merge. No `drizzle-kit
push`. Schema PRs must be safe to merge in any order (additive first).

Backups: `backup.yml` daily → `scripts/backup.sh` (pg_dump -Fc, verified,
encrypted with age) → workflow artifact, 30 days. Restore:
`scripts/restore-drill.sh` into an empty database only. Export: `GET
/api/export` (versioned JSON, live records only, no secrets).

## Delivery (ADR-0004)

Vercel Hobby from git; production only from protected `main` with green CI
(`ci.yml`: check.py, typecheck, lint, tests, build). Previews build only for
schema changes or `*-preview` branches (`scripts/vercel-ignore.sh`; Hobby
allows 100 deployments a day). Monitoring watches for silence: `backup.yml`
pings healthchecks.io after each dump, and its `app-health` job calls
`/api/health` and pings a second check.

## Cross-cutting concerns

- **Errors:** expected failures are `Result` values with codes (`core/shared/result.ts`,
  translated by i18n; Postgres 23505/23503/23001 mapped); the rest throw to `error.tsx`.
- **Config/secrets:** validated once in `app/_server/env.ts` (`.env.example`); Vercel
  env for the app, GitHub secrets for backup/migrate, age key only on the developer's machine.
- **Auth/security:** Better Auth, email+password, DB-backed sessions (30 days,
  5-min signed cookie cache) and rate limiting; sign-up closed unless
  `ALLOW_SIGNUP=true`. Authorization in every page/action (`requireContext`)
  and again at the data boundary (`Owner`).
- **Targets:** per day (ADR-0008): fixed copy, else default profile, else none; auto maxima.
  A dynamic day (ADR-0014) computes them from `core/energy` (ranges, done + planned).
- **Log entries** (ADR-0009/0011): planned or eaten, optional time/moment, maybe an
  estimate; totals = eaten, and every panel also shows the day with the plan.
- **Editing (ADR-0015):** edit pages share ui/ActionBar (pinned ↺ / Cancel /
  Save), drafts in the browser, `?from=` for back and after-save, toasts with
  Undo. Rows open on tap and carry "⋯" (ui/ListItem `href`, ui/TrashMenu).
  Delete = trash (`deleted_at`, `live()`); `/settings/trash` restores or deletes for
  good; the 30-day purge (`purgeExpiredTrash`) awaits its workflow job.
- **Assistant (ADR-0018):** the model runs on the server with the user's key
  (AES-GCM, `ASSISTANT_KEY_SECRET`); tools wrap core with the session's Owner;
  writes come back with Undo, deletes/imports wait for a tap; files are read on
  the phone; network (Open Food Facts) is injected from `app/_server`.
- **Pantry (ADR-0013/0017):** stock is derived, never stored (`core/pantry/stock.ts`):
  purchases − eaten (not batch portions) − cooked ± counts; food per ingredient.
- **PWA (ADR-0019):** `app/manifest.ts` + `public/sw.js`: pages network-only (offline
  page as fallback), `/_next/static` cache-first; no user data is ever cached.
- **Time:** days are `date` strings; "today" uses `user_settings.timezone`,
  never the server's clock. Client clocks start in the browser (hydration).
- **Search & ordering:** `core/shared/search.ts` (accent-insensitive, every word,
  ranked by match then 60-day usage); sorts toggle ↑/↓, missing values last.
- **Responsive UI:** phones get a bottom tab bar, md+ header navigation, lg+
  the day in two columns. Page layout uses `sm:/md:/lg:`, redefined to obey
  `data-layout` (auto/desktop/phone, ADR-0010); inside cards and `<main>`,
  container queries follow the real width.
- **Visual language:** one colour per nutrient, graded by target kind and distance
  (`ui/targetTone.ts`); planned = dashed; buttons `ui/button.ts`, statuses `ui/Badge`,
  every section with its icon; `lucide-react` icons; plain SVG charts.
- **Theming/i18n:** tokens (ADR-0010: colour, type, frames, radii, surfaces
  `panel`/`tile`/`item`, headings, icon chips) in `design/`; themes `label`
  (default) / `quaderno` / `sport` / `minimal` / `notte` override them
  (`data-theme`, per user) and share the same components.
- **Performance / testing:** `fra1`, cookie cache, `loading.tsx`; Vitest + PGlite, contrast tests.
