# ADR-0004: The app deploys to Vercel Hobby from a protected `main`, migrations are applied only by a human-triggered CI job, and a dead-man's switch watches the backup

**Status:** accepted
**Date:** 2026-07-30

## Context

ADR-0003 closed with three inherited requirements: a Node-compatible runtime
that can reach Neon, a scheduled job for the `pg_dump`, and something that
notices a dump which failed silently. This ADR discharges all three, plus the
question S00 always had in scope — how code gets from a commit to production
without a bad deploy taking data with it.

Looking for a home for the dump job produced the decisive finding. `pg_dump` is
a binary, and no free serverless runtime ships it, so GitHub Actions is the only
€0 place the real dump can run. But **GitHub disables scheduled workflows after
60 days without a commit to the default branch** — only commits reset the timer,
and the notice is one email to whoever last enabled the workflow, with no error
in the Actions tab and no banner. Combined with ADR-0003's finding that **Neon
deletes free projects idle for 90 days**, the default outcome of a three-month
break is: the backup stopped at day 60, the database became deletable at day 90,
and nothing said a word. That is the previous project's death reassembled out of
two vendors' fine print.

The consequence is a principle this ADR is built around: **there is no error to
catch here, so the thing to instrument is absence, not failure.** A monitor that
watches for a job reporting a problem will never fire; a monitor that watches for
a job failing to report at all will.

Verified 2026-07-30: Vercel Hobby is non-commercial use only, with once-daily
minimum cron cadence; Cloudflare Workers free allows 10 ms CPU per request and a
roughly 1–3 MB compressed bundle; GitHub Free includes 2,000 Linux Actions
minutes and 500 MB of artifact storage on private repositories; healthchecks.io
free covers 20 checks.

## Options considered

### A. Vercel Hobby, deployed from git
- Pros: the paved road for Next.js, so there is no build adapter to maintain or
  re-learn after a gap — the same resumability argument that decided ADR-0001.
  Neon's Vercel integration creates **a database branch per preview deployment**,
  which converts ADR-0003's "rehearse the migration on a branch" from a
  discipline into the default path — the strongest available alignment between
  this decision and the previous one. Comfortably free at one user.
- Cons: Hobby is restricted to non-commercial personal use, so the multi-user
  future PROJECT.md contemplates costs money the day it arrives. Vendor gravity
  is real, and this is half of the stack the previous attempt died on. Hobby cron
  is once-daily at best and cannot run `pg_dump` regardless, so the scheduler
  problem is not solved here.

### B. Cloudflare Workers with OpenNext (GA February 2026)
- Pros: a genuinely generous free tier, sub-millisecond-class cold starts, and
  cron triggers that do not disable themselves for inactivity — which would
  address the finding above directly rather than by monitoring.
- Cons: 10 ms CPU per request and a ~1–3 MB compressed bundle on the free plan
  are tight to hostile for React server rendering, and 50 subrequests per
  invocation constrains data access patterns. Known compatibility edges around
  `next/image`, middleware and some dynamic routes mean an adapter to own.
  Workers cannot run `pg_dump` either, so the scheduler advantage does not
  actually retire the problem. Cost paid at every resumption for capability not
  needed at this scale.

### C. Container host — Render, Fly, Railway
- Pros: a long-running Node process, honest logs, standard Docker skill, and no
  serverless mental model to hold. Could host both app and scheduled dump in one
  place, `pg_dump` included.
- Cons: free web services spin down with slow cold starts, Railway's free tier
  no longer exists, and Fly is pay-as-you-go. It fails either the €0 constraint
  or the usability one, and self-hosting was already rejected on ops grounds in
  ADR-0003 option D.

### D. Netlify
- Comparable to A with a thinner App Router story and no equivalent to the
  database-branch-per-preview integration. Dropped for having no upside over A;
  not researched in depth, which is recorded honestly rather than dressed up.

### Where migrations are applied — the sub-decision that touches the invariant
- **Automatic on build or on merge:** nothing to remember, and precisely how an
  unattended destructive migration removes data. Build steps also retry, which
  is the last property wanted here.
- **Human-triggered CI job:** one deliberate action, auditable, runs a dump
  first.
- **Manual from the developer's machine:** maximum control, but depends on local
  state and is the step most likely to be forgotten after a gap.

## Decision

**Option A** for hosting, with three mechanisms that are part of the decision.

**1. Delivery path.** Work happens on branches; `main` is protected and requires
green CI; Vercel builds previews from branches and production only from `main`.
CI runs on GitHub Actions: typecheck, ESLint including the ADR-0002 boundary
rules, and tests, on every push and pull request. A `/api/health` route returns
a trivial database query plus the deployed commit SHA, because "deployed" and
"working" are different claims and only the second one matters.

**2. Migrations are applied by a human-triggered `workflow_dispatch` job** that
takes a dump first, then applies the committed migration files, and logs both.
Never on build, never on merge.

