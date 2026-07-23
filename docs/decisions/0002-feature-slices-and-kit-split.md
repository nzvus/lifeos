# ADR-0002: Code is organised as feature slices over shared layers, and the kit is a marked folder region promoted by the rule of three — not a package

**Status:** accepted
**Date:** 2026-07-23

## Context

ADR-0001 fixed one layer — `core/` is pure and framework-free — and explicitly
deferred everything around it to here: the layering, the app-vs-kit split, and
the boundaries section of `ARCHITECTURE.md`. Nothing can be scaffolded until
those exist, because they are the shape of every file path in the repo.

Two constraints pull in opposite directions and resolving them *is* this
decision. `PROJECT.md` names over-abstraction — building the kit ahead of a real
consumer — as the most likely cause of death. But the ADR-0001 session
established that the previous project actually died of the opposite: widgets,
cards and toasts existed as near-identical copies, so changing one style, one
label or one dimension meant finding it in many files and missing some.

Those are only contradictory if "reuse" is treated as one thing. It is two.
**Values** — design tokens and i18n strings — are not abstractions; centralising
them costs nothing and has no speculative element, because a colour or a label
has exactly one correct home from the first time it is written. **Components**
are abstractions; centralising them early is a guess about a future that may not
arrive. An architecture that treats both the same way will fail in one direction
or the other. This one separates them physically, and gives them different rules.

The third constraint is the time budget: bursty and irregular, so resumability
after a multi-week gap outranks elegance.

## Options considered

### A. Technical layers only (`app/ components/ core/ lib/`), single package, kit deferred entirely
- Pros: fewest concepts and least ceremony, so the lowest possible re-entry cost
  after a gap. Components are centralised by construction, so the duplication
  failure is at least addressable.
- Cons: `components/` becomes a flat bag — at sixty files nothing indicates which
  belong to nutrition, to training, or to a reusable kit, so kit extraction later
  has no signal to work from and becomes guesswork. Any component may import any
  other, so coupling grows silently. That unconstrained import graph is how the
  previous attempt became untangleable.

### B. Feature slices over shared layers, single package; the kit is a marked region
- Pros: the only option in which the value/abstraction distinction has a physical
  expression — `design/` and `i18n/` are populated on day one, `ui/` only on
  earned reuse. The kit boundary is visible from the first commit at a cost of
  three folder names. Feature slices are natural resumable units, matching the
  time budget. Extraction gets a mechanical trigger instead of a judgement call
  made from memory.
- Cons: five top-level concepts rather than two. "Feature-specific or shared?"
  becomes a live decision on nearly every component; the rule of three answers it
  but does not remove it. If that discipline slips toward eager promotion, this
  is exactly where the over-abstraction risk materialises.

### C. npm workspaces monorepo from day one (`apps/web` + `packages/{core,ui,design,i18n}`)
- Pros: the kit boundary is physical and cannot be cheated by an import. Each
  package is forced to expose a real public API. Publishing later is trivial.
- Cons: it builds the kit's *packaging* before a second consumer exists, which is
  precisely what `PROJECT.md` forbids. The overhead — workspace wiring, tsconfig
  project references, build ordering, monorepo deploy configuration — is paid at
  every resumption, against the scarcest resource. Moving a file between packages
  is expensive enough that reorganising gets avoided at exactly the moments it is
  most needed.

## Decision

**Option B.** The layout, which is part of the decision and not a suggestion:

```
src/
  app/        # Next.js routes only — thin; no logic, no markup worth reusing
  features/   # vertical slices: nutrition/ingredients, nutrition/meals, …
  core/       # pure domain + data logic (ADR-0001), framework-free
  ui/         # shared presentational components   — KIT CANDIDATE
  design/     # tokens: colour, spacing, dimensions — KIT, populated day one
  i18n/       # dictionary of user-facing strings   — KIT, populated day one
```

Four rules, all mechanically enforced:

