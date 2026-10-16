# ADR-0056: v2 lives next to v1 in `apps/v2`; v1 stays at the root

**Status:** accepted (the developer chose B on 2026-10-16, with «target approvato»)
**Date:** 2026-10-16
**Amends:** ADR-0053 §4 (where v2 lives): v1 is not moved into `apps/v1`

## Context
The developer approved the v2 target (ADR-0053, `docs/spec/v2/`, the boards) on 2026-10-16, so code starts. ADR-0053 planned an npm workspace with v1 moved into `apps/v1`. But v1 is in daily use and receives only fixes until the switch. Moving it changes:
- the Vercel project's root directory;
- every CI path, and the migrate and backup jobs;
- the lint boundary rules.

That is a risk on production, for an app that will be retired. The agent's GitHub token also cannot push changes to `.github/workflows/`.

## Options considered
### A. As planned: v1 moved into `apps/v1`, then `apps/v2` and `packages/kit`
- **Pros:** a clean layout from day one; each app has its own scripts.
- **Cons:**
  - a mechanical but wide PR on the production app (Vercel root, CI, migrate.yml, backup.yml, lint paths);
  - the workflow changes need the developer to push them;
  - nothing in v1 gains from it.
### B. v1 stays at the root; `apps/v2` (and later `packages/*`) next to it
- **Pros:**
  - no change to v1's build, deploy, migrations or backups;
  - the root scripts call v2's, so CI covers v2 without touching the workflows;
  - work starts today.
- **Cons:**
  - an odd layout until the switch: the root is both v1 and the workspace;
  - v1's TypeScript, ESLint and Vitest must exclude `apps/` and `packages/`.
### C. A separate repository for v2
- **Pros:** full isolation.
- **Cons:**
  - the spec, the ADRs, CLAUDE.md and the boards' tooling live here;
  - two CIs;
  - the converter would need v1's export code from another repository.

## Decision
**B**, for two reasons:
- It is the only option that leaves the production app untouched.
- v1 is retired at the switch, so a cleaner layout for it is worth nothing.

**The layout:**
- The root `package.json` declares the workspace `apps/*` and `packages/*`.
- `apps/v2` has its own `package.json`, `tsconfig.json`, Vitest and ESLint configuration.
- The root's `typecheck`, `lint` and `test` scripts run v1's and then v2's. The CI calls the same scripts, so its workflow files are unchanged.
- v2's code follows ADR-0053: `src/core/engines/*` are pure functions, with no framework and no database.
- `packages/kit` is created with the first v2 slice that has UI (its second consumer, ADR-0002), not before.

**Tripwire.** At the switch, decide whether v2 moves to the root or v1 is deleted around it. Revisit sooner if keeping v1's tooling from seeing `apps/` costs more than a few excludes.

## Consequences
- **v1:**
  - its `tsconfig.json`, `eslint.config.mjs` and `vitest.config.ts` exclude `apps/**` and `packages/**`;
  - its Vercel build installs the workspace (npm ci at the root), harmless;
  - a merge that touches only `apps/v2` still deploys v1's production once (the deploy budget allows it).
- **v2:**
  - it gets a Vercel project and a Neon branch `v2` only with its first slice that serves pages (ADR-0053 §4), created by the developer;
  - until then it is engines and tests only.
- **ARCHITECTURE.md** says the repository holds two apps.

## What I learned
<to be written by the developer>
