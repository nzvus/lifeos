# v2 — Screens

Few generic screens driven by kinds, catalogs and metrics. Specialised
screens only where `concepts.md` says the generic model is not enough.
The design boards (Design artifact "lifeos v2") draw them at 360 and
412 px.

## Navigation

Bottom bar on phones, header on desktop:
**Today · Plan · ⊕ Capture · Review · Trackers**. Settings (gear) in the
header.
- Navigation is by **time**: Today, Plan, Review. The domains live in
  Trackers.
- ⊕ is the one way to add anything.
- Every view keeps a URL (`/day/2026-10-15?filter=food`,
  `/review?metric=…&range=…`), as in v1.

## The screens

| Id | Screen | What it does |
|---|---|---|
| V-01 | **Day** (Today and any day) | **Header:** date, week strip, month calendar, swipe between days; the day card with the scores that apply (targets, food quality, recovery, habits) and the goal line. **Body:** one timeline: planned blocks, done entries, sessions, sleep (wake and bed), habits due, money, journal, "now", the closure; filter chips by domain. **Rows:** compact (slim coloured time rail; label; key numbers; full-width strip), tap to open in levels; tick planned ↔ done, skip, swipe to delete with Undo. **Gaps:** an empty block offers its "+" with sensible defaults. |
| V-02 | **Capture ⊕** | One search over kinds, catalog items and recent entries ("acqua 500", "panca", "caffè"); pinned and recent kinds as big buttons; a voice-to-text field (later); hands off to the entry sheet or a specialised editor; a time chip (now / planned at / earlier at). |
| V-03 | **Entry sheet** | The form generated from the kind: fields with steppers, scales, choices, durations and timers; status and time; parent and links; note; relation tags shown read-only; "new from this" for catalog-backed entries. |
| V-04 | **Food composer** (specialised) | Lines from the food catalog (search ranked by use and fit to the slot); scan (camera with focus, from a photo); estimate (typed totals); servings; live preview against the slot and the day; meal role; the relation tags it will get. |
| V-05 | **Gym mode** (specialised) | Auto/manual toggle, setup delay, rests by evidence and between sides, loads typed as lifted, RIR after the exercise, e1RM(RIR) % with its context, incoherence flags, session-wide targets, editable times as a chain, wake lock. |
| V-06 | **Tracker page** (any kind) | This week vs the last, a chart of its main metric with goal lines, the list of its entries, its goals, its routines/recurrence, its relations ("after training", "before bed"), the kind's settings (fields, units, targets). The Body, Sleep, Mind, Water, Habit and Money "pages" are this screen. |
| V-07 | **Catalog page** (any catalog) | List with instant search, sort by any field alone or per another (v1's metrics), filters; item page and editor ("new from…", merge duplicates); products under their food; recipes with their parts. |
| V-08 | **Plan** | Calendar (week/month) of planned entries; day templates (blocks with absolute or relative times, shares, extends); week layout; habits (routines with recurrence); training cycles (programs: order, skips, overrides); swap a day's template. |
| V-09 | **Goals** | Every goal with progress, pace needed vs actual, ETA, on track; editor: pick a metric, the target, the date (the app derives the pace and explains, memory: ask-human-inputs). |
| V-10 | **Review** | A range picker; per domain a generic dashboard of its metrics; any metric vs any other; scores with their parts; correlations (n, effect, interval); data quality (E9: gaps, duplicates, implausible values, flagged loads). |
| V-11 | **Money** (tracker page + specialised parts) | Month overview: pace vs last month, categories, shops, accounts and balances; movements; receipt review line by line. |
| V-12 | **Pantry** (catalog page + specialised parts) | Products with stock, best-before, location; use-first; the shopping list from minimums. |
| V-13 | **Scan** (specialised) | Barcode, receipt, label: camera with focus, torch, from a photo; field-by-field confirmation next to the photo. |
| V-14 | **Settings** | Account, display, body, day boundary, time zone, language; Trackers (make your own kind); Data: download JSON / CSV, replace, merge (ADR-0052); packs; trash; invitations. |
| V-15 | **Sign-in / sign-up** | As v1 (Better Auth, invitations). |
| V-16 | **Come valutiamo** | One page per scoring model (E7): its parts with weight sliders bounded by their allowed range, locked limits with a lock, the "why" and the sources of each part, version and date, and a live preview on a real meal or day. |

## Every v1 screen id → its v2 screen

| v1 id | v2 | Notes |
|---|---|---|
| S-T01 day navigation | V-01 | |
| S-T02 day card, goal line, "how this number is built" | V-01, V-09 | the deficit pencil goes (goals own it) |
| S-T03 score row | V-01 | scores split (targets, quality, recovery) |
| S-T04 chips (sleep, movement, mood, closure) | V-01 | they become entries on the timeline; the closure stays as a row |
| S-T05 day type / program picker | V-01, V-08 | "swap template" |
| S-T06 weekly check-in card | V-09 | a weekly review of the expenditure, optional |
| S-T07 the day with the plan totals | V-01, V-10 | inside the day card's detail |
| S-T08 timeline | V-01 | plus filters |
| S-T09 slot rows, suggestions | V-01, V-04 | blocks |
| S-T10 entry row (tick, −/+, eye, refresh, delete) | V-01 | compact layered row |
| S-T11 open row (lines in place, time, quality) | V-01, V-04 | |
| S-T12 remove what's still planned | V-01 | |
| S-T13 copy yesterday | V-01, V-08 | also "apply yesterday's template" |
| S-T14 future days planned only | V-01 | rule in E1 |
| S-T15 pantry reminders | V-01 (chores due), V-12 | |
| S-T16 day quality panel | V-10 | |
| S-T17 this week | V-01 (day card), V-10 | |
| S-T18 energy and calibration | V-06 (Body), V-10 | learnt expenditure, no accept step |
| S-T19 training on this day | V-01 | sessions on the timeline |
| S-T20 the program's day | V-01, V-08 | training block from the cycle |
| S-T21 supplements | V-01, V-06 | doses on the timeline, curve |
| S-T22 add food | V-02, V-04 | |
| S-T23 add training | V-02, V-05 | |
| S-T24 movement | V-02, V-03 | steps and on-your-feet kinds |
| S-T25 sleep | V-02, V-03 | also wake/bed taps |
| S-T26 weight | V-02, V-03 | |
| S-T27 mood | V-02, V-03 | with a moment |
| S-T28 close the day | V-01 | |
| S-T29 spending | V-02, V-03 | |
| S-F01 meals | V-07 | recipes |
| S-F02 meal editor | V-07 | |
| S-F03 ingredients | V-07 | foods |
| S-F04 ingredient editor (label, OFF, OCR, impact) | V-07, V-13 | |
| S-F05 pantry | V-12 | |
| S-F06 trends | V-10 | |
| S-F07 day types and programs | V-08 | templates |
| S-B01 plan calendar, programs | V-08 | |
| S-B02 program editor | V-08 | cycle |
| S-B03 routines | V-07 | routine catalog |
| S-B04 exercises, merge, guide | V-07 | |
| S-B05 session editor | V-03, V-05 | |
| S-B06 gym mode | V-05 | |
| S-B07 progress, weight | V-06, V-10 | |
| S-M01 money overview | V-11 | |
| S-M02 movements | V-11, V-03 | |
| S-M03 receipts | V-11, V-13 | |
| S-N01 mind | V-06 (check-in tracker), V-03 | |
| S-S01 S-S02 S-S03 S-S04 S-S05 S-S06 S-S07 S-S08 S-S09 S-S10 settings | V-14 | goal moves to V-09; the assistant key only while it is parked |
| S-A01 assistant | dropped for now | parked since 2026-10-09; it can come back as a capture mode (V-02) |
| S-U01 sign-in / sign-up | V-15 | |

## Shared rules of the interface (the developer, 2026-10-15)

- **One nutrient element, everywhere.** Every place that shows nutrients
  uses the same component (board "Componente · Nutrienti") in one of three
  sizes:
  - `card`: the day; kcal, then protein, carbs, fat and fibre as
    accordions, micronutrients, and the limits;
  - `row`: four bars with value and target (a meal against its block, a
    week's averages);
  - `mini`: four small columns (a food line, a meal on the timeline, a
    suggestion), each bar a share of the day's target.
- **The same information in every size.**
  - Each macro's bar is split by kind:
    - protein: animal / plant;
    - carbs: starch and other / sugars (added / natural with the v2
      catalogue);
    - fat: unsaturated / saturated (mono / poly / omega-3 with the
      catalogue);
    - fibre: insoluble, resistant starch, β-glucan, pectin, inulin/FOS,
      GOS, untyped.
  - A kind's shade is fixed by kind, never by position, so β-glucan
    looks the same in every meal.
  - Planned amounts are hatched.
  - The target is a mark that moves with the scale.
- **Icons over words.** Every row, chip, tile and field leads with its
  icon (lucide-style strokes, coloured by its identity hue); text is
  short and secondary.
- **Motion that explains.** Bars grow on load; accordions and the time
  rail animate open and closed; everything is off with
  `prefers-reduced-motion`.
- **The time rail.** On the day, collapsed: a 20 px coloured rail with
  vertical times. Expanded: 64 px with horizontal times and icons, while
  the secondary details on the right shrink away.

### The timeline box grammar (2026-10-15, revised)
- **A silhouette per family**, drawn as a mask that holds at any height,
  with the outline drawn around the mask:
  - meal: a plate with an inner rim;
  - training: a ticket with two side notches;
  - sleep: a soft box with a crescent bite;
  - body: a tag with a point and a hole;
  - money: a receipt, toothed top and bottom;
  - mind and journal: a speech bubble with a tail;
  - habit: a pill;
  - water: a squashed drop.
- **The subcategory bends the family's silhouette**, never replaces it:
  breakfast a bowl (rounded bottom), snack a bitten corner, dinner a
  double rim; cardio an arrow-ended ticket; waking a rising arc. New
  subcategories get a variant only when they are told apart often.
- **A drawing on the left**: the entry's own icon, large, rotated and at
  ~9 % opacity, so the text stays legible. It is clipped by the box's
  silhouette, never drawn outside it.
- **The drawing moves with the box's state**, each family its own way:
  compact → times shown → details open. Plate turns, dumbbell lifts,
  moon swings and sets, scale needle tips, drop falls. Off with
  `prefers-reduced-motion`. Every place that reuses the box reuses the
  motion.
- **Planned** entries get a fainter outline and a light hatch.
- **The score as a criterion skyline** behind the right ~46 % of the box:
  - one column per criterion, in the model's fixed order;
  - each column as wide as its weight and filled up to its score;
  - hard edges between columns;
  - a dashed line at the "met" threshold (70).
  The legend says it in words: "colonna larga quanto il peso, piena
  quanto il voto".
- **Opened**, each criterion shows ✓ / ◐ / ○, its weight, a bar with the
  same threshold and its number, in the same order as the columns.
- **Text** stays on the light left side. The aria-label lists every
  criterion.
- **The same box** in the compact (time rail) and the extended view, and
  the same numbers as every aggregate. The composer's meal score uses the
  same skyline.
- **Everywhere a score appears**, the skyline is its picture: each
  weighing on the tracker page, the session panel in the gym, "Voti
  della settimana" on Review (one row per family), and V-16, which has
  one tab per model (meal, weighing, water) and a context panel saying
  what moved the number.

### Nutrients and environment on the day
- The nutrient component's bars use the kinds of `kinds.md`. Opened:
  - the kinds;
  - the food groups;
  - the foods;
  - leucine per meal, omega-3, glycaemic load.
- Icons:
  - protein: a flexed biceps;
  - fat: a nut;
  - carbs: wheat;
  - fibre: a leaf;
  - water: the drop, and water only.
- Caffeine and creatine sit in "other".
- **An environment strip** under the date: temperature, humidity, air
  quality, daylight, as icons. The water row says the day's need and why.
