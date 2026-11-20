---
name: change
description: Change the lifeos spec through one folder, run as rounds of the method (ADR-0064) - triage (zoom, ORCA cells), propose (proposal, delta, tasks), apply (build the slices with tests citing IDs), archive (merge the delta into the spec). Use when a request of the user changes a pattern, type, word or rule, when he says "change" or "proposta", or when the inbox has an item to turn into work.
---

# Change (PRD-41, PAT-92, ADR-0064)

A change is one or more **rounds** of the method (`docs/decisions/0064-*`): Discover → Define
(**stop A**: his word on the ORCA rows and the conflicts) → Develop → Deliver (**stop B**: his word
on the photos). Every round covers every object in its scope — never one thing first.

One change open at a time; the spec (`docs/spec/` outside `changes/`) is edited only while one
is open (the `pre-edit` hook blocks it otherwise).

## 0. Triage (every request of his, before anything else)
1. His words go in at once: the open change's `proposal.md`, else `changes/inbox.md` (PRD-43).
2. Name the **zoom** — the highest level it changes: Z1 purpose `product.md` · Z2 system
   `product.md` map + `model.md` layers · Z3 patterns `patterns.md` + `visual.md` · Z4 objects
   `docs/spec/orca/` · Z5 details `domains/`. A detail that contradicts a level above goes up.
3. Name the **ORCA cells**: which rows of `orca/objects`, `relationships`, `actions`,
   `attributes` it adds or changes (IDs, or «new OBJ …»).
4. Pick the steps: Z5 detail → Define + Deliver; a new attribute or action (Z4) → Define,
   Develop, Deliver; a new kind of thing → a full round at Z4; a new pattern or grammar → a round
   at Z3 or Z2, then down. A new object, pattern or zoom-level rule is his (CLAUDE.md rule 1).

## 1. Propose (Discover → Define → stop A)
1. Read `docs/spec/product.md`, `model.md`, `patterns.md`, the `orca/` tables and the `domains/`
   file touched. Discover: his words (inbox, proposals, `docs/archive/`), the app as it is
   (`map.md`, the photos), his data (his export) — a raw list, nothing decided.
2. Create `docs/spec/changes/YYYY-MM-DD-name/`:
   - `proposal.md`: **Zoom:** and **ORCA cells:** (the triage; `check.py` fails without them),
     **Why** (his words, quoted, with date), **What**, **Not in this change**, **Stop** (stops A
     and B of each round).
   - `delta.md`: `## ADDED` / `## MODIFIED` / `## REMOVED`, each requirement with its ID
     (new IDs: next free number in its file) written WHEN / THEN; a MODIFIED one is rewritten
     whole, not as a diff; each row cites the ORCA cell (`OBJ-03`) or the zoom (`Z3`) it changes.
   - the ORCA rows themselves, in `orca/` (schema: `orca/README.md`), each with its Source.
   - `tasks.md`: numbered slices, each «tests citing IDs, docs touched».
3. Remove the item from `changes/inbox.md` if it came from there. Decide per pattern, never per
   screen (PRD-50): a new pattern, type or word is his call (PRD-51), ask before building.
4. Name every conflict between his older and newer words. `python3 scripts/check.py`; **stop A**:
   his OK on the rows, the conflicts and a new proposal.

## 1b. Develop
What the objects in scope share: one card, one instrument, one action. Options with a
recommendation, at their zoom; go up a zoom when a unification changes a pattern or the system.

## 2. Apply (Deliver → stop B)
- One branch, one PR for the change (`--base main`); slices in `tasks.md` order, `[x]` when done.
- Every built requirement has a test whose name or comment cites its ID (`PAT-21`); `check.py`
  fails a «built» requirement without one (PRD-42).
- His new words while the change is open go into its `proposal.md` at once (PRD-43).
- Slices by layer, each reaching every place that shows the object (never one screen first).
- UI slices: the `verify` skill before pushing; **stop B**: his word on the photos.

## 3. Archive
1. Merge each delta item into its home file (the spec text replaces the old one; «Today:» lines
   updated; ✗ → ✓ in `patterns.md` for built kit pieces).
2. `git mv docs/spec/changes/<id> docs/spec/changes/archive/<id>`.
3. `python3 scripts/check.py` (fails an incomplete change), update the handoff, `retro` skill.
