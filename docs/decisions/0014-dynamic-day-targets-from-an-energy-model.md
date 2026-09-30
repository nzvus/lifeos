# ADR-0014: A dynamic day type derives targets from an explicit energy model

**Status:** accepted (delegated to the agent by the developer, 2026-10-01)
**Date:** 2026-10-01

## Context
Day types (ADR-0008) hold fixed targets. The developer wants a day type
that sets the targets from what the day actually costs: training (ADR-0005
already estimates each session as a kcal range), how sedentary the rest of
the day was, walking time or steps, and a chosen deficit — so energy
balance and deficit are more reliable. PROJECT.md forbids falsely precise
burn numbers: every estimate is a range. ADR-0008's invariant stands: a past
day's targets must not change because a *definition* changed.

## Options considered
### A. BMR × one activity factor, plus training
- Pros: textbook, one number to choose per day.
- Cons: "sedentary or not", walking and training blur into one multiplier; double counts training if the factor already assumes it.
### B. Components, each estimated and shown
- Pros: BMR (Mifflin-St Jeor) + non-exercise baseline from a declared sedentary level + walking (minutes or steps, MET) + training sessions (their ranges, net of resting) + thermic effect ≈10 %; each part visible and correctable; the inputs are facts of the day, stored, so the result is reproducible.
- Cons: needs profile data (sex, birth year, height) and a small per-day declaration; population equations are ±10–15 % for an individual.
### C. Adaptive: expenditure from weight trend and intake
- Pros: individual, self-correcting; no declarations.
- Cons: needs weeks of consistent logging and weigh-ins before it says anything; useless on day one and for a single day's plan.

## Decision
**B now; C later as a calibration on top** (when enough weigh-ins exist, the
trend corrects B's baseline factor — its own ADR).

Model (core/energy, pure, every figure a low–high range):

- **BMR** — Mifflin-St Jeor from sex, age (birth year), height and the
  weight on that day (`weightAt`, ADR-0005). Missing data → no dynamic
  targets, with a hint saying what is missing (never a guess).
- **Baseline (non-exercise)** — BMR × a factor by the declared level:
  mostly sitting 1.15–1.25, mixed 1.30–1.45, on my feet 1.50–1.65.
- **Walking** — minutes (or steps ÷ 100 per minute) at 3.0–3.8 MET, net of
  the resting MET already in the baseline.
- **Training** — each done session's burn range (ADR-0005), net of one MET
  for its duration (resting is already counted).
- **Thermic effect** — the sum ÷ 0.9 (≈10 % of expenditure).
- **Targets** — energy = midpoint − the profile's deficit (kcal/day);
  protein and fat = g per kg of that day's weight; carbs = the remaining
  energy ÷ 4; fibre = 14 g per 1000 kcal; sugars, saturated fat and salt
  keep the automatic maxima (ADR-0008 era, `withAutoTargets`).

Storage (additive migrations, schema PR merged and applied first):

- `user_settings`: `sex`, `birth_year`, `height_cm` (nullable).
- `day_activity`: one row per (user, day): level, walking minutes, steps.
- `day_profiles`: `mode` ('fixed' | 'dynamic', default fixed), `deficit_kcal`,
  `protein_g_per_kg`, `fat_g_per_kg`; `day_plans` copies them.

A dynamic day's plan copies the *parameters*, not numbers; its targets are
recomputed from that day's stored facts (activity, done sessions, weight).
So ADR-0008's invariant holds for definitions — editing a profile later
never moves a past day — while correcting a past day's facts (a forgotten
walk) deliberately updates its targets.

Tripwires: if B's energy disagrees with the weight trend by more than
~200 kcal/day over 3+ weeks, build C; if the declaration becomes a chore,
default it from the previous day.

## Consequences
- Two schema changes (settings columns + `day_activity` + profile/plan
  columns) in one migration PR before any code reads them.
- The day page gains an "activity" row (level, walking) and shows the
  expenditure range and the day's balance (eaten − expenditure) as a range.
- Export gains the profile data and day activity (next export version).
- Energy estimates are always labelled as estimates, with their parts.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
