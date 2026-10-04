# ADR-0039: Drinks and supplements are ingredients with active compounds; their levels are estimated

**Status:** accepted (ADR-0038 chose "supplements as food"; the developer delegated the rest, 2026-10-04)
**Date:** 2026-10-04

## Context
The developer wants caffeine (coffee, energy drinks) and creatine counted:
day, week and month, in training and in progress, as estimated levels in
the body. ADR-0038 already decided they are logged like food. What is left
to decide: where the compounds live, and how levels are estimated.

## Options considered
### Where the compounds live
- **A. A table of compounds per ingredient** (`ingredient_compounds`),
  read through the ingredient a log line points to.
  - Pros: no change to the log; a can of Red Bull does not change its
    caffeine.
  - Cons: not a snapshot (ADR-0007). Changing a compound later changes past
    days.
- **B. Snapshot them on every log line** (a new column or table filled by
  every logging path).
  - Pros: history frozen like the nutrients.
  - Cons: six logging paths to change, for values that practically never
    change.

### Levels
- **A. Textbook models, labelled as estimates.**
  - Caffeine: one compartment; absorption ka = 4/h (peak in ~45–60 min);
    half-life 5 h. EFSA's 400 mg a day and ~200 mg at once; ~50 mg at
    bedtime as an indicative sleep threshold.
  - Creatine: stores as a 0–1 share. 1/28 a day at ≥ 3 g (in proportion
    below), −1/35 a day without; 3–5 g a day fill in ~4 weeks.
- **B. No levels, only amounts.** Simpler, but the developer asked for
  levels.

## Decision
A and A.
- Compounds are entered on the ingredient's form (mg of caffeine, g of
  creatine per 100 g/ml). A form without these fields leaves them as they
  are.
- The starter pack brings coffees, teas, Red Bull, Monster, Coca-Cola,
  creatine monohydrate and a pre-workout.
- Doses = eaten lines × the compound per 100. Planned food is not taken.
  An entry without a time counts at noon.
- **Where they show:**
  - Today: caffeine against 400 mg, in the body now and at bedtime (the
    last night's bedtime, else 23:00), and creatine's stores;
  - sessions: the levels at their start;
  - Food → Trends: caffeine per day, days over 400, creatine days.

Tripwires:
- compounds edited after logging start to matter (→ B, snapshot them);
- the developer wants personal half-lives (smokers ~3 h, pregnancy or
  some medicines ~10+ h) → a setting.

## Consequences
- Migration 0029: `ingredient_compounds`.
- Pack format: `caffeineMg`, `creatineG` per ingredient.
- Still to do:
  - correlate the levels with session performance in Progress;
  - an "estimated" drink (no ingredient) carries no compounds: log coffee
    as an ingredient.

## What I learned
Not written yet: this section is the developer's own.
