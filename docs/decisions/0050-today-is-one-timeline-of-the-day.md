# ADR-0050: Today is one timeline of the day

**Status:** accepted (the developer chose direction A on 2026-10-10: "A mi piace, valuta anche come migliorarla"; refinements decided by the agent)
**Date:** 2026-10-10
**Amends:** ADR-0033 and ADR-0038 (Today's views), ADR-0044 (slots on Today)

## Context
The developer: *"When I change anything on Today I don't want to go back
up. Editing shouldn't be a page of its own. The design should make it
more intuitive what you can do. The mini panels should be unified,
homogeneous, coherent, redone from scratch."*

Today has three views (Summary, Food, Training) and about a dozen panels,
each with its own shape. Food is a list of moment groups. Editing an
entry opens a page. Slots (ADR-0044) and the training session are shown
in different places.

The mockups are in the "lifeos — Oggi rifatta" design canvas (artboards
A, A2, A2-edit). The developer picked A over B (uniform panels in tabs)
and C (the score and fibre detail, to be built on top of either).

## Options considered
- **A. One timeline** (chosen): the day as a vertical line of its slots,
  entries and training, with a "now" line.
- **B. Keep the three views, uniform panels.**
- **C. Keep as is.**

## Decision
**A**, refined (A2):
1. **The top of the page:**
   - date and week strip;
   - one day card: kcal left as a ring, protein, carbs and fat as bars,
     and the goal line with "How this number is built";
   - one score row: today's score, the week's score, the one thing to
     improve; it opens the score page (C, later);
   - the chips: sleep, movement, mood, close the day.
2. **The timeline.** Time on the left, a rail with a dot per item, the
   content on the right. Slots, entries without a slot (at their time)
   and training sessions sit in time order.
   - A **"now" line** on today.
   - Each slot shows its eaten kcal against its share as a thin bar.
   - An empty slot in the past is dimmed ("skipped?"); an empty future
     slot shows its hint and "+ Add".
   - Planned entries are dashed.
3. **One entry open at a time**, in place:
   - the tick, servings −/+, time, moment as chips;
   - "Ingredients and quantities" (the existing page) and delete.
   - Everything saves as it changes, and the page never moves.
4. **"+ Add" on a slot** opens the add sheet with that slot's moment and
   time set. It is planned when the time is still to come. It suggests
   the user's own meals that fit the slot: high in carbs before
   training, high in protein after it and before sleep.
5. **A compact header** sticks while scrolling: date, kcal left, P/C/F bars.
6. **Panels below the timeline** keep one shape: title, one number, one
   sentence, one action. The day's nutrients use one meter (the plan's
   `NutrientMeter`). The detail panels live in collapsibles below,
   closed by default: energy, day quality, supplements, This week.
7. **Days without a program:** the timeline uses the moments at their
   usual times (the moment bounds) as slots without shares.

Tripwire: if the developer still looks for "the Food tab", keep a
filter ("only food") on the timeline rather than bring the tab back.

## Consequences
- About 4 PRs, no migration:
  1. the timeline: `core/day/timeline.ts` (pure: slots, entries,
     sessions, now) and `features/nutrition/log/DayTimeline`; it replaces
     the Food view's list;
  2. entries edited in place (one open), and "+ Add" on a slot with the
     slot set;
  3. one page: Summary and Food merge into the timeline page, with the
     compact header and Training as a session block (gym mode stays its
     own screen);
  4. one `NutrientMeter` and one panel shape; the score row; suggestions
     per slot.
- Phase 5 (fibre types and micronutrients in grams) comes before the
  score page (C), which needs them.

## What I learned
