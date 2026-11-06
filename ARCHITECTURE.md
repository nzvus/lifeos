# ARCHITECTURE.md

> Current state of the system only. No history, no alternatives, no rationale —
> those live in `docs/decisions/` and the spec (`docs/spec/`). Target: readable in
> 2 minutes, < ~150 lines. Update in the same commit as any change that alters it.

## System overview

One Next.js 16 (App Router) app in TypeScript at the repository root, plus its kit in
`packages/kit` (one npm workspace). v1 was retired on 6 Nov 2026 (DT-42): its code is in
git history, its export files still load through `core/convert` (DT-40).

- **Data:** Postgres on Neon, branch `v2` (`DATABASE_URL`), or a local PGlite folder
  (`V2_PGLITE_DIR`, migrated on start); Drizzle; Better Auth in the same database.
- **Model:** catalog objects and voci (entries) typed by kinds (`docs/spec/model.md`); the
  pure engines compute targets, judgements, energy, planning.
- **Screens:** places Corpo · Cibo · Oggi · Mente · Soldi, each with Diario · Piano · Elenco ·
  Andamento (`features/places.ts`); ⊕ at `/aggiungi`; built only from kit pieces
  (`docs/spec/patterns.md`).

## Component map

```
src/
  app/            routes, layouts, route handlers, server actions (thin)
    _server/      composition root: env.ts, runtime.ts (the one Db + Auth), owner.ts
                  (session -> Owner; every page and action starts with requireOwner())
    (auth)/       /sign-in, /sign-up
    (app)/        every signed-in page; layout.tsx mounts NavBar + ⊕ (PAT-01)
    api/          auth/[...all], health (DT-34)
  features/       presenters and client components per area (account, add, day, food,
                  library, money, plan, progress, shell, training, gallery = /kit)
  core/           no framework: db/ (schema, client, test-db), identity/ (Owner, ownedBy),
                  kinds/ (types, catalog.ts MOD-01), verbs/ (act + undo, PAT-24), entries/,
                  day/, food/, training/, plans/, goals/, quality/, energy/, movement/,
                  pantry/, money/, account/ (export, CSV), convert/ (v1 files -> v2),
                  auth/, health.ts, engines/ (pure: targets, judgements, energy, …)
  i18n/           common.ts, glossary (PAT-93)
packages/kit/     styles/ (tokens, kit.css, fonts), Glyph, format F, calendar, and the
                  pieces: Box, PageHeader, NavBar, Sheet, Toast, Confirm, Find, List,
                  ObjectPage, ObjectForm, … (PAT-*), each in the /kit gallery
drizzle/          committed SQL migrations (generated, read, committed)
e2e/              Playwright photos of /kit against committed images (PAT-94)
eslint/           fitness rules (PAT-90) + lint-baseline.json at the root
scripts/          check.py, hooks/ (Claude Code guards), backup.sh, restore-drill.sh,
                  vercel-ignore.sh, cpd.mjs, load-export.ts, import-sessions.ts, ui-check.mjs
docs/             spec/ (the truth), decisions/ (ADRs), runbooks/, archive/
```

## Key invariants

| Invariant | Enforced where |
| --- | --- |
| Logged data is never lost or silently corrupted | Daily encrypted `pg_dump` outside Neon + drilled restore (DT-34); migrations only via committed SQL, applied by `migrate-v2.yml` after a backup; deletes go to a trash |
| A user can never read another user's data | Every repository takes an `Owner` (only from a verified session) and filters with `ownedBy()`; never middleware (CVE-2025-29927) |
| A screen is a composition of kit pieces | Fitness lint with a shrinking baseline (PAT-90), jscpd (PRD-53), glossary test (PAT-93), kit photos (PAT-94) |
| A «built» requirement has a test citing its ID | `scripts/check.py` (PRD-42), local and CI |

## Boundaries & interfaces

```
app  ->  features  ->  core          features never import each other or app;
 |          |                         core imports no framework, never reads process.env
 +----> packages/kit  <---+           the kit never imports the app
```

- Server actions live in `app/`, next to their route; client components get them as props.
- `app/_server/` reads the environment lazily, so `next build` needs no secret (CI builds
  with none, as Vercel previews do).
- CLI scripts (`scripts/load-export.ts`, `import-sessions.ts`) get an account by email.

## Persistence & durability

Schema: `src/core/db/schema/*` → `npm run db:generate` → read the SQL in `drizzle/` → commit
→ `migrate-v2.yml` on the PR branch (backup, then migrate; type «migrate v2») → the CI
migration gate finds that run → merge. Never `drizzle-kit push` on a shared database.

Backups: `backup.yml` daily → `scripts/backup.sh` (pg_dump -Fc, verified, encrypted with
age) of branch `v2` (GitHub environment `v2`) → artifact `db-backup-v2-…`, 30 days; a missing
secret fails the run. Restore: `scripts/restore-drill.sh` into an empty database only.
Export/import: Profilo → Esporta (DT-40); `scripts/load-export.ts` for a whole file.

## Delivery

Vercel Hobby, project `lifeos-v2` (root directory = the repository root); production only
from protected `main` with green CI (`ci.yml`: static = check.py + typecheck + lint, test,
build with no secret, kit-shots; `check` holds the migration gate). `scripts/vercel-ignore.sh`
builds production only when the app changed, previews only for schema changes or
`*-preview` branches (100 deployments a day). healthchecks.io gets a ping after each dump
and from the `app-health` job (`/api/health`, a real query): silence is the alarm.

## Cross-cutting concerns

- **Config/secrets:** `app/_server/env.ts` (`.env.example`); Vercel env; GitHub environment
  `v2` for backup and migrate; the age key only on the developer's machine.
- **Auth:** Better Auth, email + password, DB sessions; sign-up only with `ALLOW_SIGNUP=true`.
- **Time:** «today» from the user's timezone, never the server's clock.
- **PWA:** `app/manifest.ts`, installable; no user data cached on the device (DT-60).
- **Testing:** Vitest next to the code (`*.test.ts`, DB tests on PGlite with the real
  migrations); Playwright only for the kit photos; Claude Code hooks run related tests,
  typecheck and lint on edits (PAT-91).
