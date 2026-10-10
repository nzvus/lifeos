# ADR-0045: A goal is a kind, a target and a day; the app plans the pace within ranges

**Status:** accepted (the developer's request, 2026-10-10; ranges and details decided by the agent)
**Date:** 2026-10-10
**Amends:** ADR-0043 (how the rate is set)

## Context
ADR-0043 asked for the rate as % of body weight a week. The developer:
*"How would I know how much I lose? At most I'll tell you the target
weight, or in how long I'd like to reach it. Then you should have smart
dynamics with maxima, minima and optimal ranges, for fat loss, muscle
gain, or both: it must be much smarter."*

The evidence gives each kind of goal a useful range:
- **Fat loss.** 0.5–1.0 % of body weight a week keeps lean mass. Athletes
  at 0.7 % kept more than at 1.4 % (Garthe 2011; Helms 2014). Below about
  0.25 %, the change hides in the scale's water.
- **Muscle gain:** about 0.25–0.5 % of body weight a month for
  intermediates, and 1–1.5 % a month for beginners (Iraki 2019). That is
  0.06–0.35 % a week. Above about 0.5 % a week the gain is mostly fat.
  The range 0.1–0.25 % a week sits between the two groups.
- **Recomposition.** Maintenance energy, high protein and training. The
  scale barely moves.

## Options considered
### A. The user picks a kind; target weight and day are optional; the app plans the pace (chosen)
- Pros: the developer's own words. The app can say when a day is
  unrealistic and when the target will really be reached. The pace is
  planned again at each check-in from the current weight, so it follows
  progress.
- Cons: two columns on `goals`, which is a table created on 2026-10-10.
  They are nullable, and the CI gate makes migrate run first.

### B. Keep the % field with presets
- Cons: still asks for a number the developer doesn't know.

## Decision
**A.**
- `goals.kind` is one of lose / gain / recomp / maintain, and
  `goals.target_day` is optional. Both are null on goals from before;
  those keep their stored rate.
- `planGoal(kind, target, day, weight, today)`:

  | kind | range (% a week) | max | without a day |
  | --- | --- | --- | --- |
  | lose | 0.5–1.0 | 1.0 | 0.7 |
  | gain | 0.1–0.25 | 0.5 | 0.15 |
  | recomp, maintain | 0 | — | — |

  - With a day, the rate is what the day needs, kept within min…max:
    - above the max, the status is **fast**: the max is used, and the
      real day is shown;
    - below the optimal range, the status is **slow**: fine, just slower
      than it could be;
    - within ±0.3 kg of the target, the status is **reached**: maintenance.
  - The minimums are 0.25 for lose and 0.05 for gain.
- The stored `rate_pct_week` is the plan on the day the goal is saved, for
  display and for old readers. The engine and the check-in plan the rate
  again for each day, from that day's weight.
- A target the wrong way (losing toward a higher weight) or a day already
  past is refused.
- Picking a kind prefills protein: lose and recomp 2.2 g/kg, gain and
  maintain 1.8 g/kg (of the target weight). It can be changed.

Tripwire: if the planned pace is often "fast" for the developer's real
targets, show the earliest realistic day before saving instead of after.

## Consequences
- Migration 0032 (with ADR-0044's tables) adds `goals.kind` and
  `goals.target_day`, and a CHECK on `kind`.
- Settings asks: what for, target weight, by when. A box explains the
  plan: % a week, kg a week, kcal a day, the range, and when the target
  is reached. The check-in card shows the week's pace.
- New error code `target_direction`.

## What I learned
