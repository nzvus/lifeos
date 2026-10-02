# ADR-0027: Weigh-ins are read with their context: quick tags, derived clues, a trend and body indices

**Status:** accepted (the developer chose option B directly, 2026-10-02)
**Date:** 2026-10-02

## Context
A weigh-in is only a day and a number (`body_measurements`), and the
calibration (ADR-0020, ADR-0026) fits a line through those numbers. On a
given day, the scale can move 1–2 kg with water alone: weighing after a
meal or a workout, the toilet, a salty or high-carb day before (glycogen
holds about 3 g of water per gram). The developer wants the app to tell
these apart, and to show BMI and similar indices. Height is already in
`user_settings`.

## Options considered
### A. Everything derived, nothing asked
- Pros: no extra taps. The weigh-in's time (its `created_at`), meals and
  training before it, and the previous day's carbs and salt are already in
  the database. A smoothed trend absorbs most of the noise.
- Cons: `created_at` is when it was typed, not when the user stepped on the
  scale. Fasting and the toilet can't be derived.
### B. Derived clues plus two or three quick tags at weigh-in
- Pros: the user states the few things only they know (fasted, after the
  toilet, after training) and when they weighed. Everything else stays
  derived. Tagged weigh-ins are trustworthy, and the others weigh less.
- Cons: a tap or two more when weighing in, and a new table.
### C. A model that corrects the number
- Pros: one "true" weight per day.
- Cons: glycogen and water estimates are rough. A corrected number looks
  precise and isn't, which PROJECT.md rules out.

## Decision
**B.**
- **Storage:** a new table `weigh_in_context`, one row per weigh-in
  (`measurement_id` as the key, owned by the user like every child row).
  It holds `measured_at` (when they weighed, nullable) and three booleans:
  `fasted`, `after_toilet`, `after_training`. It is a new table, not
  columns on `body_measurements`, because a column on an existing table
  breaks production until it is migrated (the #103 outage). No row means
  "unknown", which is what every past weigh-in is.
- **Derived clues** (pure core function): food eaten that day before
  `measured_at` (or `created_at`), training before it, the time of day, and
  the previous day's carbs and salt against the user's 14-day average.
  Shown in words ("after dinner · yesterday 40 % more carbs than usual:
  likely water"), never as a correction.
- **A reliability weight per weigh-in:** 1 for a standard weigh-in (fasted,
  after the toilet, morning, nothing eaten). Each clue against it lowers
  the weight, down to 0.25. Unknown counts as 0.75. The calibration's line
  becomes a weighted least-squares fit. The stored kilograms never change.
- **Trend weight:** an exponentially smoothed average of the weigh-ins
  (Hacker's Diet style, 10 % a day, weighted the same way), shown next to
  the scale's number and in the chart.
- **Body indices**, labelled as screening, not diagnosis:
  - BMI from height, with the WHO categories and a note that it overrates
    muscular people;
  - waist-to-height ratio when the waist is logged (0.5 as the line);
  - FFMI when body fat is logged.

Tripwire: compare the calibration's monthly swings with and without the
weights (ADR-0020's ±10 %). If the weights don't make it steadier after two
months of tagged weigh-ins, drop the weighting and keep the tags as notes.

## Consequences
- One migration that only adds a table (safe to deploy before or after the
  code). The trash (ADR-0015) and the export include it with its weigh-in.
- core/body: clues, reliability, the trend and the indices, all pure and
  tested. The calibration takes weights.
- Weigh-in form: time (now by default), three toggles. The weigh-in list
  and the Targets page show the trend, the clues and the indices.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
