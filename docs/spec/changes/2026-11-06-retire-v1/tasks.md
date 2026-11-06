# Tasks — 2026-11-06-retire-v1

0. [ ] #329 merged: v2 is backed up daily (it never was before 6 Nov).

1. [ ] He deletes the Vercel project `lifeos` (v1).
2. [ ] v1 out: `src/`, `drizzle/`, v1 configs/tests/scripts, `migrate.yml`, root ignore script,
       v1's CI build, backup `dump` and v1 `purge-trash` jobs; `dump-v2` pings the backup
       heartbeat (after #329); `check.py` and hooks no longer look for v1.
3. [ ] `apps/v2` → root (git mv); workspaces, CI, `migrate-v2.yml`, `backup.yml`, hooks, lint
       baselines, `cpd.mjs`, Playwright, `.gitignore` follow; tests, typecheck, lint, build,
       kit photos green (DT-42).
4. [ ] Docs: spec paths (delta), CLAUDE.md, ARCHITECTURE.md, setup.md §10–11, ui-audit.md,
       `docs/runbooks/retire-v1.sql` (count check, then DROP), memories.
5. [ ] He switches Root Directory and merges; production deploy checked on the phone.
6. [ ] He runs the SQL; healthchecks; v1 secrets removed. Delta merged, change archived.
