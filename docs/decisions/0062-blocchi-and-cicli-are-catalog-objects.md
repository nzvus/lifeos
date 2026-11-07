# ADR-0062: Blocchi and cicli are catalog objects

**Status:** accepted
**Date:** 2026-11-07

## Context
The Piano is rebuilt as blocchi and cicli (MOD-30…35, PL-01…72): a blocco is what + when + how
often + area; a ciclo is ordered steps of blocchi; an abitudine is a blocco of a tracker. Today
they live in day models (`templates`, `template_blocks`), week layouts and cycle tables, and
PL-72 moves his data into the new shape with one repair. PL-70 asks that blocchi and cicli have
the common life of a catalog object (page, Parti da, Archivia, Annulla, Elenco), and PRD-03 that
a new kind of thing is a registry entry, not a new engine. The storage has to be chosen before
the migration is written (Q-14 of change 2026-11-07-piano).

## Options considered
### A. Catalog objects (`catalog_items` «block» and «cycle»)
- Pros: page, verbs, undo, Elenco, archive come from the registry and `core/verbs` with no new
  code (PL-70, PRD-03); a blocco's what is a `catalog_parts` row (a rotation is several, in
  order); when / how often / area are `catalog_values` with source and confidence (the recurrence as
  the engine's `Recurrence`, JSON in a text value); a ciclo's
  steps keep `cycle_steps` / `cycle_step_items`, so the advance engine and its 14 v1 parity
  tests stay.
- Cons: the planning engine needs a repository that reads blocchi from values and parts
  instead of typed columns; a recurrence is a JSON text value checked in `core/plans`, not by
  a column constraint; `cycle_steps` must point at `catalog_items` instead of `templates`.
### B. A table of its own (`blocks`, `block_items`)
- Pros: typed columns, simple SQL for the engine, constraints in the database.
- Cons: `core/verbs`, the generic page and Elenco know `catalog_items` and `kinds` only: a third
  storage branch for one type, against PRD-03.
### C. Reuse `template_blocks`
- Pros: the smallest migration, the engine's queries unchanged.
- Cons: keeps the day-model structure the spec removed (x04, MOD-32) and columns no blocco uses
  (derived models, shares, `removed`).

## Decision
**A** — his «decidi tu» on Q-14 (7 Nov), the agent's pick. It is the shape PRD-03 and PL-70 ask
for, and every horizontal piece already works on it. Tripwire: if reading the Piano of a day
from values and parts is slow on his data (more than ~100 ms for a week), add a read model
(a view or a cache) — not a new storage.

## Consequences
- Registry: types «blocco» and «ciclo» in `core/kinds/catalog.ts` with their fields (time,
  anchor, offset, recurrence, area, step rules); a repository in `core/plans` turns them into the
  engine's input.
- Migration (PL-72): each ciclo becomes a catalog «cycle» with the **same id**, so
  `cycle_steps.cycle_id` only changes its foreign key (templates → catalog_items); day models,
  week layouts and habits become catalog «block» rows; one idempotent migration, run by his
  «migrate v2» after a dump; the old plan tables stay read-only until a later change drops
  them.
- The Piano tabs, the blocco and ciclo pages and Elenco sections are compositions of kit pieces.

## What I learned
<to be written by the developer>
