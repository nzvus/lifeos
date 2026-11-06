# 06 — The interface: navigation, Today, shared components

The inventory of every screen is in [06-screens.md](06-screens.md). This
file holds what is wrong with the interface as a whole, and the
proposals. ADRs in force: 0010, 0015, 0019, 0033, 0038, 0050.

## 1. Issues found

**U-1 Today's entry rows waste the phone's width** (considerations.txt,
2026-10-15):
- the time column on the left is wide;
- the multiplier and the bin sit on the macro bar's line and shorten it;
- price, "⋯" and delete sit at the bottom of the open row;
- "⋯" holds one useful action ("update with current values") besides
  delete;
- an open row shows everything at once ("non aprirsi completamente").

**U-2 The panels under the timeline are dispersive** (FEEDBACK 10-11).
Day quality, This week, Energy, Training, Supplements: five shapes, five
places to look, partly repeating the day card. Supplements belongs on the
timeline (02 P-7).

**U-3 The timeline has no filters.** It now shows food, training,
wake/bed, weigh-ins and money. The developer wants "viste filtrate in base
al tipo, o anche tutto", and room for future kinds (habits, routines).

**U-4 Too many ways to draw a nutrient.** `ui/` has MacroBar, MacroGrid
and ConcentricRings with **no users** (dead code), plus MacroPreview,
MacroStrip, NutrientBar, NutrientRow, StatTiles, NovaBar. Plan Phase 6
asked for one `NutrientMeter` on one data shape.

**U-5 Names and URLs don't match the areas.** Food → Trends and Body →
Progress both live at `/profiles` (`?view=`); day types at
`/profiles/[id]`; the Body area is `/training/*`; `/plan` and `/training`
are redirects. A rebuild should name routes after what they show.

**U-6 Charts are split by accident.** Nutrition charts in Food → Trends
(plus a training chart beside them), training and weight charts in Body →
Progress, sleep in Trends, money pace in Money, mind bars in Mind. There
is no "how did this month go" across everything.

**U-7 The Today route holds logic.** `app/(app)/page.tsx` is 733 lines
and assembles quality, burn text, events and scores itself. ADR-0001 says
routes compose only (plan Phase 7).

**U-8 Short tasks are sheets, but long ones still jump pages.** The
entry editor (`/log/[id]`), the session editor and the ingredient editor
leave Today; returning keeps the scroll (ScrollMemory), but the context
is gone.

## 2. Proposals

💡 **P-1 A compact, layered entry row [design].**
- Closed: a slim coloured time rail (vertical, the moment's colour,
  time as small text on the rail), the label, kcal and a full-width
  macro strip.
- Header of the open row: ×servings stepper, price, ↺ ("update with
  current values"), bin. The "⋯" menu goes.
- Body of the open row, in levels: lines (amounts and macros), then on a
  second tap the quality block and the time/moment.
- One open at a time stays.

💡 **P-2 The day is a feed with filters.** Chips over the timeline: All ·
Food · Training · Body · Money · Mind · (later) Habits. Each kind keeps
its icon and colour; the "now" line and the day program's blocks stay in
every filter. Compounds and supplements become entries with their curve
(02 P-7).

💡 **P-3 One day card, one detail page.** The day card keeps kcal,
macros, the goal line and three scores (targets, quality, recovery;
02 P-4, 04 P-2). Each score opens one "Day detail" sheet with tabs
(Nutrition · Energy · Recovery · Week), replacing the five panels. Every
number explains itself the same way ("How this number is built").

💡 **P-4 One nutrient component [decision on design].** `NutrientMeter`
in three sizes on one shape `{ eaten, planned, band, target, state }`
produced by core:
- `inline`: icon and value;
- `row`: name, band bar, status;
- `ring`: the day card.
Delete the three unused components; migrate the others page by page
(plan Phase 6).

💡 **P-5 Routes named after areas [decision, with P-6].**

```
/                 Today
/food             meals · ingredients · pantry           (/food/meals/[id] …)
/body             plan · routines · exercises · body      (/body/sessions/[id]/live …)
/money            overview · movements · receipts
/mind             check-ins · correlations (04 P-4)
/review           how it went: week · month · any range, every area side by side
/settings         … · day templates · data
```

💡 **P-6 A "Review" area for every chart.** One place with the range
picker: nutrition, weight trend, training volume and e1RM, sleep, mind,
spending, adherence, and the personal correlations (04 P-4). Today
links to its week; Food and Body keep only their lists.

💡 **P-7 Editors in sheets where they fit.** The entry editor and a
session's quick edits as full-height sheets over Today; full pages only
for catalog objects (ingredient, meal, routine, program).

💡 **P-8 Routes compose, core computes.** A `core/day/view.ts` builds
everything Today shows (the plan's `dayView()`); the route renders it.
A lint rule caps route size (plan Phase 7).

## 3. What works and must survive a rebuild

- Every view has a URL; back/forward/reload are faithful.
- Optimistic ticks and −/+ (`LiveDay`): numbers redraw in the same frame.
- One edit model everywhere (ADR-0015): ActionBar, drafts, Undo, the
  30-day trash, delete asks.
- Sheets for short tasks, the "+" where the thumb is.
- Colour = state; numbers in ink; planned lighter or dashed.
- 360 px at 120 % text in every theme, checked by `audit:ui`.
- Explanations everywhere ("How this number is built", formulas, reasons
  for each weigh-in's reliability).
