# ADR-0023: Each macro has a floor, a good zone and a ceiling, from body weight and training

**Status:** accepted (the developer chose the recommended option, 2026-10-01)
**Date:** 2026-10-01

## Context
Targets are single numbers, and the day score rewards reaching them. More is
not better beyond a point: protein above ≈2.2 g/kg adds nothing for muscle,
carbohydrate needs depend on training, and fat has a floor for hormones.
The developer wants dynamic lower and upper limits and a "good spot" for
every macro, and a day quality that reflects them.

## Options considered
### A. Per kg, by training load (ISSN / ACSM position stands)
- Protein: floor 1.2, good 1.6–2.2, ceiling 2.6 g/kg (higher on a cut).
- Fat: floor 0.6 g/kg, good 0.8–1.0 g/kg, ceiling 35 % of kcal.
- Carbs: rest day 2–3, training day 3–5 g/kg (5–7 for long endurance), ceiling ≈8 g/kg.
- Fibre ≥14 g/1000 kcal; sugars, saturated fat and salt stay limits.
- Pros: tied to the body and the day; evidence based. Cons: population figures.
### B. Percent of kcal
- Pros: simple. Cons: ignores weight and training.
### C. User-typed bands
- Pros: full control. Cons: no guidance; easy to set badly.

## Decision
**A.** Bands are computed in core from weight, the day's training (done +
planned) and the goal; the dynamic target sits inside the good zone. The day
score gives full marks inside the zone, less between it and the floor or
ceiling, and less again outside them.
Tripwire: if the developer overrides the bands often, add C's fields.

## Consequences
- core/nutrition gains `macroBands`; bars show the zone instead of a single mark.
- dayScore is rewritten around zones (its tests change).

## What I learned
