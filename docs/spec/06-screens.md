# 06b — Every screen and what it does (inventory, 2026-10-15)

The complete list of what a person can see and do, screen by screen, as
the app behaves today, including what works well. Rules live in the area
files (01–05); this file says *where* each one is reachable. "Saves
itself" = `ui/useAutoSave`; "with Undo" = the edit model of ADR-0015
(toast with Undo, then the 30-day trash). IDs (S-…) let a rebuild check
it lost nothing.

## Navigation (ADR-0038, 0033)

- Bottom bar on phones, header on md+: **Body · Food · Today (raised,
  centre) · Money · Mind**; Settings (gear) and the Assistant (when
  enabled) in the header.
- Every view has a URL (`?view=`, `?day=`, `?range=`, `#sheet-id`); back,
  forward and bookmarks work; a reload never jumps to today.
- Short tasks open in sheets (`ui/Sheet`, `#id` in the URL); edits of
  whole objects open pages with the pinned ActionBar (↺ / Cancel / Save),
  a browser draft, `?from=` to return.
- Text 120 % and 360 px wide are the design floor (ui-audit runbook);
  five themes, light/dark/system, compact/comfortable density.

## Today — `/` (`app/(app)/page.tsx`, `features/nutrition/log/*`)

**Header**
- S-T01 Day navigation: ‹ › day arrows; the date opens a month calendar
  sheet (`#day-calendar`, Monday first, today in green, "Today"); the week
  strip (Mon–Sun) with each day's kcal bar vs target and "−340"/"+120";
  week arrows or swipe; the chosen day is marked at once (`DayGo`) and
  neighbours prefetched. "Back to today".
