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
  - [x] ADR-0002 Architecture style + app-vs-kit split — feature slices over shared layers; kit is a marked folder region, not a package
  - [x] ADR-0003 Persistence + data-durability invariant — Postgres on Neon + Drizzle; migrations rehearsed on a DB branch; backups owned by the repo, not the provider
  - [x] ADR-0004 Delivery target & CI — Vercel Hobby from a protected `main`; migrations applied only by a human-triggered CI job; dead-man's switch on the backup, because a stopped scheduler raises no error
  - [x] ADR-0006 Authentication & session model — Better Auth, email+password, users/sessions in our own Postgres so a restore is complete; isolation enforced at the `core/` data boundary, never middleware; RLS deferred behind one helper until account #2
  - [ ] ADR-0005 Domain data model: heterogeneous exercises & aggregations — **deferred out of S00 by design**, belongs to the first training sprint; not a blocker for nutrition v1. `check.py` will WARN about the 0005 numbering gap until it is written — expected, do not "fix" it by renumbering
- **S00 decisions are complete; the sprint is NOT closed.** Every foundational decision is made, so S01 has no open architecture questions.
- **Retro in progress, paused at the interview step (2026-07-30).** The five decisions were accepted under time pressure without the human reading them, so a reading brief was written and 9 questions put to them: 6 comprehension checks (one per record) and 3 retro questions (which decision they'd argue with / where the collaboration went badly / what they can now explain). Brief: https://claude.ai/code/artifact/63a23f9b-dfdd-493f-888e-f9c5157418fe
- **To resume from any device/session:** read the brief above, take the human's answers, then continue the `retro` skill from step 4 — compress S00 into `## Done`, propose at most two process changes based on what they say in answer 08, and draft S01's goal for a separate conversation. The recorded sprint lesson must be their words, not the agent's. Also outstanding: the "What I learned" section of ADR-0001, 0002, 0003, 0004 and 0006 is agent-drafted and awaits their edit.
- **Risks / open questions:** repeating the Vercel+Supabase failure (config rot / silent data loss); over-abstracting the kit before the app needs it.
- **Carried into S01 (from ADR-0002):** the scaffold is not done until the six `src/` directories, the `eslint-plugin-boundaries` rules and the Tailwind `@theme` token file all exist — an unenforced boundary rule is only a promise.
- **Carried into S01 (from ADR-0003):** the first entity is not done until its migration went through the committed generate-review-branch-apply path, one restore drill has been performed and written up, and a cross-user read test exists.
- **Carried into S01 (from ADR-0004):** the scaffold also owes the CI workflow, branch protection on `main`, `/api/health`, the scheduled dump workflow and the healthchecks.io check — an unmonitored backup is only a hope.
- **Review criteria:** ADR-0001..0004 + ADR-0006 accepted with real options weighed; `python scripts/check.py` clean; CLAUDE.md Stack/Run/Test/Lint fields filled from ADR-0001.

## Done
<!-- retro skill appends compressed entries here, newest first -->
<!-- Format:
### S00 — Walking skeleton (dates)
Shipped: ... | Decisions: ADR-0001..4 | Lesson: <one sentence> | Carried over: ...
-->
