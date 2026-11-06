# v2 — Screens

> **Places superseded by ADR-0059 (2026-10-30):** Corpo · Cibo · Oggi · Mente · Soldi, the same four tabs (Diario · Piano · Elenco · Andamento) everywhere. This file is rewritten in phase 3 of the review; until then the places below are the code's current state, not the target.

Few generic screens driven by kinds, catalogs and metrics. Specialised
screens only where `concepts.md` says the generic model is not enough.
The design boards (Design artifact "lifeos v2") draw them at 360 and
412 px.

## Navigation

ADR-0054 and `flows.md` (places, every object's five answers, event
chains, every v1 screen id).
- **Bottom bar** on phones, header on desktop:
  **Oggi · Piano · ⊕ · Andamento · Libreria**.
- **Header:** the gear (Settings) and the assistant icon (when enabled).
- **DateNav** is the same everywhere time is browsed:
  - one day on Oggi, week or month on Piano, a range on Andamento;
  - swipe; week ‹ ›; the title opens the month; "Oggi" when away.
- **The bar** shows on the four places, never on a sub-page.
- **A sub-page** names its parent in its back link; the system back
  returns to the origin.

  | Sub-page | Canonical parent |
  |---|---|
  | composer, gym, entry sheet | Oggi |
  | model editor, cycle editor | Piano → Modelli |
  | a tracker page, Soldi, Obiettivi, Come valutiamo | Andamento (V-16 opens on the model of the score that opened it) |
  | food, meal and exercise editors; Dispensa | Libreria |
- **⊕:** a kind without a specialised screen opens the entry sheet; a
  search with no result offers "crea" (barcode, label photo, manual).
- **Every view keeps a URL**, as in v1.

## The screens

| Id | Screen | What it does |
|---|---|---|
| V-01 | **Day** (Today and any day) | **Header:** date, week strip, month calendar, swipe between days; the day card with the scores that apply (targets, food quality, recovery, habits) and the goal line. **Body:** one timeline: planned blocks, done entries, sessions, sleep (wake and bed), habits due, money, journal, "now", the closure; filter chips by domain. **Rows:** compact (slim coloured time rail; label; key numbers; full-width strip), tap to open in levels; tick planned ↔ done, skip, swipe to delete with Undo. **Gaps:** an empty block offers its "+" with sensible defaults. |
| V-02 | **Capture ⊕** | One search over kinds, catalog items and recent entries ("acqua 500", "panca", "caffè"); pinned and recent kinds as big buttons; a voice-to-text field (later); hands off to the entry sheet or a specialised editor; a time chip (now / planned at / earlier at). |
| V-03 | **Entry sheet** | The form generated from the kind: fields with steppers, scales, choices, durations and timers; status and time; parent and links; note; relation tags shown read-only; "new from this" for catalog-backed entries. |
| V-04 | **Food composer** (specialised) | Lines from the food catalog (search ranked by use and fit to the slot); scan (camera with focus, from a photo); estimate (typed totals); servings; live preview against the slot and the day; meal role; the relation tags it will get. |
| V-05 | **Gym mode** (specialised) | Auto/manual toggle, setup delay, rests by evidence and between sides, loads typed as lifted, RIR after the exercise, e1RM(RIR) % with its context, incoherence flags, session-wide targets, editable times as a chain, wake lock. |
| V-06 | **Andamento** and its **tracker pages** (any kind) | Andamento: DateNav range; "Il periodo", the same Box as Oggi's day over the range; one row per domain → its tracker page; Obiettivi; correlations; data quality. Tracker page: This week vs the last, a chart of its main metric with goal lines, the list of its entries, its goals, its routines/recurrence, its relations ("after training", "before bed"), the kind's settings (fields, units, targets). The Body, Sleep, Mind, Water, Habit and Money "pages" are this screen. |
| V-07 | **Libreria** and its **catalog pages** (foods, meals and recipes, exercises, kinds) | List with instant search, sort by any field alone or per another (v1's metrics), filters; item page and editor ("new from…", merge duplicates); a food's page with its products, formats and prices per shop (ADR-0055); products under their food; recipes with their parts. |
| V-08 | **Piano** | Calendario (week/month, DateNav) of planned entries; a day's sheet (its template, swap, skip, rest). **Modelli:** blocks of any kind, day types (targets fixed or following the goal, meal shares, `extends`), week layout, **cycles of any models** with an advance rule, bound to a block. **Abitudini.** Model and cycle editors. |
| V-09 | **Goals** | Every goal with progress, pace needed vs actual, ETA, on track; editor: pick a metric, the target, the date (the app derives the pace and explains, memory: ask-human-inputs). |
| V-11 | **Money** (tracker page + specialised parts) | Month overview: pace vs last month, categories, shops, accounts and balances; movements; receipt review line by line. |
| V-12 | **Pantry** (catalog page + specialised parts) | Products with stock, best-before, location; use-first; the shopping list from minimums. |
| V-13 | **Scan** (specialised) | Barcode, receipt, label: camera with focus, torch, from a photo; field-by-field confirmation next to the photo. |
| V-14 | **Settings** | Account, display, body, day boundary, time zone, language; Trackers (make your own kind); Data: download JSON / CSV, replace, merge (ADR-0052); packs; trash; invitations. |
| V-15 | **Sign-in / sign-up** | As v1 (Better Auth, invitations). |
| V-16 | **Come valutiamo** | One page per scoring model (E7): its parts with weight sliders bounded by their allowed range, locked limits with a lock, the "why" and the sources of each part, version and date, and a live preview on a real meal or day. |

## Every v1 screen id → its v2 screen

One table, in flows.md §6 (place, board, notes).

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
- **The drawing moves with the box**, in the same transition and with
  the same timing (≈ 0.5 s, the box's curve), never as a separate
  animation:
  - compact: small (~44 px) and whole, so it reads;
  - times shown: each family shifts its own way (plate turns, dumbbell
    rises, moon sets, drop sinks);
  - details open: it grows ~1.9× and cross-fades to a richer cousin
    (dinner → cutlery, wake → full sun, bed → moon with a star, weight →
    trend line, water → glass).
  Off with `prefers-reduced-motion`. Every place that reuses the box
  reuses the motion.
- **Planned** entries get a fainter outline and a light hatch.
- **The score as a chip in the box's head** (pick 2026-10-25, #289);
  the criterion skyline is drawn when the box opens, not behind it:
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
