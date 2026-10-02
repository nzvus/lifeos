# ADR-0032: Steps adjust the day type up or down, at one cost per step

**Status:** accepted (the developer found ADR-0030's logic unclear and its numbers off; the agent decided the fix as delegated, 2026-10-02). Supersedes ADR-0030.
**Date:** 2026-10-02

## Context
ADR-0030 let device steps decide: the everyday factor was interpolated
between the levels' anchors (5,000 / 7,500 / 10,000 steps), and steps
beyond 10,000 were walking. In practice:
- **One step was worth four different amounts.** For 78 kg (BMR ≈ 1,760),
  going from 5,000 to 7,500 steps moved the factor from sitting to mixed,
  about +310 kcal, or 0.12 kcal a step. From 12,500 to 15,000 steps it was
  walking, about +80 kcal, or 0.03 kcal a step. The levels' factors measure
  much more than steps (posture, a job on one's feet, house chores), so
  reading them as steps overvalued the steps in between.
- **The declared day type vanished** as soon as steps were given, even
  though it describes what steps don't count (standing at work).
- **The screen could not say it simply.** The developer found neither the
  logic nor the numbers convincing.

## Options considered
### A. The day type describes the rest of the day; steps correct it at one cost
- The day type (sitting / mixed / on my feet) always sets the everyday
  factor, and already includes that type's usual steps (5,000 / 7,500 /
  10,000).
- The day's real steps, minus a run's steps, move the total up OR down from
  those usual steps, at one cost per step: walking's 3.0–3.8 MET net of
  resting, at 100 steps a minute (≈ 0.026–0.036 kcal a step for 78 kg).
- Without steps, the minutes of walking stand for their steps (100 a
  minute) on top of the usual ones. With neither, the day type alone.
- Pros: every step costs the same; the day type keeps its meaning; one
  sentence explains it; fewer steps than usual lower the estimate, which
  ADR-0021 never did.
- Cons: a wrong day type still shifts the baseline (as always), and
  calibration is what corrects that (ADR-0020).
### B. Back to ADR-0021
- Steps count only beyond the level's own; a walk counts in full; the
  larger of the two.
- Cons: a quiet day on one's feet is never lowered, and the walk and the
  steps still compete instead of adding up to one thing.
### C. Keep ADR-0030
- Cons: the inconsistency above.

## Decision
**A.** `movementOf` returns the declared level, its factor, and the step
difference (real minus usual; or walk minutes × 100). Energy's
"walking" becomes "steps against the day type": a range that may be
negative. The movement form says it in words: "The day type is the rest of
your day, with its usual steps; your real steps correct it up or down."

Tripwire: if, with good data, calibration keeps proposing a factor far
from 1 on days with many or few steps but not on the others, the cost per
step is off. Revisit the MET range.

## Consequences
- No migration. The formulas on screen: "(12,500 − 7,500 usual for Mixed)
  × 0.026–0.036 = +130–180 kcal".
- Days with steps change again, and are consistent from now on.
- ADR-0030's status: superseded by this ADR.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
