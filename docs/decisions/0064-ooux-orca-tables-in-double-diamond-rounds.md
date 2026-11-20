# ADR-0064: The project is designed and changed by OOUX/ORCA tables in Double Diamond rounds

**Status:** accepted (by «yc», 20 Nov 2026, proposal §117: Claude's recommendation taken on every
point of `method.md` §9; undo: set this ADR to «superseded», drop `docs/spec/orca/` and the two
proposal headers, and the `change` skill and `check.py` go back to their state before it)
**Date:** 2026-11-20

## Context
For three weeks each answer started from one thing (a page, a card, a bar) and the decisions were
scattered: 117 proposal items, 23 study sections, five rules files. He rejected eleven bar looks in
a day, and on 20 Nov asked for a standard way of working instead (proposal §114): «pensare e
ragionare in dettaglio a tutte le cose che servono per ogni cosa, poi fare un passo indietro… poi
ancora un passo indietro su un livello gerarchico superiore… e poi tornare nel dettaglio… non
esistono modus operandi… standardizzati?». Then (§115): «inizia a pensare a come vada preimpostato
tutto questo framework, anche per cambiamenti futuri a tutto il progetto». The method fixes the
order of every later design decision, so it is decided before round 1.

## Options considered
### A. OOUX/ORCA tables in Double Diamond rounds, at stated zoom levels
- Pros: two published, widely taught methods (OOUX by Sophia Prater; Double Diamond by the UK
  Design Council). ORCA (objects · relationships · calls to action · attributes) makes «every
  thing first» a table that can be checked; the diamond is exactly his «detail → step back →
  level above → back to detail». Cards, places, the engine and navigation are derived from the
  tables, not drawn one by one. Fits what exists: only `docs/spec/orca/` is new (method §10).
- Cons: a first round over every object costs tokens before any screen moves; four tables to
  keep in step with the registry (hence the `check.py` checks).
### B. Keep the change process as it is (proposal → delta → tasks), with no tables
- Pros: nothing new to learn or maintain.
- Cons: it is what produced the one-thing-first answers; nothing in it forces every object to be
  seen before one is drawn.
### C. Atomic Design (Brad Frost) as the frame
- Pros: well known; the kit already is atoms → organisms.
- Cons: it orders the pieces, not the objects or the decisions; it starts from the pieces, the
  opposite of «what he needs for every thing». Its interface inventory is kept inside A's Discover.

## Decision
**A**, as written in `docs/spec/changes/2026-11-14-five-places/method.md` (§1–§6, §9, §10). It is
his question answered by the standard methods he asked for, and it is the only option that makes
«every object first» a check rather than a promise.

Rules:
- **The ORCA tables** (`docs/spec/orca/`: objects, relationships, actions, attributes) are
  markdown tables with a fixed schema that `check.py` reads. One row per thing, each with its
  source (his words, date). The registry in code must match `objects`.
- **Zoom levels, existing homes:** Z1 purpose `product.md` · Z2 system `product.md` (map) +
  `model.md` (layers) · Z3 patterns `patterns.md` + `visual.md` · Z4 objects `orca/` · Z5 details
  `domains/`. A decision is written at the highest zoom it changes; a detail that contradicts a
  level above sends the round up, never a patch below.
- **A round:** Discover (open: his words, the app via `map.md`, his data) → Define (close: the
  tables, the conflicts named; **stop A**, his word) → Develop (open: what objects share, options
  with a recommendation, up a zoom when needed) → Deliver (close: delta with IDs, slices by layer
  reaching every place, tests, photos; **stop B**, his word). Every round covers every object in
  its scope; never one first.
- **One door:** his words → inbox or the open proposal → triage (zoom, ORCA cells) → only the
  steps it needs. A change is one or more rounds; `proposal.md` carries **Zoom** and **ORCA cells**.
- **`PROJECT.md`** is archived (its pitch is `product.md` §1, its invariants are in
  `ARCHITECTURE.md` and `domains/data.md`).

Tripwire: if two rounds in a row end at stop A or B with the same rejection, or a table row is
written that no card, place or check ever reads, the method itself goes to `tune-rules`.

## Consequences
- PRD-41 gains the rounds (cited there). The `change` skill gains the triage and the two headers;
  `check.py` gains the ORCA checks of method §6 as each table exists; the `adr` skill reads
  `product.md` instead of `PROJECT.md`.
- `model.md`'s catalog of types moves to `orca/objects` in round 1; its rules stay.
- At this change's archive: `reframe.md` lands in `product.md` + `model.md`, bars-study §21–§23
  in `visual.md`, `target.md`'s tables in `orca/`.
- Harder: no screen moves before stop A of round 1.

## What I learned
