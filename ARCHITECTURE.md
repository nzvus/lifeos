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

No code exists yet — this describes the structure S01 scaffolds. Persistence
(ADR-0003) and deployment/CI (ADR-0004) are not yet decided.

## Component map

```
src/
  app/        Next.js routes, layouts, route handlers. Thin: no domain logic.
  features/   Vertical slices, grouped by domain area.
                nutrition/ingredients, nutrition/meals, nutrition/log, …
              Each slice owns its components, hooks and server actions.
  core/       Pure domain + data logic. No framework imports. Entities,
              calculations (macro/cost totals), validation, persistence ports.
  ui/         Shared presentational components. Populated only by promotion.
  design/     Design tokens (Tailwind v4 `@theme`) → CSS custom properties.
  i18n/       Dictionary of every user-facing string.
```

`ui/ + design/ + i18n/` are the reusable **kit**: a marked region of the tree,
not a package. They become packages only when a second consumer exists.

## Key invariants

| Invariant (PROJECT.md §3) | Enforced where |
| --- | --- |
| Logged data is never lost or silently corrupted | ADR-0003 — not yet decided |
| A user can never read another user's data | ADR-0003 — not yet decided |
| A day/meal's totals equal the sum of its entries | `core/` — totals computed in one place; the UI never sums |

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
- `core/` is the bottom of the graph. It defines the ports that ADR-0003's
  persistence will implement; nothing outside `core/` talks to a database.
- `ui/` is presentation only — no domain types, no data fetching.
- `design/` and `i18n/` are leaves: they hold values and import nothing.

**Promotion into `ui/`** (rule of three): a component starts in the slice that
needs it, and moves to `ui/` on its second or third genuine occurrence, with all
copies deleted in the same commit. Shared *behaviour* is not a `ui/` case — it
goes to `core/`.

## Cross-cutting concerns

- **Errors:** not yet designed. Decided with the first slice in S01.
- **Config/secrets:** not yet designed — depends on ADR-0003 / ADR-0004.
- **Logging/observability:** not yet designed; a health check is in ADR-0004's
  scope.
- **Auth/security:** not yet designed (ADR-0003). Data isolation is a hard
  invariant, so the mechanism is decided before the first persisted entity.
- **Theming/i18n:** tokens are CSS custom properties emitted by Tailwind v4
  `@theme`, so one-click theming is a runtime variable swap. All user-facing
  strings resolve through `i18n/`.
