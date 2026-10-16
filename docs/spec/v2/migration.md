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
| ingredients | catalog_items food, product or format (ADR-0055) + catalog_values (8 nutrients, NOVA, origin) | a brand-named ingredient becomes a product of its generic food (created only when none exists); two shapes or sizes of one product become formats; v1's price becomes the first price observation (shop from the description, day = created); source = "v1" |
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
| products | catalog_items product (parent = its food) and a format for the package (barcode, size) | |
| purchases | entries (purchase, item = format) + a price_observation | the price history lives in price_observations |
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
- **Missing data:**
  - filled only where it can be derived (a price from a receipt line, a
    fibre type from the food group);
  - otherwise left empty and counted by data quality (E9).
- **Check:** the parity checks below run on the corrected copy; the
  differences against the raw export are exactly the report's lines.

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
