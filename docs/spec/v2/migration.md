# v2 — Migration: every v1 table to its v2 place

The converter reads a v1 export (version 21, `core/export/tables.ts`; older
files through `core/import/legacy.ts`) and writes a v2 file. The v2
replace then loads that file (ADR-0052's contract on both sides). It is
tested on a fixture with every table (`seedEverything`) and rehearsed on
the developer's export in PGlite before every switch.

## Mapping (all 50 exported tables)

| v1 table | v2 place | Notes |
|---|---|---|
| user_settings | settings | `target_*` and `energy_correction` dropped: targets come from goals, the factor is learnt (E4) |
| ingredients | catalog_items (catalog food) + catalog_values (8 nutrients, price per g, NOVA, origin) | price kept as the item's "last known" until purchases exist; source = "v1" |
| tags, ingredient_tags | catalog_items (catalog tag) + catalog_values ref | |
| ingredient_compounds | catalog_values (caffeine, creatine per 100) | |
| meals, meal_items | catalog_items (recipe) + catalog_parts | category → the recipe's default meal role |
| rating_factors, meal_ratings | catalog_items (rating factor) + catalog_values on the recipe | |
| log_entries | entries (kind meal; drink when the only line is a drink) | moment → meal role; pre/post-workout/pre-sleep → role by time (relations are derived in v2); estimated → confidence 0.6 + one line with typed totals; `at` null → day only |
| log_entry_items | entry_lines + entry_line_values | the snapshot is kept exactly |
| log_entry_left_out | entry_values (field `left_out`) | |
| day_closures | decisions (day_closed) | |
| day_profiles, day_programs, day_program_slots | templates (scope day) + template_blocks (meal blocks with shares; training block at `training_at`) | fixed numbers of a type without a goal → a goal "fixed numbers" |
| day_plans | decisions (week_targets / day targets frozen) for days with a fixed copy; else dropped (live) | |
| goals | goals (metric: weight, target reach target_kg by target_day; nutrition goals derived) | |
| week_checkins, week_checkin_days | decisions (week_targets, payload: numbers + shifts) | accepted ones only; skipped ones dropped |
| energy_corrections | dropped (E4 learns c from the whole history) | listed in the report |
| exercises | catalog_items (exercise) + catalog_values (kind, pattern, equipment, unilateral, groups) | |
| routines, routine_items | catalog_items (routine) + catalog_parts (defaults: sets, reps, load, rest) | |
| programs, program_slots, program_slot_items, program_slot_exercises | templates (scope cycle) + template_blocks (cycle_position) | both ways of putting an exercise on a day (v1 08) become one block |
| program_skips, program_overrides | decisions (cycle_skip, cycle_override) | |
| training_sessions | entries (kind session, interval from started_at + duration) | estimated sessions: values minutes, intensity, kcal |
| session_exercises | entries (kind session_exercise, parent the session, item the exercise) | rest → value `rest_s` (one place) |
| sets | training_sets | load as stored (total); `load_entry` = total; rest dropped (derived from times) |
| body_measurements, weigh_in_context | entries (weigh-in, measurements) + values | context → values (fasted, toilet, after training) |
| day_activity | entries (steps, status done if the day has passed, else planned; on-your-feet from level) | |
| sleep_logs | entries (sleep, interval bed → wake) + quality | |
| day_checkins | entries (check-in, moment unknown) + journal entry for the note | |
| products | catalog_items (product) + values (brand, barcode, package, food ref) | |
| purchases | entries (purchase, item = product) + values (packages, price) | the price history lives here |
| stock_counts | entries (stock count) | |
| batches, batch_lines | entries (kind batch) + entry_lines/values | portions → value |
| reminders | templates (routine + recurrence) → chores / habits | |
| money_categories | catalog_items (money category, parent_id) | |
| money_movements, money_lines | entries (movement) + money_movements + money_lines | account = "default" until accounts exist |
| money_receipts, receipt_aliases | receipts, receipt_aliases | |
| assistant_conversations, assistant_messages | kept as they are (parked) | |
| *(not exported)* user, session, account, verification, rate_limit, invites | v2 has its own login | |

## Review of the data before the import (the developer, 2026-10-16)

The converter imports what v1 holds; a **review pass** runs on the
export first and writes a corrected copy. Every change is listed in a
report, with the old value, the new one and the reason. The developer
loads the copy only after reading it (ADR-0052, "replace").

- **Expenditure:**
  - recomputed with the new priors (engines.md E4a);
  - for a timed set (start and end in gym mode) the time is kept only
    when plausible: between ≈ 1.5 and ≈ 8 s per rep;
  - otherwise reps × the movement's tempo;
  - rests come from the gaps between sets, capped at 10 min (a longer
    gap is a pause, not a rest);
  - sessions without times are estimated from sets, reps and rests by
    exercise class.
- **Logged meals are kept as they are.** Their nutrients change only
  when the ingredient they use was wrong.
- **Ingredients:**
  - for each of the ~130, look up average values per 100 g in CREA,
    CIQUAL or USDA FDC, or on the label via Open Food Facts when there
    is a brand: the 8 label values plus fibre types, the micros of
    kinds.md (vitamins A, C, D, B12, folate; Ca, Fe, Mg, K, Na, I, Se),
    protein quality, fatty acids, sugar kinds, water;
  - keep the developer's value when it agrees within the source's
    range; else replace it and say why;
  - each value records its source and confidence.
- **Outliers and inconsistencies across the dataset:**
  - kcal vs the Atwater sum of macros (beyond ± 15 % is flagged);
  - sugars greater than carbs, saturated greater than fat;
  - weighings that jump more than 2 % in a day;
  - loads that double between sessions (per dumbbell vs total);
  - e1RM outliers on machines with stack numbers;
  - sleep longer than 14 h or with the bed time after the wake time;
  - duplicates.
- **Exercises** (first pass drafted on the design boards, 70 → 57):
  - a seed entry that duplicates one the history uses folds into it; the
    survivor takes the Italian name and the history follows (13, e.g.
    "Incline db press" → "Panca inclinata con manubri");
  - names in Italian with the equipment ("Pec deck (croci alla
    macchina)", "Rematore con petto appoggiato"); equipment filled where
    it is certain; the movement pattern refined (dip, hip thrust,
    twist, the cardio kinds);
  - each exercise gets its icon: the movement, with the equipment as a
    corner mark; the user can pick another;
  - what cannot be derived is asked, not guessed (equipment of the
    shoulder press, the preacher curl and the chest-supported row; one
    arm or two on the cable lateral raise).
- **Missing data** (changed 2026-10-16, the developer: «riempire ogni
  casella … dati di bassa o alta aggregazione plausibili, considerando le
  loro dipendenze»):
  - filled when it can be derived (a price from a receipt line, a fibre
    type from the food group) or estimated plausibly from its
    dependencies (below);
  - every filled value carries its provenance: `source` (CREA, CIQUAL,
    USDA FDC, Open Food Facts, a rule), `confidence` and `estimate: true`.
    It shows the «stima» pill (content.md §3);
  - estimates never train anything: the learnt expenditure, the weight
    trend, the scores, the correlations and the records read measured
    values only. An estimate fills a box; it never becomes a measurement;
  - subjective values (mood, energy, sleep quality, ratings) and goals
    are never estimated. They stay empty or are asked.
- **Check:** the parity checks below run on the corrected copy; the
  differences against the raw export are exactly the report's lines.

## Refinement update (planned 2026-10-16, export of 2026-10-16)

`boards-tools/audit_export.py` on the export of 2026-10-16 (29 Sep →
16 Oct, 18 days) found 138 items. Corrections are proposed, never
applied, until the developer approves them; estimates are added in a
separate layer of the refined copy.

**1. Corrections (fix, to approve):**
- 17 restaurant dishes saved as «100 g = the whole portion» («Indiano ·
  Tandoori misto (400 g)»: 750 kcal "per 100 g"). The fix: true per-100 g
  values, and quantity = the portion's grams × servings. The day totals
  do not change. The servings of 0,25 or 0,5 are right: a shared table,
  a bit of everything (the developer, 2026-10-16).
- 2 whole meals estimated and saved as one food, with more energy per
  100 g than any food has (oil ≈ 900): «Ristorante bolivione» 1230 kcal
  (16 Oct) and «Sweetburger · Cheeseburger doppio» 970 (8 Oct). They become
  estimated entries with their kcal, and the name is fixed («boliviano»).
  The Bolivian dinner has its dishes from the developer (approved): «Salteña»
  1 piece, «Pique macho» half a portion, «Cuñapé» 1,5 pieces. Their values
  per piece or portion are the developer's; the grams are a typical weight,
  marked estimate. The totals stay 1230 kcal (`corrections.json`, next to the
  export).
- 2 foods whose kcal and macros disagree beyond ± 20 % and 15 kcal
  (frozen artichoke hearts, balsamic vinegar).
- A «Corsa» session marked done on 17 October, a day not yet come, with
  no exercises and no time.

**2. Questions (check, the developer answers):**
- Dumbbell loads: total or per dumbbell, for «Incline db press» and «Alzate
  laterali con manubri» (the export of 16 Oct has 10 kg on the lateral
  raises, the corrected copy of 15 Oct had 20).
- Soy sauce at 14,5 g of salt per 100 g: plausible (soy sauce is 12–16 g).
- The entries of the night of 8 → 9 October, logged on the 8th with
  times of the 9th.
- «Biscotto Gran Cereale Cioccolato» twice on 16 Oct (200 g = 907 kcal,
  and 5 × 21 g = 476): a duplicate, or both eaten.
- «MERLUZZO al sugo» still planned on 8 Oct: eaten or skipped.

**3. Fills (gap), in the refined copy, all with provenance:**

| Entity | Missing | How it is filled |
|---|---|---|
| Ingredients (110) | micros (all: v1 holds 2 compounds), macro kinds (protein quality, fatty acids, sugar kinds, fibre types: 73), food group (all), price (47), NOVA (2), origin (6), description (9) | matched to CREA › CIQUAL › USDA FDC by name and group, or to Open Food Facts by brand; the developer's 8 label values are kept when within the source's range; a price from the receipts, else the category's median, marked estimate |
| Meals (20) | dish, servings, notes (19), ratings (0), tags | dish from the name (icons.md); totals from the ingredients; ratings never estimated |
| Exercises (70 → 57) | equipment (36), muscles (10), guide (70) | the exercise review above; muscles from v1's `suggestAnatomy`; a short guide per movement from a standard reference, marked estimate |
| Days (18) | steps (4 days), sleep quality (3), mood and energy (7), weighings (5), closures | steps from walking minutes and day level (≈ 110 steps/min); weighings not invented (the trend interpolates); quality, mood and energy left empty |
| Goals (2 versions) | the v2 goals the boards show (steps, study, reading, money) | asked through the goal form (what, how much, by when); never invented |
| Pantry, money | 0 purchases, 0 counts, 2 movements | rebuilt only from receipts the developer adds; not invented |

**4. Outputs:**
- `lifeos-export-2026-10-16-refined.json`: the export plus the approved
  corrections plus the estimate layer, with `_provenance` per filled
  field;
- the report (every change: old, new, why, source);
- the boards' DATA rebuilt from the refined copy, so no board shows
  «esempio» where the data can say it.

**5. Order:**
1. the developer answers §2 and approves §1;
2. the catalog (ingredients, meals, exercises);
3. the days;
4. the goals, through the form;
5. the boards rebuilt;
6. parity re-run.

## Parity checks (must be equal before a switch)

On the developer's export, v1 computed vs v2 computed, per day or per
session:
- **Food:** every nutrient total eaten and with plan, and the cost of the
  day (exact).
- **Training:** working sets, tonnage, best e1RM per exercise per session
  (exact); session minutes.
- **Body:** each weigh-in's value; the trend weight within 0.1 kg (E4
  replaces three estimators, so equal to v1's engine trend, not to all
  three).
