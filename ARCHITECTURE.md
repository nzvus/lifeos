# ARCHITECTURE.md

> Current state of the system only. No history, no alternatives, no rationale —
> those live in `docs/decisions/`. Target: readable in 2 minutes, < ~150 lines.
> Update in the same commit as any change that alters what's written here.

## System overview

A single Next.js (App Router) application in TypeScript, deployed as one unit.
Routes under `src/app/` are thin: they resolve the request, call into a feature
slice or `core/`, and render. All domain and data logic lives in `core/`, which
is framework-agnostic and imports nothing from Next.js. User-facing features are
vertical slices under `src/features/`; anything shared between them is either
behaviour (which belongs in `core/`) or presentation (which belongs in `ui/`).
Style values and user-facing strings are centralised in `design/` and `i18n/`.

No code exists yet — this describes the structure S01 scaffolds. Data lives in
managed Postgres on Neon, reached only through `core/` repositories (ADR-0003),
and the app deploys to Vercel Hobby with CI on GitHub Actions (ADR-0004).
Authentication (ADR-0006) is the last undecided foundation.

## Component map

```
src/
  app/        Next.js routes, layouts, route handlers. Thin: no domain logic.
  features/   Vertical slices, grouped by domain area.
                nutrition/ingredients, nutrition/meals, nutrition/log, …
              Each slice owns its components, hooks and server actions.
  core/       Pure domain + data logic. No framework imports. Entities,
              calculations (macro/cost totals), validation, and the Drizzle
              schema + repositories — the only code holding a DB connection.
  ui/         Shared presentational components. Populated only by promotion.
  design/     Design tokens (Tailwind v4 `@theme`) → CSS custom properties.
  i18n/       Dictionary of every user-facing string.
```

`ui/ + design/ + i18n/` are the reusable **kit**: a marked region of the tree,
not a package. They become packages only when a second consumer exists.

## Key invariants

| Invariant (PROJECT.md §3) | Enforced where |
| --- | --- |
| Logged data is never lost or silently corrupted | Scheduled `pg_dump` to storage Neon does not control + a drilled restore; migrations rehearsed on a DB branch; money as integer minor units, macros as `numeric` (ADR-0003) |
| A user can never read another user's data | `core/` repositories require a caller identity; each user-owned entity ships a test proving a cross-user read returns nothing (ADR-0003; hardening to RLS is ADR-0006's call) |
| A day/meal's totals equal the sum of its entries | `core/` — computed on read in one place, no stored aggregates; the UI never sums (ADR-0003) |

Structural invariants from ADR-0002, enforced by `eslint-plugin-boundaries`:

- `core/` imports nothing from `next/*` or any framework module (ADR-0001).
- No feature slice imports another feature slice; slices meet in `core/`.
- No literal colour, spacing value or user-facing string outside `design/` and
  `i18n/` (includes Tailwind arbitrary values such as `p-[13px]`).

## Boundaries & interfaces

Dependencies point one way only:

```
app  →  features  →  core
            ↓
           ui  →  design, i18n
```

- `app/` may not contain domain logic; it delegates.
- `core/` is the bottom of the graph. Its repositories own the Drizzle schema
  and every query; nothing outside `core/` talks to a database. Drizzle is
  framework-free, so `core/` purity (ADR-0001) is unaffected.
- `ui/` is presentation only — no domain types, no data fetching.
- `design/` and `i18n/` are leaves: they hold values and import nothing.

**Promotion into `ui/`** (rule of three): a component starts in the slice that
needs it, and moves to `ui/` on its second or third genuine occurrence, with all
copies deleted in the same commit. Shared *behaviour* is not a `ui/` case — it
goes to `core/`.

## Persistence & durability (ADR-0003)

Managed Postgres on Neon, consumed as a plain connection string. Access is
Drizzle, inside `core/` only.

Schema changes follow one path: `drizzle-kit generate` produces a numbered SQL
migration → it is read and committed → it is applied to the pull request's own
Neon branch and inspected → production is migrated only by the human-triggered
CI job, which dumps first (ADR-0004). `drizzle-kit push` is for throwaway local
databases and never touches a shared one. Schema changes are additive-first (add,
backfill, then read), because deploy and migrate are separate acts.

Durability does not rely on the provider: the free tier has a 6-hour restore
window, which is shorter than the normal gap between work sessions. Instead a
scheduled `pg_dump` writes to storage outside Neon, several generations are
kept, and the restore procedure is drilled and written down. The user-facing
data export is part of this invariant, not a feature — it ships in nutrition v1.

## Delivery (ADR-0004)

Vercel Hobby, deployed from git: previews from branches, production only from a
protected `main` that requires green CI. CI is GitHub Actions — typecheck, ESLint
with the boundary rules, tests — on every push and pull request. Each preview
gets its own Neon database branch, which is where migrations are rehearsed.

The scheduled `pg_dump` runs as a GitHub Actions workflow, because no free
serverless runtime ships the binary. That scheduler self-disables after 60 days
without a commit, silently, so it is watched by a **dead-man's switch**: the
workflow pings healthchecks.io on success and the absence of a ping raises the
alert. Monitoring here watches for silence, not for errors.

## Cross-cutting concerns

- **Errors:** not yet designed. Decided with the first slice in S01.
- **Config/secrets:** Vercel environment variables for the app, GitHub Actions
  secrets for the dump job; local and deployed config are separate and never
  committed. Current secrets: Neon connection string, healthchecks.io ping URL.
- **Logging/observability:** `/api/health` returns a trivial DB query plus the
  deployed commit SHA — "deployed" and "working" are different claims. It and
  the backup heartbeat report to the same alerting channel.
- **Auth/security:** login and sessions are ADR-0006, which also decides whether
  isolation is hardened from `core/`-level to Postgres RLS. Isolation is a hard
  invariant, so this lands before the first persisted user-owned entity.
- **Theming/i18n:** tokens are CSS custom properties emitted by Tailwind v4
  `@theme`, so one-click theming is a runtime variable swap. All user-facing
  strings resolve through `i18n/`.
