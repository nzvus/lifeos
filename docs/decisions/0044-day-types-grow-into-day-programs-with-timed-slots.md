# ADR-0044: Day types grow into day programs: timed meal slots, a training time, a share of the week

**Status:** accepted (the developer: "procedi" on the recommendations, 2026-10-10; details decided by the agent)
**Date:** 2026-10-10
**Would amend:** ADR-0008 (day types), ADR-0011 (moments), ADR-0043 (the uniform week)

## Context
The refactor plan's Phase 3 (§2.2, §4). What happens now:
- A day knows *what* to eat (its type's targets), but not *when*.
- Moments are a closed list of four (breakfast, lunch, snack, dinner).
  There is no pre-workout, post-workout or pre-sleep moment.
- Training and food share the day but never meet. The app does not know
  the session is at 18:00, so it can't say "carbs 1–3 h before, protein
  within ~2 h after".
- Nothing evaluates distribution: protein per meal, carbs around
  training, energy eaten late.

ADR-0043 made the week uniform and left a tripwire: training days may want
more. The plan's target model (§4) puts a **day program** between the
weekly budget and the day plan. A day program is a template: a training
slot with its usual time, plus meal slots, each with a time and a soft
share of energy and protein.

Four questions are the developer's. They are expensive to reverse
(data model, the meaning of existing screens).

## Options considered
### Q1. Where a day program lives
#### A. The day type grows into the program (recommended)
New tables hang off `day_profiles`:
- `day_profile_slots`: kind, time, a share of kcal and protein;
- `day_profile_training`: a routine or the program's slot, and a time.

In the UI, "day type" is the program: one concept, as now.
- Pros: nothing new to choose on Today. Days already pick a type (ADR-0008),
  so they pick a program for free. New tables only.
- Cons: "day type" now carries two things (targets and a timetable). Its
  editor gets longer.

#### B. A separate `day_programs` concept beside day types
- Pros: the targets and the timetable change independently.
- Cons: each day would need two choices (a type and a program). This is
  the kind of split the developer called confusing in the review.

#### C. No programs: only more moments
- Pros: small.
- Cons: no times, so no peri-workout guidance. That is half of the point.

### Q2. Moments
#### A. Extend the closed list (recommended)
Add `pre_workout`, `post_workout` and `pre_sleep`, plus snacks named by
position (already done in Phase 0). A slot's kind is a moment, and an
entry keeps its moment as a snapshot (ADR-0011).
- Pros: one migration that widens a CHECK constraint. Every entry already
  has a moment.
- Cons: still a closed list. Custom names would need a table later
  (ADR-0011's tripwire).

#### B. User-defined slots, entries point at a slot row
- Pros: any name.
- Cons: a foreign key from every entry to a template that may change.
  Snapshots break (ADR-0007).

### Q3. The week: uniform or shifted
#### A. A shift per program (recommended)
Each program may carry ± kcal (e.g. +300 on leg days). The check-in keeps
the weekly total. Each day = the week's average + its shift − the week's
mean shift. Programs without a shift stay uniform.
- Pros: answers ADR-0043's tripwire. The same total, so the goal's rate holds.
- Cons: the check-in must know which program each coming day has. It
  reads the program cycle (ADR-0024) and day overrides.

#### B. Stay uniform (ADR-0043 as is)
- Pros: nothing to build.
- Cons: training days stay as lean as rest days.

### Q4. Scoring in time context (plan §2.2b)
#### A. As the plan says (recommended)
- Energy is scored against what is left of the week's budget: 7 days back
  and forward, with a cap per day.
- Protein is scored daily.
- Fibre, salt, sugars and saturated fat on 7-day averages, the day shown.
- Distribution gets a score of its own: protein spread, peri-workout
  coverage, energy after 21:00.
- A regularity note, never red.
- Pros: matches the developer's question ("can I eat a bit less after a big day?").
- Cons: the most work in the phase. Scores change meaning.

#### B. Day-only scores, as now, plus distribution

## Decision
**A, A, A, A.** The details:
- **Two new tables:**
  - `day_programs` is 1:1 with a day type. It holds the usual training time
    (minutes after midnight, optional) and the shift (± kcal, −1,000 to
    +1,000, default 0). One table instead of a table per field: both are
    per type, with nothing per day.
  - `day_program_slots` holds the type's slots: position, kind (a moment),
    time, and optional shares of kcal and protein (0–1).
- **Slots are a template, read live.** They give empty places, times and
  hints; they are not a record. What happened stays on the entries
  (moment and time, ADR-0011), so editing a type rewrites no past day.
  A type without slots shows the day as now.
- **Moments** gain `pre_workout`, `post_workout` and `pre_sleep`, on
  `log_entries.moment` and `meals.category`. Widening a CHECK is safe
  only if migrate runs first, and the CI gate enforces that. `momentAt`
  never derives them from a time: only a slot or the user picks them.
- **The shift (PR 3):** a check-in gives each of its 7 days the week's
  average + the day's shift − the mean shift of those 7 days. The days'
  types come from their copies, the program and overrides. The total stays
  the same.

## Consequences
- One migration (0032): the two new tables and the two CHECKs widened.
- About 3 PRs:
  1. slots, training time and shift, with the editor (migration 0032);
  2. Today grouped by slots, with peri-workout hints;
  3. the shift in the check-in, and scores in time context.
- Starter programs: rest day, gym day (morning), gym day (evening), long
  cardio.
- E11–E12 close here: the fat floor at 20 % / 0.6 g/kg, fibre quality, salt
  made visible. E10 was closed by ADR-0040.

## What I learned
