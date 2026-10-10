# ADR-0047: A day is read in its week: energy against the week, protein daily, fibre and salt as averages

**Status:** accepted (refactor plan §2.2b; the developer: "procedi", 2026-10-10; details decided by the agent)
**Date:** 2026-10-10

## Context
The developer asked (2026-10-09): *"Is it fine if I eat a bit less after
a bad day or week, or a lot after fasting?"* For energy, yes, within
limits: weight follows the week's balance (Cioffi 2018). For protein,
mostly no. For fibre, salt, sugars and saturated fat, the average is what
matters. The day page judged every day alone.

## Options considered
### A. Change the day's score to weigh the week
- Cons: the same day's score would move as other days change. Hard to read.

### B. A "This week" panel next to the day's own numbers (chosen)
- The day keeps its targets and score. The panel shows:
  - the days before against their targets;
  - what today could eat to bring the week back, if wanted;
  - protein day by day;
  - the week's averages;
  - a note when the days swing a lot.
- Pros: both views, no moralising (MacroFactor re-plans instead of asking
  you to make up). No query: the page already reads the week.

### C. Nothing

## Decision
**B.**
- **The week** is the calendar week, Monday on: the one Today shows and
  the check-in's default.
- **Only logged days count.** An unlogged day is unknown, not a fast.
- **Proposing a day:** its target − the days before's balance ÷ the days
  left. It stays within ±30 % of the day's target and never goes under
  the BMR (the floor).
- **The averages** (fibre, salt, sugars, saturated fat) are over the
  logged days before this one, against their targets. Off-target lines
  are bold, never red.
- **Irregular** means the logged days' standard deviation is above 30 %
  of their mean. It is a note only.

Tripwire: if "to bring the week back" pushes repeated binge–fast cycles in
the data, drop the proposal and keep only the balance.

## Consequences
- `core/nutrition/week.ts` (pure, tested).
- `WeekContextCard` on Today → Summary, for today and past days.
- `page.tsx` moved its burn words to `day-week.ts` (800-line limit).
- E11 was already closed: the fat floor is 0.6 g/kg and 20 %, the split
  by goal (ADR-0045). Salt is now visible as the week's average. A fibre
  quality view (inulin and other sources) stays in the backlog.

## What I learned
