# 08 — The whole picture: data, aggregation, decisions, order of work

## 1. Every table: what it holds, who writes it, who reads it

Raw = typed by a person (or imported); decision = a choice the app must
keep; derived-stored = a copy kept on purpose (snapshot). Everything else
is computed on read.

| Table | Kind | Written by | Read by | Notes (issue ids from 01–07) |
|---|---|---|---|---|
| user_settings | raw | Settings | everything (zone, locale, body, prefs) | `target_*`, `energy_correction` legacy (01 I-7) |
| ingredients, tags, ingredient_tags | raw | Food editor, OFF, packs, upsert CLI | meals, log, pantry, scores | no value source (02 F-6); price overwritten by receipts (05 M-1) |
| ingredient_compounds | raw | ingredient editor | supplements panel | caffeine/creatine only (02 P-1) |
| meals, meal_items | raw | meal editor, packs | log, suggestions, pantry (batches) | |
| rating_factors, meal_ratings | raw | settings, meal editor | meal cards | never analysed (02 F-8) |
| log_entries, log_entry_items | raw + snapshot | Today | every nutrition number, calibration, week, scores | `moment` mixes three questions (02 F-3) |
| log_entry_left_out | decision | Today (eye) | "with the plan" totals | |
| day_closures | decision | Today chip | calibration (ADR-0042), timeline | |
| day_profiles, day_programs, day_program_slots | raw | Food → Day types | engine, slots, check-in shift | "day type" means four things (01 I-8) |
| day_plans | snapshot | first food / picker | engine (fixed targets) | legacy with a goal (01 I-7) |
| goals | raw (history) | Settings → Goal | engine, check-in, explanation | |
| week_checkins, week_checkin_days | decision | Today card | engine (frozen week) | opt-in; P-2 of 01 makes it a review |
| energy_corrections | decision | calibration box / check-in | engine baseline | goes away with 01 P-2 |
| day_activity | raw | movement sheet | energy | counted vs planned unclear (01 I-3, P-4) |
| body_measurements, weigh_in_context | raw | weigh sheet | trend weight ×3, calibration, indices | three estimators (01 I-1) |
| sleep_logs | raw | sleep sheet | day score, readiness, weigh-in clues, timeline | quality unused (04 R-1) |
| day_checkins | raw | Mind | Mind, readiness | no moment (04 R-3) |
| exercises, routines, routine_items | raw | Body editors, packs | sessions, guides, energy (planned) | rest stored 4× (03 T-6) |
| programs, program_slots, program_slot_items, program_slot_exercises, program_skips, program_overrides | raw / decision | Body → Plan | coming days, Today program day, energy (planned) | two ways to put an exercise on a program day: `program_slot_exercises` (one exercise) and items (ADR-0035); both still read and written |
| training_sessions, session_exercises, sets | raw | gym mode, editor | progress, energy, targets, readiness, timeline | context not joined (03 T-7) |
| products, purchases, stock_counts, reminders | raw | Pantry, receipts | stock, shopping list, Today reminders | 05 M-2/M-4 |
| batches, batch_lines | raw + snapshot | Pantry → cook | portions, pantry | |
| money_categories, money_movements, money_lines, money_receipts, receipt_aliases | raw | Money, receipts | Money overview, Today timeline | no accounts (05 M-6) |
| assistant_conversations, assistant_messages | raw | assistant | assistant | parked |
| invites | raw (admin) | Settings | sign-up | not exported (by design) |

## 2. The aggregation hierarchy, whole app

