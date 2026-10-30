# ADR-0059: Four areas around Oggi, the same four tabs everywhere

**Status:** accepted
**Date:** 2026-10-30

## Context
The developer, 29 Oct: «l'app è completamente inusabile, era molto più comprensibile
v1… cercando di migliorare abbiamo peggiorato molto». Phase 0 of the review measured why
(`docs/spec/v2/design-register.md` § V): v1's areas with tabs told you where you were and
what sat next to it. v2's places by action (ADR-0054) spread one object over three or
four places and hid sub-pages behind text links. The developer asked to rethink the
structure from scratch, for everything planned and for growth, taking the best of both,
and then asked for it to be **symmetric, also in how it works** (30 Oct). The bar fixes
every URL and what a person meets first, so it is expensive to change after the code.
Full analysis: `docs/spec/v2/dossiers/architecture.md`.

## Options considered
### A. By action, with tabs (v2 mended): Oggi · Piano · ⊕ · Andamento · Libreria
- Pros: time places are clear; the code exists.
- Cons: one object lives in three or four places; a new domain needs a tab in each.
### B. Topics on one template, the bar chosen by the person: Oggi · 2–3 pinned topics · ⊕ · Tutto
- Pros: grows without limits; one template.
- Cons: «Tutto» is a catch-all, not a place like the others; the bar differs per person;
  not symmetric.
### C. Four areas around Oggi, same four tabs everywhere: Corpo · Cibo · **Oggi** · Mente · Soldi
- Pros: v1's bar, which was understood; every place works the same way (Diario · Piano ·
  Elenco · Andamento), Oggi included, which is the same four tabs across all areas; ⊕ in
  the same corner of every page, adding what belongs to that place; a new kind joins an
  area, the bar never changes.
- Cons: the areas are fixed; a large new domain lives inside an area, not in a place of
  its own.

## Decision
**C.** It is the only option symmetric in form and in function: one centre (Oggi), four
equal areas, one page template with four tabs in one order, one ⊕ that adds to where you
are. It keeps what v1 did well (areas with tabs, Oggi in the centre) and what v2 did well
(⊕, the day with ticks and balance, generic kinds and one plan engine).

Rules:
- **Areas**: Corpo (training, weight, measures, sleep, steps, routes), Cibo (meals,
  intakes, water, foods, saved meals, pantry), Mente (check-ins, journal, habits, the
  person's trackers, «legami»), Soldi (spending, budget, categories).
- **Tabs**, the same in every area and in Oggi: *Diario* (entries by day), *Piano* (that
  area's part of the one plan), *Elenco* (its objects), *Andamento* (trends, scores, its
  goals). A tab with nothing to show stays, with its empty state: the row never changes.
- **Oggi** = the four tabs over all areas: the day, the week's plan, everything (with
  search), the combined picture.
- **⊕** in the same place on every page; it offers that area's kinds first (all of them
  in Oggi).
- **Kinds** (`kinds.md`): a kind belongs to one area, chosen when it is created
  («Farmaci» → Corpo, «Studio» → Mente).
- **Settings** behind the profile icon in the header; goals live in their area's Andamento.
- Desktop: the bar becomes a side rail with the same five items in the same order.

Tripwire: if a domain grows to more objects than an area's Elenco can show plainly, or the
person keeps asking for a place of its own, revisit with B's pinning as an extension.

## Consequences
- Supersedes ADR-0054 (places); ADR-0053's one plan engine and generic kinds stay.
- `flows.md` and `screens.md` are rewritten for the five places in phase 3 of the review;
  every route in `apps/v2/src/app/(app)` moves under an area or Oggi in phase 4, with
  redirects from the old URLs.
- Every kind needs an area: a column on the kind, defaulted from the built-in kinds
  (a migration, in the code phase).
- One page template (area header, four tabs, ⊕) in the kit; the area pages are data, not
  separate screens.

## What I learned
