# Lifeos

A personal nutrition and training tracker — food against targets with exact
totals and costs, training with programs and a gym mode, weight, sleep and
the day's energy as honest ranges — built to own its data and never lose it. It is also the pilot app for a reusable fullstack kit, and the
first module of a larger personal app (see the backlog in `ROADMAP.md`).

Started from the `ai-native-starter` template; the template itself lives in
its own repository.

## Read in this order

| File | What it tells you |
|---|---|
| `CLAUDE.md` | Rules and conventions for anyone (human or agent) working here |
| `PROJECT.md` | What is being built and why; invariants; non-goals |
| `ARCHITECTURE.md` | How the code is shaped right now (2-minute read) |
| `ROADMAP.md` | Backlog, current sprint, what's done |
| `docs/spec/` | The specification: every feature, datum, formula and source; issues and proposals per area |
| `docs/decisions/` | ADRs: why each expensive choice was made |
| `docs/runbooks/` | Setup, restore drill, lint-rule proof |

## Quick start

```bash
npm ci
npm test                    # no database needed (PGlite)
cp .env.example .env.local  # then fill it in: docs/runbooks/setup.md §3
npm run dev                 # http://localhost:3200 (local PGlite, migrated on start)
```

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Development server on :3200 |
| `npm test` | All tests (app, kit, guards) |
| `npm run lint` | ESLint (boundaries, fitness rules with `lint-baseline.json`), the kit's, jscpd |
| `npm run typecheck` | TypeScript, app and kit |
| `npm run build` | Production build (needs no secret) |
| `npm run shots` | The kit gallery photographed against the committed images (PAT-94) |
| `npm run db:generate` | Schema change -> new SQL migration file in `drizzle/` (read it!) |
| `npm run load:export -- FILE --email EMAIL [--replace]` | Load an export into an account (`docs/runbooks/setup.md` §10) |
| `npm run import:sessions -- FILE --email EMAIL --since DAY [--write]` | v1 gym sessions only (dry run without `--write`) |
| `python3 scripts/check.py` | Spec/docs/ADR health check (`--strict` makes warnings fail) |

Production is migrated only by the `migrate-v2` GitHub workflow, by hand, after
an automatic backup (ADR-0004).

## Health check (the deterministic guardrail)

`python3 scripts/check.py` (or `./check.sh`) audits the docs in under a second
with zero dependencies: file-length budgets, merge-conflict markers, leftover
placeholders, ADR format and numbering, broken links, malformed skills. CI runs
it on every push.
