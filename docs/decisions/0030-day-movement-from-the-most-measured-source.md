# ADR-0030: The day's movement comes from the most measured source; the others are filled in

**Status:** superseded by ADR-0032 (accepted 2026-10-02; replaced the same day: one step was worth four different amounts)
**Date:** 2026-10-02

## Context
A day's movement outside training can be given three ways: a level
(sitting, mixed, on my feet), minutes of deliberate walking, and the day's
steps. ADR-0021 counts the level always, a declared walk in full, and steps
only beyond what the level includes, taking the larger of walk and steps.
The developer asked whether the three should exclude each other or all
count, filling in what is missing. Device steps also include a run's steps,
so a run was counted twice: once as a session, once as walking.

## Options considered
### A. One source per day
- Pros: simplest, nothing counted twice.
- Cons: "on my feet at work + a 30-minute walk" can't be said.
### B. All three, the most measured one wins and fills in the others
- Pros: give what you have; nothing lost; nothing counted twice; the
  screen says where each number comes from.
- Cons: a little more logic to explain.
### C. All three combined with weights, learned per user
- Pros: uses everything.
- Cons: falsely precise (PROJECT.md). The personal correction already
  exists: calibration on the weight trend (ADR-0020).

## Decision
**B.** Device steps > walking minutes > declared level.
- **Steps given:** subtract the steps of the day's DONE cardio sessions (a
  run about 160 a minute, faster than 7 km/h; a walk or a slow treadmill
  about 110; a bike none). The remaining steps set the everyday factor by
  linear interpolation between the levels' anchors (5,000 = sitting,
  7,500 = mixed, 10,000 = on my feet; the factor range moves with it).
  Steps beyond 10,000 count as walking, at 100 steps a minute. The
  declared walk is already inside the steps. The level is shown as derived
  from them.
- **Only walking minutes:** the declared level, plus the walk in full.
- **Only the level:** the level.
- **What is filled in:** with steps, the walking minutes beyond 10,000; with
  a level and a walk, the steps they imply. Both are shown as estimates.

Tripwire: if calibration (ADR-0020) keeps proposing more than ×1.10 on days
with steps and less on days without (or the reverse), the anchors are off.
Revisit them.

## Consequences
- No migration: the same three fields of `day_activity`.
- `core/energy` takes the sessions' steps. The formulas on screen say the
  source ("level from 8,200 steps, of which 3,100 in the run").
- Days with steps change: the factor follows the steps instead of the
  declared level. Accepted calibrations stay; they compare like with like
  from now on.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
