# ADR-0054: Four places — Oggi, Piano, Andamento, Libreria — and models that plan anything

**Status:** superseded by ADR-0059 (places); the plan models stay
**Date:** 2026-10-16

## Context
Building the v2 design boards showed that the structure, not the
graphics, was unclear:
- "Tracker" and "Rivedi" both showed the past, by domain and by range.
- The plan page could not say where day templates and cycles are made.
  Its cycles were gym-only, while v1's day types also carry targets.
- Ingredients, meals, the pantry and money had no home in v2 at all,
  although v1 has them (`docs/spec/06-screens.md`).
The bottom bar fixes what a person meets first and every URL in v2, so it
is expensive to change after the code exists.

## Options considered
### A. By time plus a library: Oggi · Piano · ⊕ · Andamento · Libreria
- **Pros:**
  - Three time places: today, the future and its rules, the past.
  - One place for reusable things (foods, meals, pantry, exercises).
  - The past by domain and by range becomes one place.
  - Matches ADR-0053's "one timeline engine".
- **Cons:**
  - Domains (money, mind) are not tabs.
  - Their pages live inside Andamento and are reached through it or
    through ⊕.
### B. By domain, as v1: Corpo · Cibo · Oggi · Soldi · Mente
- **Pros:** familiar; each domain owns its catalog and its history.
- **Cons:**
  - Planning and reviewing are split five ways, which is what v2 set
    out to fix.
  - Every new kind needs a tab or gets lost.
### C. Keep Oggi · Piano · ⊕ · Rivedi · Tracker
- **Pros:** the boards exist.
- **Cons:**
  - Two places for the past.
  - No place for catalogs or the pantry.

## Decision
**A**, for two reasons:
- Every object then has exactly one home:
  - entries in Oggi;
  - models, cycles and routines in Piano;
  - history, goals and correlations in Andamento;
  - catalogs and the pantry in Libreria.
- A new kind needs no new tab.

**Models are generic.** A model is a block, a day type (with `extends`,
for macro-types of day), a week layout, or a **cycle**. A cycle is an
ordered list of any models, with an advance rule. It can be bound to a
block, for example "the training block takes the next step" or "the
dinner rotates four recipes".

**Tripwire.** Revisit if, after a month of use, the domain pages (Soldi,
Mente) are reached mostly through search or ⊕ and never through
Andamento: then they want their own place.

## Consequences
- **Spec:**
  - `flows.md` lists every object with where it is created, seen,
    edited and deleted, and the event chains;
  - `screens.md` and `concepts.md` §5 follow;
  - every v1 screen id gets a v2 home.
- **Boards:**
  - Trackers and Review merge into Andamento;
  - new Libreria boards: meals, ingredient editor, pantry;
  - Piano gains the model and cycle editors;
  - a DateNav component for days, weeks and ranges.
- **Code (v2):** a template's scope list gains `cycle`; a cycle stores
  its steps, its position and its advance rule.

## What I learned

