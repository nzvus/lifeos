# ADR-0021: The energy model counts digestion, everyday steps and gym rests once

**Status:** accepted (agent's correction after the developer found the estimate "really exaggerated", 2026-10-01; constants in pure code, cheap to reverse). Amends ADR-0014's model B.
**Date:** 2026-10-01

## Context
A recomposition day showed a dynamic target of 3104 kcal, so about 3300 kcal
spent: far above what a trained adult of normal size spends on a gym day
(≈2600–2900). ADR-0014's model B added three things that were already
counted:
1. **Digestion:** the sum was divided by 0.9 (+11 %). The activity factors
   (1.15–1.65) are measured total expenditure ÷ BMR (doubly labelled water),
   so they already contain the thermic effect of food.
2. **Steps:** all steps counted as walking on top of the everyday level, but
   a "mixed" or "on my feet" day is mostly those steps. The phone counts
   every step of the day, not only a deliberate walk.
3. **Gym time:** strength minutes at 3.5–6 MET for the whole session. 6.0 is
   the Compendium's continuous vigorous lifting; a session with rests
   between sets is 3.5–5.

Worked example: 80 kg, BMR 1780, "mixed", 75 min of gym, 9000 steps.
Old: (2314–2581 + 240–336 + 250–500) ÷ 0.9 = 3116–3797 (midpoint 3456).
New: 2314–2581 + 40–56 (1500 steps beyond 7500) + 250–400 = 2604–3037 (midpoint 2820), 18 % lower.

## Options considered
### A. Fix the three double counts
- Pros: each part stays visible and explainable; it moves toward the textbook
  estimates; calibration (ADR-0020) corrects what is left.
- Cons: the levels' step counts (5000 / 7500 / 10 000, Tudor-Locke's bands)
  are population figures too.
### B. Leave the model and rely on calibration
- Pros: no change.
- Cons: the correction is capped at ±20 % on the baseline only, and takes
  four weeks of data; until then, the targets push toward a surplus.

## Decision
**A.** No separate digestion term. Steps count only beyond the level's own
(sitting 5000, mixed 7500, on my feet 10 000); a declared walk counts in full.
Strength time is 3.5–5 MET.
Tripwire: if calibration keeps proposing more than ×1.10 with good data,
the model now underestimates, so revisit the levels' factors.

## Consequences
- Every dynamic target drops, by about 10–20 % on active days.
- The Energy section loses its "Digestion" row.
- Session burns (training pages, the week summary) drop at the high end.
- Calibration puts the whole gap on the baseline, because there is no ÷0.9 any more.

## What I learned
