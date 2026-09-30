# ADR-0005: Training is sessions of exercises with typed sets; exercises are identities, burn is a range

**Status:** accepted
**Date:** 2026-09-30

## Context

Deferred since S00 until the training module; PROJECT.md names "heterogeneous
exercises and session aggregations" a learning objective and forbids
presenting exercise calories as precise. The developer's real data
(2026-09-30): PUSH/PULL text logs from September — machines, cables and
dumbbells, sets written as "10 da 60", "2x9 da 15", "3x8 con 2 da 20" (two
dumbbells), "7 con 2 da 10 + asta" (plates plus a bar of unknown weight),
"3x10" (bodyweight), notes per exercise, per-exercise rests, warm-up sets
described in words, unilateral work, session duration; a FitForge export
with 5 sessions (3 strength, 2 treadmill with duration, speed and incline),
4 presets (Legs, Push, Pull, Tread) and 2 body measurements. The diet plan
already computes tonnage and estimated 1RM by hand and moves to
Upper/Lower, 4 sessions a week, plus more walking.

## Options considered

### Sets
- **A. One `sets` table with typed columns** (reps, load, duration,
  distance, speed, incline); the exercise's kind says which apply;
  constraints and validation refuse nonsense. Exact, simple analysis (tonnage, records,
  1RM); FitForge's own model. A new kind of metric needs a migration.
- **B. One table per kind** (strength sets, cardio segments). Narrow tables;
  a mixed session spans several queries and orders.
- **C. Flexible metrics** (JSON or key/value per set). Anything without
  migrations; the database guarantees nothing and analysis becomes fragile.

### Exercise identity
- **Snapshot the name in each session** (like food, ADR-0007) — renaming
  would split an exercise's history.
- **Reference the exercise** — a rename carries the whole progression;
  duplicates are merged on purpose.

## Decision

The developer delegated the choice ("scegli tu"); these are the
recommended options.

1. **Sets: option A.** `exercises.kind` is 'strength' | 'bodyweight' |
   'cardio'. `sets` has reps, load_kg, load_text, duration_s, distance_m,
   speed_kmh, incline_pct, rest_s, warmup. The database guarantees what a
   row alone can (reps or a duration present, positive numbers); the rules
   per kind (strength needs reps and load, bodyweight reps with an optional
   load, cardio a duration) are core validation, because the kind lives on
   the exercise and a CHECK cannot read another table. Composite loads keep both forms: `load_kg` is the
   total used for arithmetic (2×20 → 40), `load_text` what was written
   ("2×7,5 + asta"); `load_approx` marks a total with an unknown part.
2. **Exercises are user-defined identities** (name, kind, muscle groups,
   equipment, unilateral), referenced by sessions — no name snapshot;
   merging duplicates is an explicit action. No pre-seeded catalogue: the
   first exercises come from the FitForge export and the text logs.
3. **Sessions are planned or done** (as food, ADR-0009), with a day, a
   start time, a duration, notes, and an optional routine. **Routines**
   (PUSH, PULL, Upper, Lower…) list exercises with default sets; starting
   a session from a routine prefills the numbers of the last time.
4. **Burn is a range**, MET × body weight × time, per kind (strength by
   session time; cardio by segment with speed and incline), always shown
   as an estimate. A **body measurements** table (date, weight, optional
   body fat and circumferences) provides the weight and imports FitForge's.
   Activity-based day targets are a later ADR; planned sessions are kept so
   it can use them.

Decisive reasons: the analyses the developer already does by hand
(tonnage, 1RM, progression) are exact queries on typed sets; the database
refuses impossible sets; progression survives renames.

**Tripwires:** an activity whose metrics don't fit (swimming laps, climbing
grades) → add columns or revisit C for that kind only; renames that should
NOT carry history (a changed machine) → create a new exercise, or add a
per-set equipment note.

## Consequences

- Migration (additive): exercises, routines, routine items, sessions,
  session exercises, sets, body measurements — as its own PR (CI gate).
- Importers: FitForge sessions, presets and body metrics; a parser for the
  PUSH/PULL text logs with a dry run, like the food importers.
- Export gains the training data (version 6).

## What I learned