- S-T02 Day card: kcal left as a disc, protein / carbs / fat bars; the
  goal line ("Recomposition −0.42 %/week · deficit 351 kcal; eats 2,091 ·
  spends 2,442"); the balance three ways (wanted / with plan / so far);
  "How this number is built" (4 steps, `ExplainDay`); the pencil changes
  the deficit of a dynamic type (legacy path, 01 I-7).
- S-T03 Score row: day quality /100 and the week's average furthest off
  target, linking to the Day quality panel.
- S-T04 Chips: sleep (hours), movement (steps), mood (x/5), day closure
  (complete / something missing) — each opens its sheet.
- S-T05 Day type / day program picker: with several types only; fixed /
  default / none badge without a goal (ADR-0008, 0046).
- S-T06 Weekly check-in card (when the goal has it on and it is due):
  expenditure (learnt or model), next 7 days' targets; Accept / Skip;
  Undo of an accepted one (ADR-0043, 0048).

**"The day with the plan" totals** (`LiveTotals`)
- S-T07 Energy, protein, carbs, sugars, fat, saturated, fibre, salt as
  rows: eaten solid, planned lighter, the band (floor/good/ceiling) and
  the target; colour = state; info tip. Updates instantly on any tick or
  −/+ (optimistic).

**The timeline** (`EntryList`, `core/day/timeline.ts`)
- S-T08 One vertical line in time order: slots of the day program (or
  breakfast/lunch/dinner by default), food groups at their real time
  (planned time until eaten), snacks by their own time, training sessions,
  wake-up ("woke · 7.0 h of sleep"), bedtime, weigh-ins, money movements,
  the "now" line on today, the day's closure at the end.
- S-T09 A slot shows "planned at 08:00", its kcal and protein target
  (share × day), the protein eaten vs share, peri-workout hints; an empty
  past slot shows "skipped?"; its "+" opens the add sheet preset with the
  slot's moment and time (planned if still ahead) and suggests the saved
  meals that fit it best.
- S-T10 An entry row: round tick (planned ↔ eaten), label, time, kcal,
  macro strip, cost, servings −/+ (quarters below 1, halves to 4, then
  whole), an eye that takes a planned entry out of the total (left out),
  "⋯" → update with current values / delete with Undo. One row open at a
  time.
- S-T11 An open row: its ingredients in place (amount eaten including
  the ×, each line's macros; change an amount, remove a line, add an
  ingredient; live totals; kept lines keep logged values, new lines take
  current values, ADR-0022); time and moment edited in place (save
  themselves; empty time clears it); quality block (NOVA bar, protein by
  origin, fibre types, tags, meal rating); a link to the full entry
  editor (`/log/[id]`).
- S-T12 "Remove what's still planned" (≥ 2 planned): one tap, asks
  first, one Undo.
- S-T13 "Copy yesterday" on an empty day.
- S-T14 Future days: only planned entries; no "eaten" (enforced in core).

**Panels** (closed until opened)
- S-T15 Pantry reminders due today (link to the pantry).
- S-T16 Day quality: the score's parts with weights and reasons; fibre by
  type; the score the day reaches if the plan is followed.
- S-T17 This week: balance of the days before, an optional catch-up for
  today (±30 %, ≥ BMR), protein days in zone, 7-day averages of fibre,
  salt, sugars, saturated; a regularity note.
- S-T18 Energy: BMR, everyday, steps, training (done, planned) as
  ranges; total so far / with the plan; eaten / with planned food;
  balance; the formulas with the day's numbers; missing body data named;
  the calibration box (learnt expenditure, σ, last 2 weeks, proposed
  factor with Accept unless the check-in does it).
- S-T19 Training on this day: sessions with status, minutes, working
  sets, tonnage, km, burn range, work by body region; each row opens the
  session; "Start" on a planned one today.
- S-T20 The program's day (active program): its items to plan or start,
  rest day, "late" / "skipped".
- S-T21 Supplements: caffeine today vs 400 mg, in the body now, at
  bedtime vs ~50 mg; creatine today and saturation.

**Sheets from the "+"** (`AddFab`: Food, Training, Movement, Sleep,
Weight, Mood, Spending)
- S-T22 Add food: tabs Meal (search, servings) · Ingredient (search,
  grams) · Estimate (name, kcal required, other nutrients, cost) ·
  Portions (from a cooked batch); live preview (kcal, macros, split);
  planned checkbox and time; moment suggested by the meal's category or
  the time; search ranked by text match then use in the last 60 days;
  "new ingredient" in a quick sheet (8 label values required).
- S-T23 Add training: When (start now today / plan at a time / done →
  editor) then What (a routine at its latest version · one exercise with
  last time's sets · a past session as it was · an estimate).
- S-T24 Movement: steps with +1,000 / +2,500 and their cost shown; time
  on your feet as three choices; walking minutes only without steps;
  saves itself.
- S-T25 Sleep: bedtime, wake time, quality 1–5; saves when both times
  are there; clear.
- S-T26 Weight: weight, body fat, waist; time (now) and fasted / after
  toilet / after training (fasted and toilet pre-ticked before 11:00);
  an implausible weight asks "are you sure?".
- S-T27 Mood: mood, energy, stress (five taps each, tap again to clear),
  note; saves itself.
- S-T28 Close the day: "what I logged is what I ate" / "something is
  missing"; change it later.
- S-T29 Spending: a money movement for this day (see Money).

## Food

- S-F01 Meals `/meals`: cards with per-serving kcal, macros, split bar,
  protein per 100 kcal, cost, uses; instant search; sort by any nutrient
  or cost, alone or per kcal / € / protein / carbs / fat / fibre ("most
  used" default); details disclosure (lines, quality block, rating).
- S-F02 Meal editor `/meals/new`, `/meals/[id]`: name, notes, review,
  category (suggests the moment), lines (searchable picker, most used
  first; grams), ratings per factor; live totals; ActionBar, draft, Save
  with Undo; delete (with Undo) from "⋯".
- S-F03 Ingredients `/ingredients`: list with search and the same
  sorting; derived columns (protein per 100 kcal, price per kg).
- S-F04 Ingredient editor: laid out like a label; 8 values per 100 g/ml,
  unit, description, package price + size (both or none), NOVA, origin,
  fibre types (with explanations), tags with icons, caffeine/creatine;
  "meals that use it" with the % each would change while typing
  (`MealImpact`); barcode (camera or typed) → Open Food Facts prefill;
  label photo → OCR.
- S-F05 Pantry `/pantry`: products with stock and "runs out in N days";
  the shopping list; purchases; counts; batches (cook a meal × N
  portions; eat a portion); reminders (due day, repeat every N days,
  done); quick one-line forms; product editor (name, brand, unit g/ml/
  piece, package size, linked ingredient, shop, barcode, notes).
- S-F06 Trends `/profiles` (Food → Trends): period 7/30/90 days with
  arrows; adherence per nutrient; per day type; eating times (first,
  last, window, energy by part of day); plans never confirmed; energy
  chart with target marks; macros side by side as % of target; limits;
  sleep chart; training chart beside.
- S-F07 Day types `/profiles/new`, `/profiles/[id]`: name, fixed targets
  per nutrient or dynamic parameters (preset maintain/gain/recomp/cut,
  deficit, protein and fat g/kg), make default; the program (training
  time, shift, slots with kind, time, kcal and protein shares; starters
  rest / gym morning / gym evening / long cardio); "Follows your goal"
  when there is one.

## Body (`/training/*`)

- S-B01 Plan `/training/plan`: calendar by week or month, swipe or
  arrows; done / planned / program / rest icons; a day opens a sheet:
  open it, skip a program day, rest, do another day of the cycle, back to
  the cycle, add a routine as planned, remove a planned session (Undo).
  Below: programs with their cycles; the active one's coming days with
  ↑/↓ swaps, a select per day, drag on desktop; changed days marked.
- S-B02 Program editor: name, start day, active, days in order (each a
  list of routines and/or exercises, or a named rest); add, remove, move.
- S-B03 Routines `/training/routines`: list; editor with exercises,
  default sets, reps, kg, rest (also edited in the gym-mode screen in
  "routine" mode); details page.
- S-B04 Exercises `/training/exercises`: list; editor (name, kind,
  pattern, muscle groups in order — the first is main —, equipment,
  unilateral, notes; "suggest from the name"); page with guide, records,
  e1RM chart; merge into another (history moves).
- S-B05 Session `/training/[id]`: editor (name, day, planned/done,
  start, duration, notes, exercises with sets; fields by kind: strength
  reps/kg/load text/approx/warm-up; bodyweight reps/kg; cardio min/km/
  km/h/incline); last time's sets under each exercise; "add set" copies
  the previous one; estimated sessions (name, minutes, intensity, kcal,
  muscle groups).
- S-B06 Gym mode `/training/[id]/live`: the pinned clock (rest countdown
  → overtime → Go → set counting → ✓); unilateral sides; per set:
  tick, steppers for reps and kg (2.5 kg from 20 kg, else 1 kg), RIR
  0/1/2/3/4+ after working sets, warm-up flag, time taken, bin (Undo), %
  vs last time, ↺ to last time's numbers; per exercise: today's target
  and "how to" guide, rest, notes, add set, warm-up ramp, move, remove;
  add an exercise; readiness hint; volume notes; finish (drops undone
  sets, sets the duration); save to the routine; resume after closing.
- S-B07 Progress (`/profiles?view=training|weight`): week summary
  (sessions, sets, kg, kcal vs last week; sets per muscle vs 10–20);
  routines' runs with sparkline; exercises' e1RM trends; weight chart
  (dots by reliability, trend, 7/30-day change, weekly rate), indices
  (BMI, waist-to-height, FFMI), each weigh-in explained in words.

## Money (`/money/*`)

- S-M01 Overview: the month's spent / income / balance, pace vs last
  month (touch to read a day), categories with shares (open their
  movements), top shops, food spending.
- S-M02 Movements: grouped by day with day totals; open one to edit or
  delete (Undo); add from the "+" (spending/income, amount, day,
  category of that kind, shop, method, description, tags).
- S-M03 Receipts: paste the text or photograph it (OCR on the phone);
  lines parsed at once; optional AI pass (assistant on); correct lines,
  link to products (remembered aliases), send to the pantry; save.

## Mind `/mind`

- S-N01 Today's check-in form (as S-T27); the last 30 days as rows of
  three short bars and the note; averages.

## Settings `/settings`

- S-S01 General: time zone (typed with suggestions), language.
- S-S02 Display (per device): theme, light/dark/system, layout, density.
- S-S03 Body: sex, birth year, height.
- S-S04 Goal: kind, target weight, target day, protein, split, floor,
  weekly check-in on/off and weekday; the planned pace explained.
- S-S05 Day types (link), preferences (automatic maxima, moment bounds,
  default views), rating factors.
- S-S06 Your data: download JSON; replace with a file (ADR-0052).
- S-S07 Invitations (admin): create, share once, list, delete.
- S-S08 Packs: add the starter; import a pack file (adds only what is
  missing).
- S-S09 Trash: everything deleted in 30 days; restore; delete for good
  (asks; no Undo).
- S-S10 Assistant key and model (write-only key, last 4 shown); sign out.

## Assistant `/assistant` (off unless `ASSISTANT_ENABLED`)

- S-A01 Conversations; messages with the tools used; each change with
  Undo; deletes/imports wait for Confirm; attachments (photos read on the
  phone by OCR, or sent shrunk; JSON/TXT/CSV/MD); a thinking indicator.

## Sign-in / sign-up

- S-U01 Email + password; sign-up only with `ALLOW_SIGNUP=true` and a
  valid one-use invitation (prefilled from the link); a new account gets
  the starter pack.
