# Tasks — 2026-11-06-guards (one PR, slices in this order; each slice: tests citing IDs, docs touched)

1. [x] Claude Code guards (PAT-91): hooks in `.claude/settings.json` + scripts in `scripts/hooks/`;
       `.claude/rules/{features,kit,spec}.md`; skills `change`, `verify`, `audit` (PAT-92);
       retire `dossier`, `compress`.
2. [x] Fitness checks: ESLint rules + `lint-baseline.json` (PAT-90); jscpd + baseline (PRD-53);
       `check.py` built-needs-a-test + `docs/spec/untested.txt` (PRD-42). CI runs all three.
3. [x] `i18n/` catalogue scaffold + glossary test (PAT-93).
4. [x] Registry for catalog types (MOD-01/02) + `core/verbs` (PAT-24) with DB tests on PGlite.
5. [x] Kit pieces (list in delta.md), each in the `/kit` gallery with its test.
6. [ ] `(app)/layout.tsx` with NavBar and ⊕; pages stop mounting them (the one mechanical
       move allowed here, since it touches no type) (PAT-01).
7. [ ] Playwright screenshots of `/kit` in CI (PAT-94).
8. [ ] patterns.md ✗ → ✓ for what was built; delta merged into the spec; this folder → `archive/`;
       photos; STOP for his review.
