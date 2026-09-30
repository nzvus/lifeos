# ADR-0012: Ingredients have three typed quality attributes plus free tags; meals are rated per user-defined factor

**Status:** accepted
**Date:** 2026-09-30

## Context

The developer wants ingredients described beyond nutrients — processing
level (NOVA), animal or plant, organic, shop, fibre types with the gut
bacteria they are associated with (descriptive, never a health promise) —
shown with icons, adding up into meals, and later feeding a day quality
score whose breakdown is always visible. Meals should be rated on factors
the developer defines, with notes. A score can only be trusted if the data
it reads has a fixed meaning, and past days are snapshots (ADR-0007): a
reclassified ingredient must not rewrite an old day's score.

## Options considered

### Tags
- **A. Fixed columns on the ingredient** — typed, simple; every new kind of
  tag is a migration and there are no free labels ("Lidl", "favourite").
- **B. A generic user-defined tag system** — total freedom; a score would
  rest on conventions ("a tag called NOVA 4") that a rename breaks.
- **C. Hybrid** — three typed attributes the analysis relies on (`nova`
  1–4, `origin` plant/animal/mixed, `fiber_types` from a closed list) plus
  free tags (name + icon from a fixed set), descriptive only. Typed
  attributes are copied into each log line's snapshot; free tags are not.
  Two concepts instead of one; one more set of snapshot columns.

### Ratings
- **A. On the meal** — one 1–5 score per factor and notes, always
  editable; no history of how opinions changed.
- **B. On each log entry** — full history and real averages; one more step
  at every meal, and most entries would stay unrated.

## Decision

**Tags C and ratings A**, chosen by the developer on 2026-09-30.

- `ingredients` and `log_entry_items` gain `nova` (1–4, nullable),
  `origin` ('plant' | 'animal' | 'mixed', nullable) and `fiber_types`
  (text[], values from a closed list: inulin_fos, beta_glucan,
  resistant_starch, pectin, psyllium, insoluble, gos; default empty),
  with CHECK constraints. Logging copies them into the snapshot, like the
  nutrients.
- Free tags: `tags` (per user: name, icon key from a fixed set in ui/)
  and `ingredient_tags` (composite foreign keys, cascade), descriptive.
- Meals show derived values computed on read, never stored: share of
  energy from each NOVA level, share of protein by origin, fibre types
  present, the union of free tags.
- Ratings: `rating_factors` (per user: name, position) and `meal_ratings`
  (meal × factor, score 1–5, CHECK), plus `meals.review` for notes.
- The closed lists (NOVA, origins, fibre types) live in core; labels,
  descriptions (associated bacteria, worded as "associated with", with no
  claims) and icons in i18n/ui.

Decisive reasons: the future score reads only typed, snapshotted data, so
old days stay stable (ADR-0007) and the score is explainable; free tags
keep the flexibility for everything descriptive.

**Tripwires:** a free tag that the developer wants in the score is a
candidate for a new typed attribute (a migration, on purpose). Wanting
"how did it feel that day" moves ratings to option B (additive: a score
on the entry).

## Consequences

- Migration 0007 (additive), as its own PR before any code reads it.
- Existing ingredients start unclassified (null / empty); entries logged
  before 0007 have no attributes in their snapshot and count as
  "unknown" in any later analysis — shown as such, never guessed.
- Export gains the new fields (version 5); the importers must carry them.

## What I learned
