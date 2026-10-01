# ADR-0022: A day's food entry is edited as a local copy of its meal

**Status:** accepted (the developer chose the recommended option, 2026-10-01)
**Date:** 2026-10-01

## Context
A logged meal is a snapshot of its lines (ADR-0007). The developer wants
to change grams and swap ingredients of what was eaten on a day ("less
oats today, rice instead of pasta") without changing the meal's recipe.

## Options considered
### A. Local copy
- Pros: fits the snapshot model; the meal stays as it is; the entry says
  it was changed.
- Cons: a variant used every day has to be edited every day.
### B. Local copy + "save as a new meal"
- Pros: a recurring variant becomes reusable.
- Cons: more UI; can come later on top of A.
### C. Grams only
- Pros: the simplest.
- Cons: no swaps, which is half of the request.

## Decision
**A.** The entry's lines (log_entry_items) are edited in place: grams, add,
remove, swap an ingredient (its label values copied at that moment). The
entry keeps its meal link as its origin and is marked as changed. B can be
added later without a schema change.
Tripwire: if the same edit is repeated on most days, add B.

## Consequences
- Possibly a column on log_entries (`edited`), in a migration-only PR first.
- Totals are already computed from the lines, so no other change is needed.
- "Refresh from the meal" (ADR-0007) must warn that it drops the edits.

## What I learned
