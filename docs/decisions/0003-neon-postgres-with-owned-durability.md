# ADR-0003: Data lives in managed Postgres on Neon, reached only through Drizzle repositories in `core/`, and durability is owned by this repo rather than by the provider

**Status:** accepted
**Date:** 2026-07-30

## Context

ADR-0001 fixed the framework and ADR-0002 the layering; both explicitly deferred
persistence to here. No entity can be persisted — and therefore S01's walking
skeleton cannot exist — until this is decided.

The binding force is PROJECT.md's **primary** invariant: logged data is never
lost or silently corrupted. The previous attempt died of exactly this, so the
decision has to produce a mechanism, not an intention. Around it: €0 budget, a
bursty schedule where multi-week gaps between sessions are normal, single user
at low hundreds of rows, and two learning objectives that bear directly on the
choice — data modeling and migrations (#2), and per-user isolation (#3).

Checking the current free tiers changed the shape of the decision (all verified
2026-07-30):

| | Supabase Free | Neon Free | Turso Free |
| --- | --- | --- | --- |
| Automatic backups / PITR | both "Not included" | 6-hour restore window | 24-hour PITR |
| Inactivity behaviour | project paused after 1 week | compute sleeps after 5 min and wakes on demand; project deletable after 90 days idle | not applicable |
| Size ceiling | 500 MB | 0.5 GB (writes suspend when exceeded) | 5 GB |

Every retention window on offer is shorter than the normal gap between work
sessions, and the longest is 24 hours. **No provider's backup feature can
satisfy the primary invariant at €0.** That demotes "which database" and
promotes "who owns the backup, and has the restore ever been run" — so this ADR
decides both, and treats the second as the load-bearing half.

Scope: engine, access and migration layer, durability mechanism, and the point
at which per-user isolation is enforced. The login and session mechanism is a
separate expensive decision whose options are determined by this one; it was
split out during this session as **ADR-0006** and added to S00.

## Options considered

### A. Managed Postgres on Supabase — repeat the previous stack, done properly
- Pros: already familiar, so the lowest re-entry cost. Real Postgres, so real
  SQL and real migrations (objective #2). Row Level Security enforces isolation
  **inside the database**, so even a bug in `core/` cannot leak one user's rows
  to another — the strongest available form of that invariant, and objective #3
  by name. Auth and file storage come bundled, which would collapse ADR-0006.
- Cons: the free tier has no backups of any kind *and* pauses the project after
  one week of inactivity — the tier is actively hostile to a schedule made of
  multi-week gaps, and "come back after a break to find things not as you left
  them" is the previous project's death mechanised. RLS also means data access
  rules live in two places (SQL policies and `core/`), which cuts against
  ADR-0001's one-place-per-thing principle.

### B. Managed Postgres on Neon
- Pros: identical Postgres learning value to A. No inactivity pause — the
  compute scales to zero and wakes transparently, which is the right behaviour
  for this schedule. **Database branching turns "test the migration first" into
  a command**: branch production data, apply the migration, inspect it, discard
  the branch. That is the single strongest affordance in this list for objective
  #2, and it is what makes a migration policy enforceable rather than
  aspirational. Consumed as a plain Postgres connection string, so ADR-0004's
  hosting decision stays genuinely open and the exit cost is a dump and a
  restore.
- Cons: no bundled auth, so ADR-0006 has real work to do. RLS is available but
  is not the paved road it is on Supabase, so isolation will start out enforced
  in application code — a weaker guarantee that must be covered by a test.
  0.5 GB ceiling with writes suspended past it, and projects idle for 90 days
  are subject to deletion.

### C. SQLite — Turso/libSQL, or a plain SQLite file on a host with a disk
- Pros: the simplest mental model of the three, and the one where "own your
  data" is most concrete: the database is a file, so a backup is a copy. 5 GB
  and a 24-hour restore window. Local development needs no service at all,
  which is the best raw resumability on offer.
- Cons: no RLS anywhere, so isolation is entirely application-level with no
  fallback. Weak typing and a thin `ALTER TABLE` are a poor fit for an app whose
  substance is numeric precision over macros and money. Less transferable than
  Postgres, which matters on a learning project. The plain-file variant also
  *constrains* ADR-0004 to hosts with a persistent disk, i.e. it spends a
  decision this ADR is supposed to leave open.

### D. Self-hosted Postgres on an always-free VPS
- Pros: no free-tier pause, quota or deletion rules to design around, full
  control, and it teaches operations honestly (`pg_dump`, cron, restore, TLS).
- Cons: it converts a durability problem into an ops problem, and the ops cost
  is paid at every resumption. An unpatched, disk-full server tended by a solo
  developer working in bursts is a *threat* to the primary invariant, not a
  defence of it. Rejected on the same grounds ADR-0001 rejected option B:
  overhead charged against the scarcest resource.

PlanetScale was not considered — its free tier no longer exists. A dedicated
document database was not considered: the domain is relational (ingredients →
meals → log entries) and the totals-equal-parts invariant is easiest to keep
where aggregation happens in one query engine.

## Decision

**Option B: managed Postgres on Neon, with Drizzle as the access and migration
layer.** Three parts of this are the decision itself, not implementation detail.

**1. All database access goes through repository modules in `core/`.** This
restates ADR-0002's rule 1 concretely: no route handler, server action or
component holds a connection or a query. Drizzle schema and queries live in
`core/` only, which is legal because Drizzle has no framework dependency —
ADR-0001's purity rule survives.

Drizzle over Prisma because it generates **SQL migration files that are read and
committed**. The SQL being applied to the data is the artifact the durability
invariant depends on and the thing objective #2 is about; Prisma's schema DSL
and shadow-database mechanics are smoother precisely because they hide it. This
is a secondary decision but not a cheap one — it touches every query in `core/`
— which is why it is recorded here rather than as a one-line note.

**2. The durability protocol**, in full, because a mechanism that is not written
down is not a mechanism:

- Migrations are numbered SQL files generated by `drizzle-kit generate`,
  reviewed, committed, and applied by an explicit command. `drizzle-kit push` is
  for throwaway local databases only and never runs against a shared database.
- Every migration is rehearsed on a Neon branch of production data before it
  touches production.
- A **scheduled `pg_dump` to storage the database provider does not control**
  (GitHub Actions cron into an encrypted artifact), several generations
  retained. The invariant must not rest on a free tier's promises, and `pg_dump`
  output is a portable format that outlives the vendor.
- **The restore is drilled at least once, and the procedure written down.** An
  untested backup is only a promise — the same standard ADR-0001 and ADR-0002
  applied to lint rules, applied here to data.
- The user-facing export (PROJECT.md §3.5) ships **inside** nutrition v1, not in
  a later sprint. It is the human-readable half of durability and the only part
  that works when the account itself is gone.

**3. Isolation starts application-level, and that is an accepted trade.**
Choosing B over A gives up database-enforced isolation. In compensation: every
user-owned table carries an owner column; the only path to those rows is a
repository function in `core/` that cannot be called without a caller identity;
and a test asserting that a cross-user read returns nothing is part of the first
persisted entity, not a follow-up. Postgres RLS remains available on Neon with
an external token issuer and is revisited in ADR-0006.

Decisive reasons:

1. No option supplied durability, so the tiebreaker became *which engine makes
   the repo-owned backup and the migration rehearsal cheapest to actually do*.
   Neon branching plus `pg_dump` answers both with provider-independent tools.
2. Fit to the real working rhythm. A one-week pause versus a 90-day idle limit
   is not a detail when multi-week gaps are the norm; A punishes the exact
   pattern this project is built around.
3. It keeps the exits open, consistently with ADR-0001 and ADR-0002: a plain
   connection string leaves ADR-0004 free, and a dump restores onto any Postgres
   anywhere.

**Tripwires — revisit this ADR if:** (i) storage approaches 0.5 GB or writes are
ever suspended for quota — move host or tier, which the dump makes cheap;
(ii) the app becomes genuinely multi-user, at which point application-level
isolation is no longer sufficient and RLS becomes mandatory; (iii) a migration
reaches production without a branch rehearsal — that is evidence the pipeline is
too heavy, so fix the pipeline rather than drop the rule; (iv) the backup job
fails without anyone noticing, which makes backup monitoring part of ADR-0004's
health check rather than optional.

## Consequences

Now easier: real SQL is visible and reviewable, so schema evolution is a skill
being built rather than a thing being survived. Migration mistakes are cheap
because they are found on a branch. Moving off Neon, or off any host, is a dump
and a restore.

Now harder, and requiring active discipline:

- Two new steps exist between "changed the schema" and "done": generate and read
  the migration, then rehearse it on a branch. Skipping either is a defect, and
  reviewed as one.
- Isolation is now a property of code rather than of the database, so the
  cross-user test is mandatory for every user-owned entity. The test is the
  invariant; without it the rule is a comment.
- Secrets enter the project for the first time (a database URL, dump storage
  credentials). Local and deployed configuration must be separate and never
  committed — the config story ARCHITECTURE.md defers to ADR-0004 now has a
  concrete first case.

Follow-up work this creates:

- **ADR-0006 (authentication and session model)** is added to S00, and inherits
  from here: no bundled provider, and it decides whether isolation is hardened
  to RLS.
- ADR-0004 inherits three requirements: a Node-compatible runtime reachable from
  a Postgres connection, a scheduled job for the dump, and monitoring that
  notices a failed dump.
- S01's first slice grows two non-negotiables beyond the ADR-0002 scaffold: the
  first migration applied through the committed pipeline, and one successful
  restore drill written up.

Cheap-to-reverse choices made here without their own ADRs, noted for the record:
**totals are computed on read** in a single `core/` function with no stored
aggregates — at hundreds of rows denormalisation buys nothing and is the obvious
way to break the totals-equal-parts invariant; **money is stored as integer
minor units and macros as `numeric`, never floating point**, because silent
rounding is precisely the "silently corrupted" half of the primary invariant;
primary keys are database-generated UUIDs so exported rows can be re-imported
without collisions; timestamps are stored as UTC with time zone.

## What I learned

Drafted by the agent from this session, pending the developer's edit.

I came in expecting to choose a database and instead found that the choice
barely mattered for the thing I said mattered most. Every free tier's backup
window — zero hours, six hours, twenty-four hours — is shorter than the gap
between my own working sessions, so "the provider handles backups" was never
true and I had been assuming it was. That is probably the real story of the last
project: not one bad decision, but a durability guarantee I believed I had
without ever having checked or tested it. So the useful output of this decision
is not "Neon" — it is that the backup lives somewhere the database vendor cannot
reach, and that a restore I have never performed does not count as a backup.
