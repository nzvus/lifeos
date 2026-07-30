# ADR-0006: Identity lives in our own Postgres via Better Auth with email-and-password sessions, and isolation is enforced at the `core/` data boundary, with RLS deferred behind a single hook

**Status:** accepted
**Date:** 2026-07-30

## Context

This is the last foundational decision and the last blocker for S01: nothing
user-owned can be persisted before it is known who a user is and where that fact
lives. It was split out of ADR-0003 because its option set is determined by the
database choice, not because it is small.

Three findings shaped it, all verified 2026-07-30.

**Auth.js is no longer a live option.** It merged into Better Auth in late 2025,
v5 is in maintenance mode receiving security patches only, and its own
maintainers direct new projects to Better Auth. The apparent three-way choice is
really: a library that owns users inside our database, a managed identity vendor,
or hand-rolled.

**The primary invariant reaches accounts, not just rows.** ADR-0003 committed to
a `pg_dump` that is provider-independent and to a restore that has actually been
drilled. If identity lives at a vendor, that dump contains meals and log entries
owned by user identifiers that exist only inside someone else's system, so
restoring it produces orphaned data. "Own your data" and "own your users" are the
same requirement, and this ADR inherits it rather than choosing it.

**CVE-2025-29927** (March 2025) showed that Next.js middleware-only session
protection was bypassable by spoofing the `x-middleware-subrequest` header. The
durable lesson is about placement rather than about one patched bug: middleware
is a redirect and user-experience mechanism, never a security boundary. Authority
has to be checked where the data is reached — which is precisely the `core/`
repository that ADR-0003 already requires to be given a caller identity. That
rule now rests on evidence rather than on preference.

Also relevant: the app is single-user for the foreseeable future but designed for
multi-user later (PROJECT.md §1, §3); learning objective #3 names login, sessions,
per-user isolation and secrets explicitly; ADR-0004 generates a fresh preview URL
per branch, which constrains anything requiring registered redirect domains.

## Options considered

### A. Better Auth — a library owning users in our own Postgres
- Pros: users, accounts and sessions are ordinary tables in Neon reached through
  Drizzle, so they are inside every dump and every restore — the only option that
  satisfies the inherited invariant without further work. Session rows mean
  sessions are revocable per device, unlike a stateless token. HTTP-only cookies
  by default. No per-user pricing at any scale, ever. Passkeys, 2FA and
  organisations exist as plugins for later, so today's minimum does not foreclose
  tomorrow. v1.6 as of May 2026, and it absorbed Auth.js, so it is where the
  ecosystem's attention now is.
- Cons: the security surface is ours to hold — cookie flags, session lifetime,
  login rate limiting are our configuration, not someone's SLA. Enterprise SSO
  (SAML/SCIM) is immature, which is irrelevant to this project and would not be
  for a different one.

### B. Clerk — managed identity
- Pros: free to 50,000 monthly retained users after the February 2026 change,
  prebuilt UI, and email verification, password reset and social login solved on
  arrival. Fastest possible route to a working login. Pairs naturally with
  Postgres RLS through a JWT issuer.
- Cons: the invariant collision above, which is disqualifying here rather than
  merely awkward. It also puts a vendor on S01's critical path and prices a
  future that has already been repriced twice. This is the right answer for a
  commercial product with a deadline; this project is neither.

### C. Hand-rolled sessions and password hashing
- Pros: the deepest learning of the primitives, and no dependency to track.
- Cons: the one option where a single wrong detail — a missing `HttpOnly`, a
  non-constant-time comparison, a session token from a weak random source —
  quietly breaks a hard invariant. Option A still leaves the session boundary,
  the cookie policy and the isolation rule to be wired by hand, which is where
  the transferable understanding actually is.

### D. Auth.js / NextAuth v5
- Recorded for completeness: see the first finding. Adopting it would mean
  starting on a maintenance-mode path whose maintainers recommend against it for
  new projects.

### Credential for v1
- **Email and password:** no additional vendor, and it works on every generated
  preview URL with nothing to register.
- **GitHub OAuth:** no password stored at all, but it needs a registered redirect
  per domain, which fights ADR-0004's per-branch preview URLs, and it would make
  GitHub the login, the code host and the backup store simultaneously.
- **Magic link:** no password, but an email vendor joins S01's critical path and
  every login depends on inbox delivery.
- **Passkeys:** strongest, and supported, but cross-device recovery for a single
  developer is fiddly enough to belong to a later slice.

## Decision

**Option A, with email-and-password credentials, isolation enforced at the
`core/` data boundary, and RLS deferred behind a single hook.** Four parts.

**1. Placement.** The Better Auth instance and its tables live in `core/`,
configured against the Drizzle adapter; it is framework-free, operating on
standard Request and Response objects, so ADR-0001's purity rule holds and the
boundary lint proves it. `app/api/auth/...` mounts the Next.js handler. Reading
cookies happens only in `app/`. A route or server action resolves the session,
obtains a user id, and passes it into `core/`; `core/` never reaches for ambient
request state.

