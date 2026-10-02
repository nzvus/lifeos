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
| `docs/decisions/` | ADRs: why each expensive choice was made |
| `docs/runbooks/` | Setup, restore drill, lint-rule proof |

## Quick start

```bash
npm ci
npm test              # no database needed (PGlite)
cp .env.example .env  # then fill it in: docs/runbooks/setup.md
npm run db:migrate
npm run dev           # http://localhost:3000
```

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm test` | All tests, including cross-user isolation and snapshot tests |
| `npm run lint` | ESLint, including the architecture boundary rules |
| `npm run typecheck` | TypeScript, no output files |
| `npm run build` | Production build |
| `npm run db:generate` | Schema change -> new SQL migration file in `drizzle/` (read it!) |
| `npm run db:migrate` | Apply migrations to the `DATABASE_URL` database |
| `npm run import:fitforge -- FILE --email EMAIL [--apply]` | Import FitForge ingredients + meals (dry run without `--apply`) |
| `npm run import:lifeos -- FILE --email EMAIL [--apply --replace]` | Replace an account's data with a lifeos export (runbook: `docs/runbooks/replace-data.md`) |
| `npm run upsert:ingredients -- FILE --email EMAIL [--apply]` | Create/update ingredients by name (label values, receipt prices); dry run shows every changed field |
| `npm run import:training -- --email EMAIL --logs DIR --fitforge FILE [--apply]` | Import training history (PUSH/PULL text logs, FitForge); dry run without `--apply` |
| `npm run classify:exercises -- --email EMAIL [--apply]` | Suggest movement pattern and muscle groups for exercises |
| `npm run tidy:training -- --email EMAIL [--apply]` | Rename hand-numbered sessions to their routine, link them |
| `npm run audit:ui` | Every page at 360 px, text 120 %: sideways scroll and overlaps (docs/runbooks/ui-audit.md) |
| `python3 scripts/check.py` | Docs/ADR health check (`--strict` makes warnings fail) |

Production is migrated only by the `migrate` GitHub workflow, by hand, after
an automatic backup (ADR-0004).

## Health check (the deterministic guardrail)

`python3 scripts/check.py` (or `./check.sh`) audits the docs in under a second
with zero dependencies: file-length budgets, merge-conflict markers, leftover
placeholders, ADR format and numbering, broken links, malformed skills. CI runs
it on every push.
