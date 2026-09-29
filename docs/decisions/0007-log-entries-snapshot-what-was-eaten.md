# ADR-0007: A log entry stores a snapshot of what was eaten, and day totals are computed on read from that snapshot

**Status:** proposed
**Date:** 2026-09-29

## Context

Nutrition v1 needs a daily log (PROJECT.md §3.4), and its data model is
expensive to reverse once real history exists. Two invariants collide here.
ADR-0003 fixed "totals are computed on read, no stored aggregates" to protect
totals = parts. But ingredients and meals are *editable*: correcting a label
value or changing a recipe is normal. If a log entry only points at the live
meal, then editing an ingredient in October silently rewrites what September
says you ate — the primary invariant ("logged data is never silently
corrupted") broken by an ordinary edit, with no error anywhere. The model has
to decide which of the two a log entry is: a reference or a record.

## Options considered

### A. Live reference — an entry stores (day, meal, servings) only
- Pros: smallest model; totals always computed from current values, so a
  corrected label fixes everything; no duplicated data.
- Cons: history is mutable. Any ingredient edit, meal edit or deletion changes
  past days retroactively and invisibly; deleting a meal must be blocked
  forever or it deletes history. Directly violates the primary invariant.

### B. Snapshot lines — logging copies each line's quantity, nutrient values and price into the entry
- Pros: history is immutable by construction; meals and ingredients stay
  freely editable and deletable. Totals are still computed on read (from the
  copies), so ADR-0003's rule and totals = parts both hold. The entry keeps its
  label, so a renamed or deleted meal still reads correctly.
- Cons: duplicated data (one row per line per entry — trivial at this scale).
  A genuinely wrong label value must be corrected in past entries explicitly,
  not automatically.

### C. Store computed totals on the entry
- Pros: simplest read; immune to later edits.
- Cons: a stored aggregate — exactly what ADR-0003 rules out, since it can
  disagree with its parts. It also loses the composition (what was in the meal),
  which later features (shopping frequency, receipts) need.

### D. Versioned ingredients and meals — every edit creates a new immutable version
- Pros: full audit history of every ingredient; entries reference exact
  versions; no copying; price history comes for free.
- Cons: every query needs "which version" logic; edits multiply rows; far more
  modelling than v1 needs. Speculative ahead of a real consumer.

## Decision

**Option B.** Logging a meal or an ingredient copies its lines into
`log_entry_items` (name, unit, quantity, per-100 nutrients, package price and
size); `log_entries` keeps `label`, `servings`, and a nullable link to the meal
(set null on delete). Day and entry totals are computed on read by
`core/nutrition/totals.ts` from the copies.

Decisive reasons:

1. It is the only option where an ordinary, frequent action (editing an
   ingredient) cannot corrupt history, without giving up ADR-0003's
   no-stored-aggregates rule.
2. Recipes and history get the behaviour each should have: a meal's totals
   follow its ingredients (fix once, correct everywhere), a day's totals never
   move.
3. It is testable as a sentence: "edit, rewrite and delete the meal, and the
   logged day is unchanged" is a test in `log.test.ts`.

**Tripwires — revisit this ADR if:** (i) correcting past entries after a
label fix becomes a frequent chore — add an explicit "re-snapshot this entry"
action rather than going back to A; (ii) receipts or price tracking need
ingredient history across time, which is the case for option D, as a new ADR;
(iii) snapshot rows ever become a measurable share of the 0.5 GB Neon budget.

## Consequences

Now easier: meals and ingredients can be edited and deleted without fear;
deleting an ingredient that a meal still uses is refused, but deleting one that
only history uses is fine. Exports contain complete, self-describing history.

Now harder: the log schema carries a copy of every nutrient column, so adding a
nutrient touches `ingredients`, `log_entry_items` and `user_settings` (the
`nutrientColumns()` helper in `core/db/schema/nutrition.ts` keeps that one
edit). A wrong label value already logged stays wrong until corrected by hand.

Follow-up work: none required for v1. Import pipelines (FitForge, receipts)
must write snapshots too, never live references.

## What I learned

Not written yet: this section is the developer's own, as for ADR-0001..0006
(ROADMAP S01 "carried over").
