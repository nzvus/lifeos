# ADR-0001: The app is built in TypeScript on Next.js (App Router), with all domain logic in a framework-agnostic `core/` layer

**Status:** accepted
**Date:** 2026-07-23

## Context

Nothing can be built until the language and application framework are fixed:
this choice determines every file in the repo, the auth model, and the shape of
the reusable "kit" this project is meant to produce. The binding constraints are
a €0 budget (free tiers only), responsive web as the only target, a bursty and
irregular time budget that makes *resumability after gaps* the scarcest
resource, and four learning objectives led by "fullstack architecture: the
front/back boundary". A previous attempt on a similar stack died of mess and
silent data loss, so repeating the stack is only acceptable if the failure is
attributed to practice rather than to the tools.

This ADR decides the language and framework only. The database is ADR-0003 and
the hosting/CI target is ADR-0004 — deliberately kept separate, because treating
"Next.js + Supabase + Vercel" as one atomic thought is how the previous attempt
became untangleable.

## Options considered

### A. TypeScript + Next.js (App Router) — one fullstack framework
- Pros: one repo, one language, one deploy, so a slice can be resumed after
  three weeks without re-learning a pipeline. Types shared between UI and data
  layer directly serve the kit goal. Server Components and route handlers cover
  auth, fetching and mutations with no separate API process to run locally.
  Largest ecosystem, most transferable skill, free-tier deploy is solved.
- Cons: the framework *hides* the front/back boundary, which is learning
  objective #1; Server Actions in particular blur "whose machine is this running
  on". Next.js has a history of churn across major versions (Pages to App
  Router). Strong vendor gravity toward one host.

### B. TypeScript, explicit split — React (Vite) SPA + separate API server (Hono/Fastify)
- Pros: the boundary is physical and cannot be blurred, so API design, cookies
  vs. tokens and CORS are learned by confronting them. Still one language, so
  shared types and the kit story survive. A Hono backend is portable across
  Workers, functions and a VPS, leaving ADR-0004 genuinely open.
- Cons: two dev servers and two deploy targets, with auth and CORS wiring owned
  by hand. That overhead is paid *at every resumption*, which is the worst
  possible fit for a bursty schedule. Slower to a first shipped slice, and the
  hand-rolled scaffolding consumes budget that belongs to nutrition v1.

### C. Polyglot — Python (FastAPI) backend + TypeScript React frontend
- Pros: strongest possible boundary; FastAPI teaches API contracts well; Python
  is the better long-term home for the roadmap's AI-review features.
- Cons: breaks the kit thesis outright — a "fullstack kit" spanning two
  languages means duplicated types, duplicated validation and two toolchains,
  for one developer. That is precisely the over-engineering that PROJECT.md
  names as the most likely cause of death. Weakest free-tier hosting story.

SvelteKit and Remix/React Router 7 were considered and dropped: technically
sound, but smaller ecosystems with no upside over A that would justify a thinner
support base on a learning project.

## Decision

**Option A**, with one structural condition that is part of the decision, not a
suggestion: **domain and data logic lives in `core/`, which may not import from
`next/*` or any framework module.** Route handlers and server actions call into
`core/`; they do not contain logic themselves.

Decisive reasons:

1. The condition converts A's main weakness into the actual lesson. Drawing the
   front/back boundary deliberately in code is a harder and more valuable skill
   than letting a network hop draw it. It is also *checkable* — an import of
   `next/headers` inside `core/` is a lint failure, not a matter of taste.
2. It fits the time budget. Resumability is the scarcest resource, and option B
   taxes exactly that, once per resumption.
3. It keeps the exit open. A clean `core/` is what would be lifted out to move
   to option B or off the chosen host — and is, not coincidentally, the first
   real piece of the kit.

The previous attempt's failure is attributed to practice (no tests, no
migrations, no written decisions), not to the stack; that failure mode is
addressed by ADR-0003 and ADR-0004, not by picking a different framework.

**Tripwires — revisit this ADR if:** (i) `core/` purity is repeatedly violated
because the framework fights it, which would be evidence the boundary wants to
be physical (go to option B); (ii) a Next.js major version demands another
App-Router-scale rewrite; (iii) the app becomes commercial or genuinely
multi-user, which forces a hosting decision under ADR-0004 and may change the
cost calculus here.

## Consequences

Now easier: one `npm run dev`, one deploy, end-to-end type safety, and auth and
data access available in one process.

Now harder, and requiring active discipline:

- Every feature must decide where its logic lives *before* it is written. Logic
  in a component or a route handler is a defect, reviewed as one.
- The `core/` purity rule needs a mechanical guard (an ESLint
  `no-restricted-imports` boundary rule) added when the skeleton is scaffolded
  in S01. Until that rule exists, the invariant is only a promise.
- Server Components vs. Client Components must be a conscious choice per
  component, documented in ARCHITECTURE.md once ADR-0002 fixes the layering.

Follow-up work this creates:

- ADR-0002 defines the layering inside and around `core/`, and the app-vs-kit
  split — it will fill in ARCHITECTURE.md's boundaries section.
- ADR-0003 (persistence) and ADR-0004 (delivery/CI) inherit "must be reachable
  from a Node/serverless runtime" from this decision, but remain open otherwise.
- S01's first slice includes the scaffold, the lint boundary rule, and one
  passing test — the skeleton is not "done" without all three.

Cheap-to-reverse choices made here without their own ADRs, noted for the record:
package manager **npm** (default, least friction); unit tests **Vitest**; lint
and format **ESLint + Prettier**; end-to-end testing deferred until a real
multi-step flow exists to justify it.

## What I learned

Drafted by the agent from the developer's own account, pending their edit.

What killed the previous project was not the stack: it was that every widget,
card and toast existed as a dozen near-identical copies, so changing one style,
one label or one dimension meant finding and changing it everywhere — and
missing some. That reframes this decision. The framework matters less than
whether there is exactly one place each thing lives, and Next.js only helps if
that placement is enforced deliberately — which is why the `core/` rule is part
of the decision rather than a good intention attached to it.

