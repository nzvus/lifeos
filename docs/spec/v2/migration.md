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