```
LEVEL 0  raw facts, each entered once, with a time and (where it matters) a source and a confidence
         food lines · servings · status · time | sets (reps, load, RIR, start, end) | weigh-ins (+context)
         steps, time on feet | night | check-in | doses | purchases, prices | movements | goal, templates

LEVEL 1  derived per fact (pure functions, recomputed on read)
         line nutrients · entry/group totals · meal role + relations to training/sleep (02 P-2)
         set e1RM(RIR), work time, actual rest · weigh-in reliability · hours, mid-sleep
         caffeine(t), creatine saturation · price per g from purchases · stock

LEVEL 2  state estimates (filters over time; the only "models")
         trend weight W(t) ± σ (one estimator, 01 P-1)
         expenditure E(t) ± σ with factors c, c_train, k (01 P-2/P-3)
         per-exercise strength e1RM trend; sleep need; check-in baselines (28-day z)

LEVEL 3  plans and targets
         goal → pace(t) → day target = E(t) − deficit ± template shift; week budget
         day template → blocks (meals with shares, training, activity, sleep)
         next session target (session-wide, 03 P-5); shopping list

LEVEL 4  judgements, each with its parts and its source, never mixed
         targets (week context) · food quality (nutrient density) · distribution (protein spread,
         peri-workout, late energy) · recovery (sleep, baselines, balance, load) · training progress
         goal ETA / on track · personal correlations (n, effect, interval) · incoherence flags
```

Rules: a level reads only the levels below it; only levels 0 and the
decisions are stored; level 2 states are recomputed from level 0 when a
formula changes (the developer: "se cambiamo le formule dovremmo
riaggiornare anche tutti i calcoli precedenti"). What does **not** change
when a formula changes, on purpose:
- snapshots (what was eaten as logged);
- accepted, frozen weeks (decisions);
- closed days.
The UI says when a past number was frozen under an older formula.

## 3. Decisions for the developer (each needs an ADR)

| # | Decision | From | Recommendation |
|---|---|---|---|
| D-1 | One weight estimator everywhere (the Kalman's W) | 01 P-1 | yes |
| D-2 | The learnt expenditure is used directly; accepting factors goes; the check-in becomes a review | 01 P-2 | yes |
| D-3 | The goal is the only source of energy targets; dynamic/fixed day types retire (a "fixed numbers" goal kind instead) | 01 P-5 | yes |
| D-4 | Day templates made of blocks for the whole day (meals, training, activity, sleep, habits), extendable, swappable mid-day | 01 P-6 | yes, the largest |
| D-5 | Meal role + derived relations instead of pre/post-workout moments | 02 P-2 | yes |
| D-6 | Nutrient catalogue (micros, fibre types, sources, confidence) stored one row per nutrient | 02 P-1, D7 | yes (D7 already chose rows) |
| D-7 | Three separate scores (targets, food quality, distribution) + recovery | 02 P-4, 04 P-2 | yes |
| D-8 | Gym automatic mode + setup delay + evidence rests + e1RM(RIR) with context | 03 P-1…P-4 | yes |
| D-9 | One food identity (food ↔ product ↔ purchase ↔ receipt), price only in purchases | 05 P-1 | yes |
| D-10 | Routes and areas renamed; a Review area for every chart | 06 P-5/P-6 | yes, with the UI rebuild |

## 4. Order of work that follows (proposal for ROADMAP)

The dependencies decide the order:
- D-1/D-2 change the numbers every other screen shows;
- D-3/D-4 change the objects that Today and the training program hang on;
- D-5 needs D-4's blocks;
- D-6 is independent (data plus research);
- the UI (D-7, D-10, 06 P-1…P-4) goes last, on the final concepts.

1. **ADR-0052 B and C** (in progress; no migration).
2. **Estimation core**: D-1, D-2, 01 P-3/P-4 (prior fixes, counted vs
   planned steps). Back-test on the developer's export with a known-truth
   simulation, as ADR-0041 did.
3. **The day's objects**: D-3, D-4, D-5 (one ADR family; migrations with
   new tables, old ones kept until verified).
4. **Training**: D-8 and 03 P-5…P-8.
5. **Nutrient catalogue**: D-6, with the research written into the
   catalogue's sources, and the developer's dataset rebuilt (plan Phase 5
   item).
6. **Food identity and scanning**: D-9, 05 P-2…P-6.
7. **Recovery and correlations**: 04 P-1…P-5.
8. **Interface rebuild**: D-7, D-10, 06 P-1…P-8, on the concepts above.

Each step: ADR first, then PRs a person can read, each checked on the
phone against the developer's data (memory: lean-autonomous-mode).
