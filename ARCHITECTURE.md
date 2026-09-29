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
(ADR-0006). Nutrition v1 is implemented: ingredients, meals, daily log with
snapshots (ADR-0007, proposed), day profiles with per-day target copies
(ADR-0008), JSON export.

## Component map

```
src/
  app/          routes, layouts, route handlers, SERVER ACTIONS (thin)
    _server/    composition root: env validation, the one Db + Auth instance,
                session -> Owner, dictionary selection. Server-only.
    (auth)/     /sign-in, /sign-up          (app)/  every signed-in page
    api/        auth/[...all], health, export
  features/     vertical slices (area/slice): account/{auth,settings},
                nutrition/{ingredients,meals,log}. Components only.
  core/         db/ (schema, client), identity/ (Owner, ownedBy),
                nutrition/ (nutrients, totals, targets, validation,
                repositories/), export/, import/ (FitForge plan + apply),
                auth/, shared/ (decimal, dates, result, format, locales),
                testing/ (PGlite test db)
  ui/           Field, SelectField, SearchSelect (combobox), NavBar,
                MacroBar, SubmitButton, FormAlert, ActionButtonForm
  design/       theme.css — Tailwind v4 @theme tokens (light + dark)
  i18n/         messages.en.ts (reference shape), messages.it.ts, fill()
drizzle/        committed SQL migrations (generated, reviewed)
scripts/        check.py, backup.sh, restore-drill.sh, vercel-build.mjs,
                import-fitforge.ts (local CLI; dry run unless --apply)
docs/runbooks/  setup, restore drill, lint-rule proof
```

`ui/ + design/ + i18n/` are the reusable **kit**: a marked region, not a package.

## Key invariants

| Invariant (PROJECT.md §3) | Enforced where |
| --- | --- |
| Logged data is never lost or silently corrupted | Daily encrypted `pg_dump` outside Neon + drilled restore (`scripts/`, `backup.yml`); migrations only via committed SQL, rehearsed on preview branches, applied to production by `migrate.yml` after a backup; log entries are snapshots (ADR-0007); decimals exact end to end (`numeric` + big.js), money in integer cents; validation rejects more decimals than a column stores |
| A user can never read another user's data | Every repository takes an `Owner` (branded type, only from a verified session) and filters with `ownedBy()`; composite foreign keys `(id, user_id)` make the DB refuse cross-user links; cross-user tests per entity. Never middleware (CVE-2025-29927) |
| A past day's targets never change | `day_plans` holds a copy of the profile's targets, fixed when the day is chosen or its first food is logged (ADR-0008) |
| A day/meal's totals equal the sum of its entries | `core/nutrition/totals.ts` only; computed on read, exact, rounded once at display; no stored aggregates |

Structural invariants, enforced by ESLint (proof: `docs/runbooks/lint-boundaries.md`):

- `core/` imports only `core/` and no framework package (ADR-0001).
- No feature slice imports another; slices meet in `core/` (ADR-0002).
- No hex colour, Tailwind arbitrary value or JSX text outside `design/`/`i18n/`.
- i18n ↔ core consistency (nutrients, error codes, locales) is a compile-time
  check in `app/_server/i18n.ts`.

## Boundaries & interfaces

```
app  →  features  →  core
 │         ↓          ↑
 └──→  ui  →  design, i18n     (app may also import core, ui, i18n directly)
```

- **Server actions live in `app/`**, next to their route, not in `features/`:
  an action must read the session cookie, which ADR-0006 allows only in `app/`.
  Feature components receive actions as props. Every action: `requireContext()`
  → core validation → core repository → `revalidatePath`/`redirect`.
- `core/` never reads `process.env` or request state; `app/_server/` passes in
  what it needs (factories `createDb`, `createAuth`; an `Owner` per call).
- `ui/` is presentation only: translated strings in, no domain types.
- Local CLI scripts get an `Owner` from `core/identity/local-admin.ts` (by
  email, no session): they already hold full DB credentials. The web app
  (`app/`, `features/`) never imports that file.
- Promotion into `ui/` follows the rule of three; the current `ui/` components
  each had 3+ users when written.

## Persistence & durability (ADR-0003, ADR-0007)

Schema: `core/db/schema/{auth,nutrition}.ts`. Change path: edit schema →
`npm run db:generate` → read the SQL in `drizzle/` → commit → PR preview
applies it to its own Neon branch (`scripts/vercel-build.mjs`, only when
`PREVIEW_DB_IS_BRANCH=true`) → merge → run `migrate.yml` (backup, then
migrate). `drizzle-kit push` only against throwaway local databases.
Additive-first changes, because deploy and migrate are separate acts.

Backups: `backup.yml` daily → `scripts/backup.sh` (pg_dump -Fc, verified with
pg_restore --list, encrypted with age to a public key) → workflow artifact,
30 days. Restore: `scripts/restore-drill.sh` into an empty database only.
User-facing export: `GET /api/export` (versioned JSON, no secrets).

## Delivery (ADR-0004)

Vercel Hobby from git; production only from protected `main` with green CI
(`ci.yml`: check.py, typecheck, lint, tests, build). Monitoring watches for
silence: `backup.yml` pings healthchecks.io after each successful dump, and its
`app-health` job calls `/api/health` and pings a second check. healthchecks.io
cannot poll URLs itself, so app health has daily granularity.

## Cross-cutting concerns

- **Errors:** expected failures are values (`Result` with error CODES from
  `core/shared/result.ts`), translated by the UI via `i18n` `errors`; forms get
  codes per field plus their submitted values back. Unexpected failures throw
  and reach `app/(app)/error.tsx`. Postgres constraint codes (23505, 23503,
  23001) are mapped to codes in repositories.
- **Config/secrets:** validated once in `app/_server/env.ts` (names in
  `.env.example`). Vercel env for the app; GitHub secrets/variables for
  backup and migrate; age private key only on the developer's machine.
- **Auth/security:** Better Auth, email+password (min 10), DB-backed sessions
  (30 days, cached 5 min in a signed cookie: a revoked session can live up to
  5 more minutes) and DB-backed rate limiting; HttpOnly cookies, Secure on HTTPS;
  sign-up closed unless `ALLOW_SIGNUP=true`. Authorization checked in every
  page/action (`requireContext`) and again at the data boundary (`Owner`).
- **Targets:** per day from `core/nutrition/repositories/profiles.ts`:
  fixed copy, else default profile (live), else none (ADR-0008).
  `user_settings.target_*` are deprecated and unread.
- **Time:** days are `date` strings; "today" uses the user's time zone
  (`user_settings.timezone`), never the server's UTC clock.
- **Search & ordering:** one function, `core/shared/search.ts` (case- and
  accent-insensitive, every word must match, ranked by match quality then
  usage). Usage = log entries per meal/ingredient in the last 60 days,
  computed on read (`repositories/usage.ts`). Lists search in the browser.
- **Responsive UI:** phones get a bottom tab bar and card lists; md+ gets
  header navigation and tables; lg+ shows the day in two columns with a
  sticky label. Form pages cap at `--container-page`, others at
  `--container-wide`.
- **Performance:** Vercel functions pinned to `fra1` next to Neon
  (`vercel.json`); Better Auth cookie cache (5 min) skips the session query;
  `app/(app)/loading.tsx` gives instant feedback; client components receive
  only the dictionary slices they use.
- **Theming/i18n:** tokens are CSS custom properties; dark theme follows the
  OS (manual toggle is backlog). Locale per user (`it` default, `en`).
- **Testing:** Vitest; DB tests on PGlite with the real migrations applied.
