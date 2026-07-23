# ROADMAP.md

> One file: future (top), present (middle), past (bottom). Completed sprints
> are compressed to a few lines by the `retro` skill — never deleted.

## Backlog (unordered, one line each)
- S01 Walking skeleton: auth + one nutrition entity live on free tier
- Nutrition v1: ingredients CRUD → meals (aggregation) → daily log → totals vs objective
- Training: heterogeneous exercises, sessions, estimated burn (ADR-0005 first)
- Gamification: daily/weekly/monthly roll-ups, surplus/cut, objectives
- UX/kit: one-click theming, reusable widgets, i18n dictionary, smart search, lazy loading, gym timer
- Data ownership: export/import; later AI review of goals

## Current sprint: S00 — Foundational decisions (ADRs)
- **Goal:** All foundational ADRs accepted, so sprint 1 (walking skeleton) can start with no open architecture questions.
- **Slices:** (each = one ADR, in dependency order)
  - [x] ADR-0001 Language & framework — TypeScript + Next.js App Router, domain logic in a framework-agnostic `core/`
  - [ ] ADR-0002 Architecture style + app-vs-kit split (parallel track)
  - [ ] ADR-0003 Persistence + data-durability invariant (backups, migrations)
  - [ ] ADR-0004 Delivery target (free-tier deploy) & CI + health check
  - [ ] ADR-0005 Domain data model: heterogeneous exercises & aggregations (needed before training, not before nutrition v1)
- **Risks / open questions:** repeating the Vercel+Supabase failure (config rot / silent data loss); over-abstracting the kit before the app needs it.
- **Input for ADR-0002 (from the ADR-0001 session):** the previous project died of *under*-abstraction — widgets/cards/toasts existed as near-identical copies, so one style, label or dimension change meant editing many files (shotgun surgery). ADR-0002 must separate three things that behave differently: design tokens (style/spacing/dimensions) and the i18n dictionary — centralised from day one, they are single sources of truth for *values*, not abstractions — versus shared *components*, which are abstractions and should be extracted on the second or third real occurrence, with the copies then deleted. Also needs the enforcement mechanism (lint rules), since an unenforced rule decays.
- **Review criteria:** ADR-0001..0004 accepted with real options weighed; `python scripts/check.py` clean; CLAUDE.md Stack/Run/Test/Lint fields filled from ADR-0001.

## Done
<!-- retro skill appends compressed entries here, newest first -->
<!-- Format:
### S00 — Walking skeleton (dates)
Shipped: ... | Decisions: ADR-0001..4 | Lesson: <one sentence> | Carried over: ...
-->