- **Sleep:** hours per night (exact).
- **Money:** totals per month and category (exact cents).
- **Counts per kind:** v1 rows vs v2 entries, the report listing every
  row dropped and why.

Numbers that are **expected to differ**, listed in the report with the
reason:
- the energy targets (new estimator);
- the day quality score (new scores);
- pre/post-workout tags (now derived).

## Parity of functions (the developer, 2026-10-16)

The numbers above must match; so must what the person can do. Every
search, sort, filter, suggestion and shortcut v1 has (inventory of
2026-10-16, `src/core/shared/search.ts` and its callers) has a place in
v2. **Kept** = same behaviour; **better** = v2 adds to it (find.md);
**on the boards** = drawn since the find rollout (2026-10-16), with the board named.

| v1 function (where) | v2 | Status |
|---|---|---|
| Search: case and accents ignored, every word in any order, start of text > start of word > inside (`rank`, `matchScore`) | every search (find.md §1) | better: one typo, aliases, quantities, barcodes |
| Ties: uses in 60 days, then last use, then A–Z (`getUsage`, `rank`) | the ranking (find.md §2) | better: time of day, plan, favourites, the reason shown |
| Ingredients: 11 sorts × 7 "relative to", each in its natural direction, missing values last, the value on the row (`browseFoods`, `metricValue`, `naturalDirection`, `SortNote`) | Cibi (Catalog) | kept; on the boards |
| Meals: the same sorts, per serving; cost only when every price is known | Pasti e ricette (Meals) | kept; on the boards |
| Meals: filter by moment (7) | Pasti e ricette (Meals) | better: moment, dish, tags; on the boards |
| The opening sort remembered (`user_settings.listSort`, `listPer`) | every list | better: per list, with its filters |
| Meal picker by name and notes; meal list also by ingredient names; ingredient list also by tags (uneven) | every search | better: the same fields everywhere |
| "Fits this slot": up to 3 meals for pre-/post-workout and pre-sleep (`suggestForSlot`) | the composer (Food: «Pasti adatti alla cena»), ⊕ | better: every slot, with the reason; on the boards |
| Moment proposed from the time (`suggestMoment`, moment start times) | ⊕, the entry sheet | kept |
| Portions from a cooked batch (Portion tab) | ⊕ «Porzioni pronte», the composer's «Porzioni» tab | on the boards |
| Repeat yesterday's meals on an empty day (`copyDay`) | a day still empty: Piano's day sheet «Copia ieri» | on the boards |
| Training: routine tile at its latest version (`latestPreset`, `labelFamily`) | ⊕ «Allenamento · come l'ultima volta» → Palestra | on the boards |
| Training: copy a past session (last 12) | ⊕ «Una sessione passata» → Palestra | on the boards |
| Training: estimate a session | ⊕ → Palestra | kept |
| "Last time ({day}): {sets}" per exercise (`lastSets`) | Palestra; the exercise editor | on the boards (example sets until the history is in the data) |
| Gym: copy the last set, the next target (`copyLastSet`, `nextTarget`) | Palestra | kept |
| Exercise pickers A–Z (no usage) | every exercise search | better: ranked by use |
| Exercises list: no search, sort or filter | Libreria → Esercizi | better: search, sort, muscle/pattern/equipment; on the boards |
| Muscles and pattern suggested from the name (`suggestAnatomy`) | the exercise editor (ExerciseEditor), v1's table | on the boards |
| Money: search, category, month in the URL; grouped by day (`listMovements`) | Andamento → Soldi | kept, with the day's total; on the boards |
| Money overview: categories and shops by amount (`monthSummary`) | Andamento → Soldi | kept |
| Receipt lines: alias, else the model's name (`aliasKey`) | ⊕ → Scontrino | better: alias, then fuzzy name, then new |
| Barcode: check digit, two equal reads, Open Food Facts (`isValidGtin`, `confirmReads`, `offPrefill`) | ⊕ → Scansiona, and a barcode typed in any search | kept; better |
| Trends: 7/30/90 days, earlier/later/today; default from preferences | Andamento, trackers: DateNav range | kept; one period vocabulary (find.md §5) |
| Training progress by week; exercise trends; routine progress | Andamento → Allenamento | kept |
| Day page grouped by moment, snacks by part of day, slots matched | Oggi | kept |
| Pantry: shopping list (gone or out within 7 days, soonest first); stock A–Z | Libreria → Dispensa | better: search, sort by days left; on the boards |
| Duplicate a meal (`?copy=`) | the meal editor «Duplica»; models «Duplica» | on the boards |
| Entry row: eye (left out), refresh to current values, servings −/+ | Oggi row (eye, refresh as row actions); servings in the open row | on the boards |
| Time zone typed with suggestions | Impostazioni | on the boards |
| Duplicate-name check on import (`nameKey`) | the import review (above) | kept |
| Assistant `find_*` tools | parked with the assistant | parked |
| List scroll position kept (`ScrollMemory`) | every list | kept |