The reasoning is a choice between forgettings rather than a claim that nothing
will be forgotten. After a three-week gap something will be missed, so the
failure mode is selected deliberately: forgetting to migrate yields an app
erroring on a missing column — loud, immediate, fixed in a minute. An automated
migration going wrong yields missing rows — silent, and possibly permanent. When
durability is the primary invariant, the loud failure is the correct one to
prefer, and convenience is the right thing to spend.

**3. A dead-man's switch watches the backup.** The scheduled dump workflow pings
healthchecks.io on success; the check's period and grace are configured so a
missed run alerts by email. This is the only mechanism in the options list that
detects the 60-day workflow disable, because that event produces no failure to
report — an absent ping is the signal. The same service watches `/api/health`,
so a dead deployment and a dead backup are noticed by the same channel.

Decisive reasons:

1. Everything else being equal on cost, A is the only option where ADR-0003's
   migration-rehearsal policy is the path of least resistance rather than an
   extra step. A policy that is also the default is a policy that survives gaps.
2. The scheduler cannot be made reliable by choosing a different vendor — B's
   cron is durable but cannot run the dump — so the honest fix is monitoring for
   absence. Once that exists, the host is free to be the boring convenient one.
3. Consistency with ADR-0001 and ADR-0002: overhead paid at every resumption is
   the thing this project cannot afford, and B and C both charge it.

**Tripwires — revisit this ADR if:** (i) the app becomes commercial or genuinely
multi-user, which breaches Hobby's terms and forces a paid plan or a move —
cheap, because the app is a plain Next.js build against a connection string;
(ii) Hobby's function or CPU allowances are approached; (iii) the dead-man's
switch fires repeatedly for the workflow-disable reason, at which point a
keepalive commit becomes justified as a supplement, never as a replacement for
the monitor; (iv) the 2,000 Actions minutes or 500 MB artifact storage bind.

## Consequences

Now easier: shipping is `git push` and opening a pull request. Every pull request
gets a preview URL with its own database branch, so a migration can be seen
working against real-shaped data before it is anywhere near production. A silent
stop in the backup pipeline now has a defined time-to-detection instead of being
discovered by needing it.

Now harder, and requiring active discipline:

- Production is no longer reachable by pushing to `main` directly; that is the
  point, and the protection must actually be configured rather than intended.
- Deploying and migrating are two separate acts, in that order or the reverse
  depending on whether the change is additive. Additive-first schema changes
  (add a column, backfill, then read it) are now the normal shape of a change,
  because they are the shape that survives the two acts happening apart.
- Two external accounts join the project as dependencies of the primary
  invariant: GitHub for the dump and healthchecks.io for the alert. Their
  credentials are secrets on the same footing as the database URL.
- An alert that is ignored is not monitoring. The first time the switch fires,
  the response is to fix the pipeline, not to widen the grace period.

Follow-up work this creates:

- **ADR-0006 (authentication)** remains the last blocker for S01, and inherits
  the deployment shape decided here — sessions must work across preview and
  production deployments with different URLs.
- S01's scaffold gains the CI workflow, branch protection, the `/api/health`
  route, the scheduled dump workflow and the healthchecks.io check. Consistent
  with ADR-0001 and ADR-0002: an unenforced rule is only a promise, and an
  unmonitored backup is only a hope.
- ADR-0003's restore drill is scheduled against the artifacts this ADR produces,
  so the drill and the pipeline arrive together.

Cheap-to-reverse choices made here without their own ADRs, noted for the record:
dumps are written to GitHub Actions artifacts with an explicit short retention to
start, with Cloudflare R2 as a later hardening step if the backup should also
leave GitHub; the health route lives at `/api/health` and is unauthenticated but
reveals nothing beyond commit and database reachability; Vercel's own git
integration is used rather than a hand-rolled deploy workflow, since it is the
part of A that is worth having.

## Update 2026-10-01 — previews only when needed

A day of small pull requests hit Vercel Hobby's 100 deployments per day
(previews count), and production stopped deploying for 24 hours ("Deployment
rate limited"). The developer chose both remedies: previews build only when
this ADR needs them — a change under `drizzle/` or `src/core/db/` (the
migration rehearsal on the PR's Neon branch), or a branch named `*-preview`
when a preview is wanted for review — via `vercel.json` `ignoreCommand`
(`scripts/vercel-ignore.sh`); production from `main` always builds. And small
slices are grouped into fewer pull requests. The delivery path above is
otherwise unchanged.

## What I learned

Drafted by the agent from this session, pending the developer's edit.

Two ADRs in a row have now been decided by fine print rather than by technology,
and both times the fine print described a *silence* rather than a failure. A
paused project, a deleted project, a disabled workflow — none of these produce an
error anywhere I would be looking, and all three are triggered by exactly the
thing I do most, which is not touching the project for weeks. So the useful
generalisation is not about vendors: any system whose correct behaviour is
"something happened on schedule" needs a watcher for the schedule, not for the
something. I had been imagining monitoring as catching things going wrong, and
the failure that actually threatens this project is nothing happening at all.
