# ADR-0016: Training can be logged as an estimate, like a meal

**Status:** accepted (delegated to the agent by the developer, 2026-10-01)
**Date:** 2026-10-01

## Context
The developer (2026-10-01): on the day page, training should be added the
way food is: from a routine, as a single exercise, or as an "undefined"
session (a name, a description, how long, roughly how many kcal, roughly
which muscle groups). Today a session is a list of exercises with typed
sets (ADR-0005); something that isn't a list of sets cannot be logged:
- a football match, a hike, a swim, an hour of moving furniture;
- a gym session whose details were not written down.

Food already has this: estimated meals (ADR-0009), totals without
ingredients. The estimate matters beyond the log. The dynamic day
(ADR-0014) builds the day's energy from the recorded training, so a
session that cannot be recorded leaves the target wrong. PROJECT.md:
burn is always a range, never a falsely precise number.

"From a routine" and "a single exercise" need no decision: a single
exercise is a session with one exercise; both are UI on the day page.

## Options considered
### A. An estimated session is a session without exercises
- New nullable columns on `training_sessions`:
  - `intensity` (light / moderate / vigorous);
  - `kcal_estimate` (what the user says, optional);
  - `muscle_groups` (anatomy.ts keys, like an exercise's).
- **Burn:** with a duration, intensity sets the MET band (Compendium:
  light 2.5–3.5, moderate 3.5–6, vigorous 6–9) × weight × hours. A kcal
  figure from the user becomes that figure ±15 %. It is always a range.
- **Pros:** one concept: it shows wherever sessions show (day page, week,
  routines, dynamic day), with no second list to merge. Mirrors estimated
  meals. Gym mode, presets and exercises are untouched.
- **Cons:**
  - a session can now be one of two shapes, so code that walks exercises
    must handle none (most already does: tonnage 0, no sets);
  - weekly sets per muscle group can't count it, because it has no sets.
    Its groups show as tags instead.
### B. A generic "activity" exercise kind
- A fourth exercise kind, `activity`, with a MET band. The undefined
  session is one exercise ("Football") with one set holding the duration;
  its muscle groups are the exercise's.
- **Pros:** no session columns; a repeated activity (weekly football) is
  an exercise with history.
- **Cons:**
  - one-off things ("moved furniture") become exercises that clutter the
    list;
  - a kcal figure has nowhere to live without a set column;
  - set validation and gym mode need a fourth kind.
### C. A separate `activities` table
- Its own rows (day, name, minutes, intensity, kcal, groups), next to
  sessions and to ADR-0014's `day_activity`.
- **Pros:** sessions stay pure lists of sets.
- **Cons:**
  - every place that shows or sums training reads two tables: the day,
    the week, Targets' training per day, the dynamic day, the export;
  - two "add training" paths;
  - the most code for the same result.

## Decision
**A** (delegated: "decidi tu"). It is the meals'
pattern, already known; everything that sums sessions sees it for free.

## Consequences
- A migration PR first (three nullable columns, safe in any merge order).
- core:
  - `burnRange` handles a session without exercises (intensity × minutes,
    or kcal ±15 %);
  - validation: an estimate needs a duration or a kcal figure.
- The day page gets "Add training", like "Add to day": tabs **Routine** /
  **Exercise** / **Estimate**; Estimate asks for the name, minutes,
  intensity, optional kcal, muscle groups (chips) and notes.
- The Training page shows estimated sessions with their groups as chips
  and an "estimate" mark. Weekly set counts leave them out, and say so.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
