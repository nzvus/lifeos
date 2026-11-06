# Tasks — 2026-11-06-retire-v1 (PR #330)

0. [x] #329 merged: v2 is backed up daily (it never was before 6 Nov).
1. [x] He deleted the Vercel project `lifeos` (v1), 6 Nov («eliminato»).
2. [x] v1 out: `src/`, `drizzle/`, v1 configs/tests/scripts, `migrate.yml`, root ignore script,
       v1's CI build, backup `dump` and `purge-trash` jobs; the one `dump` (branch `v2`) pings
       the heartbeat; `check.py` and hooks look at the root app (DT-42, DT-34).
3. [x] `apps/v2` → root (git mv); workspaces, CI (migration gate by file name, via
       `migrate-v2.yml`, which re-runs waiting gates), backup, hooks, `cpd.mjs`, Playwright,
       `.gitignore`, `vercel.json`; `/api/health` ported to v2 (DT-34); tests, typecheck,
       lint, build with no secret, kit photos green; `guards.test.mjs` cites DT-42.
4. [x] Docs: spec paths and DT-42/DT-34, CLAUDE.md, ARCHITECTURE.md, README.md, setup.md,
       ui-audit.md, restore drill (+ script) on v2's tables, `docs/runbooks/retire-v1.sql`;
       v1 runbooks to `docs/archive/runbooks-v1/`.
5. [ ] His, at merge: `lifeos-v2` Root Directory → empty, then merge; production checked.
6. [ ] His, after: `retire-v1.sql` on branch `production`; v1's repository secret
       `DATABASE_URL_DIRECT` deleted; the agent sets `APP_URL` (setup.md §11).
