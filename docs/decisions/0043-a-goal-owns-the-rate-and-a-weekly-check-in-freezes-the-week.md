# ADR-0043: A goal owns the rate; a weekly check-in freezes the week's targets, the same each day

**Status:** accepted (the developer chose A and "uniform", 2026-10-10; details decided by the agent)
**Date:** 2026-10-10
**Amends:** ADR-0014 (where the deficit lives), ADR-0040 (freezing computed numbers), ADR-0026 (where a factor is accepted)

## Context
A dynamic day type carries the deficit in kcal a day (`day_profiles.deficit_kcal`).
The developer's only type, "Rec", has 200. Three problems from the plan of
2026-10-09:
- E5: a fixed number of kcal is aggressive at 60 kg and mild at 100 kg.
  The evidence and MacroFactor use % of body weight a week.
- E7: a dynamic day is recomputed on read, so a late weigh-in or an edited
  session changes a past day's targets. ADR-0040 deferred freezing to this
  check-in.
- E8: each day follows its planned training. A skipped session leaves the
  day "over". There is no weekly budget.

ADR-0041/0042 now learn what you spend. Phase 2b turns that into targets:
a goal, and a weekly check-in that proposes the next week.

## Options considered
### Where the rate lives
- **A. A `goals` table is the one source of the rate.** It holds the
  target weight, the rate as % of body weight a week, a calorie floor, a
  protein preference and a diet split. The day type keeps its mode (and,
  in Phase 3, the day's shift). Without a goal, the type's `deficit_kcal`
  still applies, so nothing breaks.
- **B. A `goals` table that writes the computed deficit into the type.**
  Smallest change for the engine, but two sources must stay in step, and
  the number goes stale as the weight changes.
- **C. A rate column on `day_profiles`.** A column on an old table (the
  #103 outage), and a goal belongs to the person, not to the day.

### How the week's budget becomes days
- **Uniform.** The same kcal every day of the week, frozen at the check-in.
  MacroFactor's default. A skipped session changes nothing. Training days
  get no extra kcal until Phase 3 adds shifts per day program.
- **Shaped and frozen.** Spread by planned training and frozen. A skipped
  session leaves the day over.
- **Day by day, as now.** The check-in only updates the expenditure. E7
  and E8 stay.

## Decision
**A and uniform**, chosen by the developer. The details:

- **`goals(user, since_day, …)`, a history** like `energy_corrections`
  (ADR-0026). The goal in force on a day is the latest one with
  `since_day` ≤ that day. Changing it writes a row for today, so past
  days keep the goal they had. Fields:
  - `rate_pct_week`, signed, −1.5 to +1.0 (−0.5 = lose 0.5 % of your
    weight a week);
  - `target_kg`, optional;
  - `kcal_floor`: `standard` (the BMR) or `low` (1,200 kcal);
  - `protein`: `low` / `moderate` / `high` / `extra` → 1.6 / 1.8 / 2.0 /
    2.2 g per kg of the target weight, or of the current weight without one;
  - `split`: `balanced` / `low_fat` / `low_carb` → fat at 25 / 20 / 35 % of
    kcal, never under 0.6 g/kg; carbs take the rest (ADR-0040);
  - `check_in_weekday`, 0–6 (Monday by default).
- **`week_checkins(user, start_day, …)`.** One row per check-in:
  `accepted` with the frozen numbers (kcal, protein, fat, carbs, fibre),
  the expenditure and factor it used; or `skipped` without numbers. The
  check-in in force on a day is the latest one with `start_day` ≤ that
  day. Its numbers apply until `start_day + 6`. A check-in done again
  mid-week starts from that day; the earlier days keep their numbers.
  Accepted rows are never updated.
- **The check-in's arithmetic** (pure, in `core/energy`):
  - expenditure = the last 7 days' average with the learnt factor when
    σ ≤ 0.05, else with the accepted one (ADR-0041's `expenditure`);
  - kcal = expenditure + rate × trend weight × 7,700 ÷ 7, never under the
    floor (at 76 kg, −0.5 % a week is −418 kcal a day);
  - protein, fat and carbs as above, fibre 14 g per 1,000 kcal.
- **Resolving a dynamic day** (`core/day`):
  1. an accepted check-in covers it → its frozen numbers;
  2. else a goal is in force → the day computed as now, with the deficit
     from the goal's rate and the macros from the goal;
  3. else → the type's own parameters (today's behaviour).

  Fixed day types are unchanged. The bands' "cutting" comes from the rate
  when there is a goal.
- **Never silent** (ADR-0020's spirit): on the check-in day, or any day
  after it until one is done, Today shows the card. It says "you spend X
  (was Y); next week Z kcal, P / F / C". The user accepts or skips.
  Accepting also accepts a proposed factor (ADR-0026: from that day). The
  calibration box keeps its numbers but loses its own Accept button: one
  place to accept.

Tripwires:
- If the uniform week feels wrong on heavy training days before Phase 3
  ships, add a simple shift (e.g. +X on days with a session) to the check-in.
- If check-ins are skipped more than accepted, the proposal is not trusted:
  look at why before Phase 3.

## Consequences
- Two new tables, migration 0031. They are safe in any merge order.
  Export version 16 carries them. The importer accepts 16.
- PR 1: the ADR, the tables, the repositories with cross-user tests, and
  the export. PR 2: the check-in arithmetic and the engine. Also the UI:
  the goal in Settings, the card on Today, the day's goal line editing the
  goal instead of the type's deficit when a goal exists.
- `day_profiles.deficit_kcal`, `protein_g_per_kg` and `fat_g_per_kg` are
  read only without a goal. Drop them once goals have run in production
  for a while (backlog, with `user_settings.target_*`).
- "A past day's targets never change" now holds for dynamic days covered
  by an accepted check-in. ARCHITECTURE's invariant table says so.

## What I learned
