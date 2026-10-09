# ADR-0040: One engine resolves a day's targets everywhere; carbs take the rest of the energy

**Status:** accepted (refactor plan of 2026-10-09, Phase 1; the developer accepted the plan's recommendations and delegated the details: "procediamo", "come vuoi tu")
**Date:** 2026-10-09

## Context
A day's targets were assembled in four places: the day page, the week
strip and the Plan's outlook (`outlook.ts`, twice), Settings' day-type list,
and the assistant's `get_targets`. Each had its own inputs. The week strip
ignored the program's slot while the day page counted it. The page measured
the training load from the sessions' minutes, the others from the energy
model's inputs. Trends read the day's stored copy, which for a dynamic day
holds parameters, not numbers, so a dynamic day showed no energy or protein
target there at all. The developer: "the numbers diverge".

Separately, ADR-0023/0025 used the carbs' "useful maximum" (3 g/kg on a
rest day) as a ceiling on the *target*. When the energy left over was more
than that, it went to fat up to 35 % and the kcal target was silently cut.
For the developer (76 kg, a rest day with 12,000 steps) that gave 104 g of
fat, 37 % of 2,516 kcal instead of 2,687. Carbs above the training band are
not harmful; they are just not *needed* for training.

## Options considered
### Where a day is resolved
- **A. One module, `core/day/`**: a pure `resolveDay(plan, energy, options)`
  and one repository that gathers any range of days with range queries.
  Every consumer calls it.
  - Pros: one number per day on every screen, by construction; one place to test.
  - Cons: touches every consumer at once.
- **B. Fix each of the four sites to agree.**
  - Pros: smaller diffs.
  - Cons: they drift again. That is how they diverged.

### What happens to energy above the carbs band
- **A. Carbs take the rest.** Fat = max(the type's g/kg, 25 % of kcal);
  protein as chosen; carbs = the rest. The carbs band's top extends to the
  day's target, so a target is never "past the zone".
- **B. Keep the cap** and move the excess to fat (as before).
- **C. Lower the kcal target** to what the capped macros reach.

## Decision
**A and A.**
- One engine makes "the same day, the same numbers" a property of the code,
  not something to remember.
- Carbs are the macro with no health maximum, and the one that fuels
  training. Moving surplus energy to fat raised it past what the developer
  wanted. Cutting kcal broke the asked-for deficit (the 2026-10-04 bug).

Tripwire: if days with very high expenditure and little training push carbs
above ~8 g/kg in practice, revisit the split for those days.

## Consequences
- `core/day/` owns `resolveDay` and `getDays`. `getDayEnergy` becomes the
  one-day case of `getEnergyRange` (range queries), so a day computed alone
  or within a week is the same day.
- `outlook.kcalTargets` and `dynamicTargetsToday`'s own arithmetic are gone.
  The day page, the outlook, Settings, the assistant and Trends call the
  engine.
- Trends shows dynamic days' targets (computed on read).
- Dynamic targets still follow later corrections of their inputs (a
  forgotten session logged the next day). Their *parameters* are what the
  day keeps (ADR-0008/0014). Freezing computed numbers comes with the weekly
  check-in (plan, Phase 2).
- Amends ADR-0023/0025: the carbs band stays as information and is drawn up
  to the day's target.

## What I learned
