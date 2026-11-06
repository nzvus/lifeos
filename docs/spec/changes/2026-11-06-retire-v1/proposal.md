# Change 2026-11-06-retire-v1 — v1 retired, v2 at the root (DT-42)

**Why.** DT-42 (phase 2 spec, approved 6 Nov «Approvo, procedi», PROD-44/45): v1 retires at the
start of phase 4, after a verified export. His pick of 25 Oct for the stages: «ok come consigli
tu» (setup.md §11, plan A). The cleanup plan: «migrate v2, no v3».

**The export is verified (6 Nov).** `LIFEOS/exports/v1/lifeos-export-2026-11-06.json` against
`v2/lifeos-2026-11-06.json` (both made by him, 6 Nov): no v1 row new or changed since 25 Oct; the
rows missing since 25 Oct were all in v1's trash (deleted 1–6 Oct, purged after 30 days with their
children); every live v1 session, entry, exercise, routine, measurement, day record is in v2 by id;
meals and ingredients by name (13 renamed by the 16 Oct refinement). Note in `exports/README.md`.

**What.**
1. **He** deletes the Vercel project `lifeos` (v1): Settings → Advanced → Delete Project. No custom
   domain is attached (checked 6 Nov); v2 stays at `lifeos-8ezd.vercel.app`.
2. **The agent's PR** (one, this change): v1's code out (`src/`, `drizzle/`, v1 configs, tests and
   scripts, `migrate.yml`, the root `vercel-ignore.sh`, v1's CI build, the backup's v1 `dump` job);
   `apps/v2` moved to the root (git mv, history kept) with `packages/kit` still a workspace; CI,
   `migrate-v2.yml`, `backup.yml`, the hooks, lint baselines, the spec's paths, CLAUDE.md,
   ARCHITECTURE.md and the runbooks follow. v2 keeps reading v1 export files (DT-40, `core/convert`).
3. **He, when merging:** Vercel `lifeos-v2` → Settings → Build → Root Directory from `apps/v2` to
   empty, then the merge (a failed production build leaves the last good deploy live).
4. **He, after the merge:** v1's tables dropped on Neon branch `production` with the SQL the PR
   ships (`docs/runbooks/retire-v1.sql`, read-only check first); v2's branch `v2` is untouched
   (copy-on-write). The Neon project is never deleted (DT-34). healthchecks.io «app» → v2's
   `/api/health`. Repo secrets of v1 (`DATABASE_URL_DIRECT` and the like) removed.

**Not in this change.** Renaming the Vercel project or the package `@lifeos/v2`; the per-type
rebuild of phase 4 (next changes).

**Stop.** (a) Now, for his OK to this proposal. (b) Before step 1 (irreversible, his hand).
(c) The PR waits for him to switch the Root Directory and merge. (d) The drop SQL is his to run.
