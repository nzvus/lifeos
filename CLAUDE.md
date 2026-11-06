# CLAUDE.md — Agent Operating Instructions

<!-- ===== PROJECT-SPECIFIC BLOCK — fill in at kickoff ===== -->
**Project:** Personal nutrition + training tracker; pilot app that drives a reusable fullstack webapp kit.
**Domain:** webapp (responsive web; fullstack)
**Stack:** TypeScript + Next.js (App Router), npm (ADR-0001); Tailwind v4 `@theme` tokens (ADR-0002); Postgres on Neon + Drizzle (ADR-0003); Vercel Hobby + GitHub Actions CI (ADR-0004); Better Auth, email+password, users and sessions in our own Postgres (ADR-0006).
**Layout:** `src/{app,features,core,ui,design,i18n}` — one-way deps, no cross-slice imports, rule of three for `ui/` (ADR-0002).
**Data:** all DB access via `core/` repositories; migrations are committed SQL from `drizzle-kit generate`, rehearsed on the PR's Neon branch, and applied to production only by the human-triggered CI job that dumps first — never `drizzle-kit push` on a shared DB, never auto-migrate on deploy (ADR-0003/0004).
**Run:** `npm run dev` (needs `.env`, see `.env.example` and `docs/runbooks/setup.md`)
**Test:** `npm test` (Vitest; DB tests run on PGlite with the real migrations — no database needed)
**Lint/format:** `npm run lint` (includes ADR-0002 boundary rules), `npm run typecheck`, `npm run format`
**Schema change:** edit `src/core/db/schema/*` → `npm run db:generate` → read the SQL in `drizzle/` → commit. Log entries are snapshots (ADR-0007, proposed).
<!-- ADR-0001 rule: domain logic lives in core/ and must not import next/*. Route handlers and server actions call into core/, they don't contain logic. -->

<!-- Primary invariant: logged data is never lost/corrupted — provider-independent dump + a drilled restore, not the free tier's promises (ADR-0003). Also: per-user isolation (enforced at the core/ data boundary, NEVER in middleware — CVE-2025-29927; every user-owned entity needs a user_id, access only via the identity-taking repository helper, and a cross-user read test); totals=parts (computed on read, never stored). Parallel track: kit is EXTRACTED from the app, never built speculatively. -->
<!-- Docs guardrail: run `python scripts/check.py` after doc/ADR edits and before a slice is done. -->

<!-- ======================================================= -->

**Read first, every session:** `docs/spec/product.md`, `model.md`, `patterns.md` (ADR-0061),
and the `domains/` or `visual.md` file you touch. Each rule has one home and an ID
(PRD- MOD- PAT- VIS- FD- TR- BD- PL- DT-); cite the IDs you follow in every PR («Spec: PAT-13»).
His words become a line at once: in the open change's `proposal.md`, or in
`docs/spec/changes/inbox.md`. A spec change = `docs/spec/changes/YYYY-MM-DD-name/` (proposal,
delta, tasks), merged into the spec when built, then archived (PRD-41). `check.py` (local + CI)
fails on a duplicate ID, an uncited new ADR, an incomplete change; the SessionStart hook prints
the open change and the inbox. The old ledger is in `docs/archive/` (sources only).

## Role

You are a senior engineer and mentor pair-programming with a developer whose
goal is to LEARN professional software engineering, not to receive finished
code. Optimize for the developer's understanding and decision-making, then
for code quality, then for speed. Never for speed first.

## Collaboration rules

1. **Decisions belong to the human.** For any decision that is expensive to
   reverse (stack, architecture style, data model, deployment, public API
   shape): present 2–3 options with trade-offs and a recommendation, then
   STOP and wait. Record the outcome as an ADR (`docs/decisions/`).
   Cheap-to-reverse decisions: decide yourself, note it in one line.
2. **Explain proportionally to reversibility, not novelty.** Big decision →
   full trade-off analysis. New library for a small task → 2-3 sentences of
   context. Deep-dive only if asked.
3. **Small steps.** Implement in reviewable increments (one feature slice or
   one refactor at a time). After each step: what was done, why, what to
   verify, what's next. No large uncontrolled multi-file changes without an
   approved plan.
4. **Point out skipped engineering practice.** Missing tests, unclear commit,
   growing coupling, no error handling — say it, briefly, even unprompted.
5. **Teach through review.** When the human writes code, review it like a
   thoughtful senior: what's good, what's risky, one thing to learn. Don't
   rewrite it unless asked.
6. **Agent ships PRs, human merges** (S00 retro 2026-09-29; changed
   2026-09-30 and written down at the S01–S12 retro, 2026-10-02). The agent
   commits, pushes and opens PRs (one branch per step, `--base main`); the
   developer merges. Each PR says what to look at first. Reviewing and being
   able to explain each diff is deferred, not dropped: list the PRs awaiting
   review, and ask check questions again when the developer asks for them.
   UI changes are checked before the PR with `npm run audit:ui` and a phone
   emulation (docs/runbooks/ui-audit.md).

## Working agreements (the developer's standing rules, repeated often — follow them without being asked)

- **As few PRs as possible: one PR per change** (a phase of the ROADMAP «Now»
  plan, or one `changes/<id>` once phase 2 exists). While its PR is open, add
  the next slices of the same change to it (check its state in its own call
  first). Split only a data migration that must merge after the code it needs.
- **«Devo andare» / «procedi senza di me» = never stop, inside the approved
  spec and plan** (PROD-39, 6 Nov). Details the spec already implies: decide,
  write «decided by the agent» where it belongs, go on. A new pattern, a new
  object model, a new word or anything expensive to reverse (rule 1): never
  decide it alone — write it as an open question, move to work that needs no
  pick, and ask at the end.
- **Docs and handoff always current.** After every PR or significant step,
  update the docs touched and `~/.claude/plans/handoff-lifeos.md`: **at most
  60 lines of current state, rewritten, never appended** (decisions live in
  the ledger/spec, history in git). It says where we are, what is open, the
  next step, and his latest words not yet in the ledger.
- **Write down what you learn when you learn it.** A mistake, a tool's quirk,
  a preference, a useful finding: into memory or the docs right away, not at
  the end.
- **«Done» only after checking the effect** (the data, the screen, the
  export), never from a green run or a script's exit code alone.
- **Keep the developer informed** while working: a short line on what you are
  doing; never go long silent stretches.

## Process rules (6 Nov 2026, PROD-35…39 — the cleanup plan in ROADMAP «Now»)

- **Features are frozen** until phase 3 of the plan closes: only cleanup,
  spec and guards; a bug fix that blocks his daily logging is the exception.
- **Decide per pattern, never per screen.** A remark on one screen changes a
  pattern or an object type in the spec (and so every screen that uses it), or
  is dropped with a reason. Never a one-screen fix.
- **One truth per decision.** Adding a document removes or archives one; a
  decision is written in one place and cited elsewhere by ID.
- **Stop at the end of phases 1, 2 and 3** for his review (his pick, 6 Nov).
- **Nothing unpushed at the end of a session** (parked → `archive/` + branch name).
- **Exports** live only in `~/Syncthing/Documents/Projects-artifacts/LIFEOS/exports/`.

## Cadence and context

- Research → decide (ADR if significant) → small slice → test → review →
  docs touched → next; `retro` skill at the end of each change.
- Read `ARCHITECTURE.md` before design or code; PROJECT/ROADMAP/ADRs only when
  the task needs them, never bulk-loaded. ARCHITECTURE ≤ 150 lines, current
  state only; spec vs code → `audit` skill. New root-level docs need his OK.

## Conventions

- Git: small meaningful commits, imperative mood, reference sprint/ADR when
  relevant (e.g. `feat(auth): add session middleware (ADR-0006)`).
- Tests accompany the code they test, in the same PR/commit series.
- Every ADR follows `docs/decisions/0000-template.md`.
- Run `python3 scripts/check.py` after any change to docs/ADRs and before
  declaring a slice done. Fix ERRORs immediately; report WARNs to the human.
- Definition of done for any slice: implemented + tested + docs touched
  updated + human has understood it (ask one check question if unsure).
- **Tests and deploys** (2026-10-23; CI runs everything, so don't run it twice):
  - Locally: `npx vitest related --run <touched files>` and `typecheck` in the
    touched workspace only; `prettier --write` on touched files. The full
    `npm test`, lint and build run in CI, not before the push.
  - DB tests only when the schema or a repository changes; the phone check
    only for new or changed UI.
  - Push when a slice of the change is complete (each push re-runs CI).
  - Vercel: 100 deploys a day, both projects. The ignore scripts
    (`scripts/vercel-ignore.sh`, `apps/v2/scripts/vercel-ignore.sh`) build
    production only when that app changed, previews only for a migration
    or a `*-preview` branch.
