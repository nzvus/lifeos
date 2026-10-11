# ADR-0051: Steps count from zero; the day's level is time on your feet

**Status:** accepted (decided by the agent, delegated 2026-10-11)
**Date:** 2026-10-11

## Context
The developer's report of 2026-10-11: "mostly sitting + 7,500 steps" came out
about 100 kcal below "mixed" with 3,000 steps. ADR-0032's model counted the
level twice: its factor (1.15–1.25 / 1.30–1.45 / 1.50–1.65 × BMR) carried both
posture and a usual step count (5,000 / 7,500 / 10,000), so one level apart
was ≈ 0.175 × BMR ≈ 310 kcal, while the 2,500 steps it stood for are worth
≈ 75 kcal at the model's own cost per step.

## Options considered
### A. Keep ADR-0032, retune the factors
- Pros: no other change.
- Cons: the level still hides steps; any factor gap that is not exactly the
  steps' cost repeats the inconsistency.
### B. Level = time on your feet only; every step counted from zero
- Pros: one meaning per input; steps are linear and the same everywhere; no
  schema change (the level enum stays, relabelled ~2 / ~5 / ~8 h on your
  feet); days without steps keep the level's usual steps as the estimate.
- Cons: totals move (sitting days without steps ≈ +150 kcal); a calibration
  learnt on the old model is off until re-proposed.
### C. A continuous model with standing hours as a number
- Pros: the most precise input.
- Cons: a new field and migration; one more thing to log each day.

## Decision
B. The factors without walking: sitting 1.15–1.25, mixed 1.20–1.32, on your
feet 1.27–1.42 × BMR (≈ +0.5 kcal/min on your feet over sitting, Levine's
NEAT studies); walking at 100 steps/min, 3.0–3.8 MET net of rest (as before,
ADR-0032). At the usual steps the totals stay inside the FAO/WHO PAL bands
(≈ 1.28 / 1.39 / 1.51). Tripwire: the calibration (ADR-0020) proposing a
factor outside 0.9–1.1 for several weeks.

## Consequences
- Dynamic days recompute on read: past days move with the new model.
- Weeks already frozen by the check-in (ADR-0043) keep their numbers.
- The accepted calibration factor was learnt on the old model: the next
  proposal is computed on the new one; accept it again.
- C stays possible later (a standing-hours field would replace the level).
- 2026-10-11 review: the day's weight in the energy engine (BMR, steps,
  the goal's pace, calibration) is the trend weight (`trendWeightAt`, the
  Weigh-ins page's smoothing), not the last weigh-in, so one heavy morning
  doesn't move the day's deficit. The goal line shows the pace planned for
  that day, the same the numbers use.

## What I learned
<to be written by the developer>