1. `app → features → core`. Dependencies point one way only; `core/` imports
   nothing app-ward (this restates ADR-0001's purity rule as a layer rule).
2. **A feature slice may never import another feature slice.** Slices meet in
   `core/`. This is the rule that prevents the coupling of option A.
3. `features/` and `ui/` may import `design/` and `i18n/`; neither imports
   upward. No literal colour, spacing value or user-facing string may appear
   outside `design/` and `i18n/` — this is a lint error, not a convention.
4. **Rule of three for components.** A component is born inside the feature slice
   that needs it. On its second or third genuine occurrence it moves to `ui/`
   and every copy is deleted **in the same commit**. Values never follow this
   path: they start centralised.

The kit is `ui/ + design/ + i18n/` plus scaffolding — a *marked region of the
tree*, not a published package. It becomes a package when, and only when, a
second real consumer exists.

Decisive reasons:

1. It is the only option in which the value/abstraction distinction is enforced
   by where a file sits rather than by remembering a rule. Under A the
   distinction has nowhere to live; under C it is real but purchased years early.
2. It defends against both named death risks simultaneously and with different
   mechanisms: day-one `design/`/`i18n/` kill shotgun surgery for values, while
   the rule of three with mandatory copy deletion kills speculative abstraction.
3. **B → C is a mechanical upgrade; A → C is a rewrite.** Once these dependency
   rules hold, promoting folders to workspace packages is a move-and-rename.
   That keeps the kit's packaging decision genuinely deferred rather than
   pre-answered in either direction.

**Design tokens** use Tailwind v4's `@theme`, declared in one file under
`design/`, which compiles tokens to CSS custom properties. Chosen because
one-click theming is an explicit learning objective and needs runtime-swappable
values — CSS custom properties are the substrate either way — and because
Tailwind's utilities make the token the path of least resistance while arbitrary
values (`p-[13px]`) remain lintable as rule-3 violations. Hand-rolled CSS Modules
would teach more raw CSS but leave nothing mechanically preventing a hardcoded
hex, which is the failure being designed against.

**Enforcement** is `eslint-plugin-boundaries` for rules 1–3, because it reports
violations in the editor as code is written rather than in a separate CI pass,
and it extends the ESLint setup ADR-0001 already requires. It only sees static
imports; that is accepted, since dynamic imports across a boundary would be
deliberate rather than accidental. `dependency-cruiser` remains available if
circular-dependency or orphan-module analysis is later wanted — it is richer but
runs outside ESLint, so it is a CI-time addition, not a replacement.

**Tripwires — revisit this ADR if:** (i) a second real consumer of the kit
appears, or publishing becomes desirable — go to option C; (ii) the
no-cross-slice-import rule gets waived repeatedly, which is evidence the slice
lines are drawn around the wrong things; (iii) `ui/` grows large enough to want
independent versioning ahead of a second consumer.

## Consequences

Now easier: the answer to "where does this file go?" is mechanical, which is what
makes a slice resumable after three weeks away. Restyling the whole app is one
file. Retranslating it is one file. Reviewing for creeping coupling is reading a
lint report rather than reading the import graph by hand.

Now harder, and requiring active discipline:

- Every new component requires a placement decision — slice or `ui/`. The default
  is **slice**; `ui/` requires an existing second or third occurrence to point at.
- Promotion to `ui/` is only complete when the copies are deleted. A promotion
  commit that leaves duplicates behind has made things strictly worse, and is
  reviewed as a defect.
- Two features needing the same thing is not automatically a `ui/` case. If the
  shared thing is *behaviour*, it belongs in `core/`; only shared *presentation*
  goes to `ui/`.

Follow-up work this creates:

- S01's scaffold must land the six directories, the `eslint-plugin-boundaries`
  configuration covering rules 1–3, and the Tailwind v4 `@theme` file — the same
  commit series, since an unenforced boundary rule is only a promise (ADR-0001).
- `ARCHITECTURE.md`'s component map and boundaries sections are filled in from
  this ADR.
- Tailwind v4 enters the stack, so `CLAUDE.md`'s stack line is updated here.
- ADR-0003 (persistence) inherits the constraint that all data access is reached
  through `core/`; no route handler or component may talk to the database.

Cheap-to-reverse choices made here without their own ADRs, noted for the record:
Tailwind v4 over CSS Modules for the token mechanism (the *centralisation* is the
decision; the mechanism is swappable because both compile to CSS custom
properties); `eslint-plugin-boundaries` over `dependency-cruiser` for enforcement;
feature slices grouped by domain area (`nutrition/…`) rather than flat.

## What I learned

Drafted by the agent from the session, pending the developer's edit.

"Don't abstract too early" and "don't duplicate" sound like a trade-off to be
balanced, and I had been treating them as one. They are not — they apply to
different kinds of thing. A colour, a spacing step or a label has exactly one
correct home the first time it is written, so centralising it is not a bet on the
future and there is no such thing as doing it too early. A component is a claim
that two things will keep changing together, which is a bet, and one that is
cheap to make later and expensive to unmake. The previous project failed at both
ends of that at once, and the reason it looked like a single problem is that both
show up as "changing one thing means editing many files".
