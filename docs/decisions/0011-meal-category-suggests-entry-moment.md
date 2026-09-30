# ADR-0011: A meal may have a category; each log entry has its own moment of the day, suggested from it

**Status:** accepted
**Date:** 2026-09-30

## Context

The developer wants meals grouped as breakfast/snack, lunch and dinner,
and a day view that groups what was eaten by moment. The same food is
eaten at different moments (skyr at breakfast one day, as a snack the
next), estimates and single ingredients have no meal at all, and log
entries are snapshots of what happened (ADR-0007). Since ADR-0009 entries
also carry an optional time. This is a data-model change on the log, the
history the primary invariant protects, so it is recorded first.

## Options considered

### A. A category on the meal only (`meals.category`)
- Pros: one column, simplest; the meals list can be filtered by it.
- Cons: classifies the recipe, not the eating: a snack of a "breakfast"
  meal is filed as breakfast; estimates and single ingredients have none;
  renaming a meal's category would silently move past days.

### B. A moment on the log entry only (`log_entries.moment`)
- Pros: records what happened, like every other entry field (ADR-0007);
  the day can be grouped by moment; works for estimates and ingredients.
- Cons: without a hint it must be chosen on every add, or guessed from
  the time alone.

### C. Both: an optional category on the meal as a hint, and the moment on the entry
- Pros: the entry's moment is the truth (B's pros), prefilled from the
  meal's category when there is one, else from the time; the meals list
  can be filtered by category; entries logged before this change have no
  moment and derive it from their time on read, so nothing is rewritten.
- Cons: two concepts to explain (the category only suggests).

## Decision

**Option C**, chosen by the developer on 2026-09-30.

- Moments: `breakfast`, `lunch`, `snack`, `dinner` (a closed list in
  core, like locales and themes; labels and icons in i18n/ui). Both new
  columns are nullable text with a CHECK constraint: `meals.category` and
  `log_entries.moment` — one additive migration, no backfill.
- Adding an entry: the moment field is prefilled — the meal's category if
  it has one, else from the time (entered, or now): before 11:00
  breakfast, before 15:00 lunch, before 18:30 snack, else dinner — and
  can always be changed. Stored on the entry (a snapshot: editing the
  meal's category later changes no past day).
- Reading: an entry with no moment (older, or not set) gets one derived
  from its time; with no time either, it is "not set". Derivation is a
  pure core function, the same for the day view and the analysis.
- The day view groups entries by moment, in day order, with subtotals.

Decisive reasons: it records what happened (ADR-0007) while keeping the
convenience of a default; it needs no backfill; it reuses ADR-0009's times.

**Tripwire:** if the prefilled moment is corrected most of the time, the
defaults (hours or category) are wrong; if the developer wants custom
moments (e.g. "pre-workout"), the closed list becomes a user table.

## Consequences

- Migration 0005 (additive), released as its own PR before any code reads
  the columns (CI migration gate, 2026-09-30 outage).
- Easier: grouping the day and analysing by moment; filtering meals.
- Harder: one more field on the add form and the meal editor; export
  gains two fields.

## What I learned