**2. Enforcement is at the data boundary, not in middleware.** Middleware may
redirect an anonymous visitor to a login page, because that is a user-experience
concern. It is never the thing that keeps one user's rows from another, per
CVE-2025-29927. The repository helper that requires an identity is the boundary,
and the cross-user read test from ADR-0003 is what makes that a fact rather than
a claim.

**3. Email and password for v1, with the consequence stated plainly.** With one
account and no email sender there is no verification and no password reset: a
forgotten password is repaired by editing the database. That is acceptable for a
single user and is a tripwire, not an oversight. Better Auth owns the hashing and
the login rate limiting; we own the cookie policy and the session lifetime.

**4. RLS is deferred, and the deferral is made cheap rather than promised.**
Every user-owned table carries `user_id` from its first migration; every read and
write goes through the one repository helper that cannot be called without an
identity. With a single account there is no second user's data to leak, so RLS
today would reduce no risk while adding a transaction-scoped session variable to
every query — the speculative abstraction ADR-0002 exists to prevent. Because all
access already funnels through one place, adopting Neon's `pg_session_jwt`, or a
transaction-scoped setting, is a change in that one place.

Decisive reasons:

1. The invariant decided it. Once ADR-0003 committed to a dump that can actually
   be restored, identity had to be inside the database, and only option A puts it
   there. This is the third consecutive ADR settled by a consequence of an
   earlier one rather than by comparing features — which is the point of writing
   them down.
2. Enforcing at the data boundary is both the secure placement and the placement
   the architecture already had. ADR-0002 said slices meet in `core/`; ADR-0003
   said repositories require an identity; a published CVE says middleware cannot
   be trusted with this. All three agree.
3. Email and password is the shortest critical path to a logged-in user with no
   vendor added and no friction against ADR-0004's preview URLs — and the
   alternatives are additions later, not rewrites.

**Tripwires — revisit this ADR if:** (i) **a second account exists**, which makes
RLS mandatory and simultaneously requires an email sender for verification and
reset; (ii) the app becomes commercial, which also breaches Vercel Hobby's terms
under ADR-0004 and should be reconsidered as one decision, not two; (iii) session
handling needs anything Better Auth cannot express, which would be evidence for a
managed provider; (iv) a credential type beyond password is wanted, which is a
plugin rather than a revisit unless it changes where identity lives.

## Consequences

Now easier: a restore is complete — accounts and their data come back together.
Sessions are rows, so revoking one is a delete and debugging one is a query.
There is no identity vendor to configure, pay, or be repriced by, and login works
on preview deployments with nothing registered.

Now harder, and requiring active discipline:

- Cookie policy, session lifetime and rate limiting are our settings and must be
  reviewed rather than defaulted through. They are security configuration, and
  they belong in the review of the slice that introduces them.
- Every user-owned entity from now on owes three things, not one: the `user_id`
  column, access only via the identity-taking repository helper, and a test
  proving a cross-user read returns nothing. The first entity establishes the
  pattern the rest copy.
- Authorization checks live in each route or server action *and* at the data
  boundary. Duplication here is deliberate defence in depth, not a violation of
  one-place-per-thing — the middleware CVE is the reason.
- Account recovery does not exist yet. Written down so it is a known gap rather
  than a surprise.

Follow-up work this creates:

- **S00 is complete.** ADR-0001, 0002, 0003, 0004 and 0006 are accepted; ADR-0005
  (heterogeneous exercise data model) remains deferred to the training sprints as
  planned, and is not a blocker for nutrition v1.
- S01's first slice is now fully specified: the ADR-0002 scaffold, the ADR-0004
  pipeline, and one authenticated nutrition entity carrying the ADR-0003
  migration path plus the cross-user test.
- Secrets grow by the Better Auth signing secret, joining the Neon connection
  string and the healthchecks.io ping URL under ADR-0004's config rules.

Cheap-to-reverse choices made here without their own ADRs, noted for the record:
database-backed sessions rather than stateless tokens, because revocability is
worth a query at this scale; Better Auth's default hashing rather than a
hand-picked algorithm; session lifetime and cookie flags left at the library's
secure defaults until there is a reason to move them, reviewed in the slice that
introduces login; sign-up left open in v1 and closed later if a second user
should not be able to self-register.

## What I learned

Drafted by the agent from this session, pending the developer's edit.

I expected to choose an auth provider by comparing features, and instead the
choice was already made three ADRs ago. Once "the backup must be restorable" was
a real commitment, keeping users at a vendor became incoherent — the dump would
have restored data belonging to nobody. That is the first time I have seen a
written decision *decide* a later one rather than merely inform it, which is
apparently what ADRs are actually for. The second thing: I would have put the
login check in middleware, because that is where every tutorial puts it, and a
CVE says that is a redirect mechanism rather than a boundary. The safe place to
enforce who may read a row turned out to be the same place the architecture
already made all data pass through, which suggests the architecture was doing
security work before I thought of it as security.
