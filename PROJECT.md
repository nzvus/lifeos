# PROJECT.md — Kickoff Brief

> Filled during kickoff. Keep answers short; link to ADRs for anything contested.

## 1. What & why
- **One-sentence pitch:** A personal nutrition + training tracker, built as the
  pilot app that drives out a reusable fullstack webapp "kit" (auth, theming,
  widgets, i18n, scaffolding) extracted only as the app actually needs it.
- **Primary user / audience:** Me first (personal use); designed so it could
  later become a real multi-user online site.
- **Problem it solves:** Track meals (macros incl. fiber/salt + cost) and
  workouts against personal objectives, own the data, and never lose it — a
  previous Vercel+Supabase attempt became messy and died.
- **Explicit NON-goals:**
  - No native mobile app — responsive web only.
  - No scientifically "precise" exercise-calorie numbers — training burn is an
    explicit estimate, never presented as truth.
  - No social/sharing features early; single-user first, multi-user isolation
    designed for but built later.
  - No AI features in early sprints (roadmap, not v1).
  - No speculative "kit" abstractions — the kit is EXTRACTED from the pilot app
    once a need appears, never built ahead of a real consumer (parallel track).

## 2. Learning objectives (learning project — be explicit)
- **Top skills to come out understanding:** (all prioritized)
  1. Fullstack architecture (front/back boundary, API design, kit-vs-app split).
  2. Data modeling (heterogeneous exercises, meal/session aggregations,
     migrations, keeping totals consistent).
  3. Auth & security (login, sessions, per-user data isolation / RLS, secrets).
  4. Frontend craft (responsive UI, one-click theming, reusable widgets, i18n
     dictionary, lazy/dynamic loading, smart search).
- **Already known / don't over-explain:** general programming; treat trade-off
  reasoning and professional practice as the thing to teach.

## 3. Success & scope
- **"v1 is done" means (nutrition vertical slice, deployed & owned):**
  1. Auth: sign in; your data is isolated to you.
  2. Ingredient inventory: CRUD with full macros (incl. fiber, salt), cost/unit,
     description.
  3. Meals: composed of ingredients × quantity, with derived macro/cost totals.
  4. Daily log: record meals eaten per day; see day totals vs. an objective.
  5. Deployed live on free tier and data is exportable/ownable.
  (Training, gamification, timer, AI, import pipelines = later sprints.)
- **Hard invariant(s):**
  - PRIMARY — **Logged data is never lost or silently corrupted** (survives bad
    deploys/migrations; exportable). Drives persistence/backup/migration design.
  - **Data isolation** — a user can never read another user's data.
  - **Totals = parts** — a day/meal's totals always equal the sum of their
    entries (drives compute-on-read vs. stored-total decision).
- **Rough scale assumptions:** single user initially; low hundreds of items,
  a few writes/day. Must stay comfortably inside free tiers. Design for
  multi-user later, don't build it now.

## 4. Constraints
- **Time budget:** bursty / irregular — slices must be resumable after gaps,
  so ADRs and docs carry more weight than usual.
- **Money budget:** €0 — free tiers only.
- **Must-use / must-avoid tech:** leaning to repeat Vercel + Supabase (familiar,
  free-tier friendly) but done properly this time; confirmed in ADR-0001.
- **Platform/runtime targets:** responsive web (desktop + mobile browser).

## 5. Foundational decisions → each gets an ADR before code
- [x] ADR-0001 Language & framework — TypeScript + Next.js (App Router) + `core/` layer
- [x] ADR-0002 Architecture style + the app-vs-kit split — feature slices over shared layers
- [ ] ADR-0003 Persistence + the data-durability invariant (backups, migrations)
- [ ] ADR-0004 Delivery target (deploy on free tier) & CI (+ health check)
- [ ] ADR-0005 Domain data model: heterogeneous exercises & aggregations
  (needed before training sprints; not blocking the nutrition v1)

## 6. Risks
- **Most likely reason this project dies:** over-abstracting the "kit" too early,
  or the same silent-data-loss / config rot that killed the last attempt.
- **Mitigation:** parallel track (no abstraction without a real consumer);
  durability as the primary invariant with backups + tested migrations; small
  resumable slices; `scripts/check.py` guardrail.
