# 01 — The day's targets: goal, expenditure, movement, weight

Read from: `core/day/{resolve,explain,timeline}.ts`, `core/energy/*`,
`core/training/weighIns.ts`, `core/nutrition/{bands,targets,week,programs,slots}.ts`,
schema `goals`, `week_checkins*`, `energy_corrections`, `day_profiles`,
`day_plans`, `day_programs*`, `day_activity`, `body_measurements`,
`weigh_in_context`. ADRs in force: 0040–0048, 0051 (index in
`docs/decisions/README.md`).

## 1. What the user enters

| Fact | Where it is entered | Table | Notes |
|---|---|---|---|
| Sex, birth year, height | Settings → Body | `user_settings` | once |
| Weight, waist, abdomen, neck, hip, body fat % | Body → weigh-in form | `body_measurements` | any day, several a day |
| How a weigh-in was taken (time, fasted, after toilet, after training) | same form | `weigh_in_context` | optional |
| Everyday level (sitting / mixed / on feet) | Today → movement sheet | `day_activity.level` | per day, default "mixed" |
| Steps, walking minutes | Today → movement sheet | `day_activity.steps`, `.walking_min` | per day; future days allowed |
| Goal: kind, target weight, target day, protein preference, split, floor, weekly check-in on/off | Settings → Goal | `goals` (history by `since_day`) | the pace is derived (ADR-0045) |
| A week accepted or skipped | Today → check-in card | `week_checkins`, `week_checkin_days` | only when the check-in is on |
| An accepted calibration factor | the calibration box | `energy_corrections` | from its day on (ADR-0026) |
| Day types with fixed targets, or dynamic parameters, a program (training time, ± kcal, timed slots with shares) | Food → Day types | `day_profiles`, `day_programs`, `day_program_slots` | |
| Which type a day has | Today header (with several types) | `day_plans` (a copy of the type's targets) | frozen at first food |
| A day closed as complete / partial | Today → closure chip | `day_closures` | feeds the calibration |

## 2. How a day's targets are built today

`core/day/resolve.ts resolveDay()` is the one engine (ADR-0040): Today, the
week strip, the Plan, Settings, Trends and the assistant all read through it.

```
body (user_settings) ─┐
trend weight ─────────┤→ BMR (Mifflin-St Jeor)
day_activity ─────────┤→ everyday factor × BMR × accepted factor c   = baseline
                      │→ steps × (3.0–3.8 MET − 1) × kg (100 steps/min) = walking
sessions done/planned ┘→ MET × kg × h − resting                        = training
                                       total(done), total(with plan) — ranges
goal (goals) ───→ pace % BW/week (planGoal) → deficit = pace × kg × 7,700 / 7
                  kcal = mid(total with plan) − deficit, ≥ floor (BMR or 1,200)
                  protein = 1.6/1.8/2.0/2.2 g × target kg (current kg without one)
                  fat = max(0.6 g/kg, 20/25/35 % of kcal by split)
                  carbs = the rest; fibre = 14 g / 1,000 kcal
check-in (if on and accepted) → the 7 days frozen at the week's average, ± each day's program shift (carbs take it)
no goal → the day type's own deficit and g/kg (ADR-0014 presets), or its fixed numbers
auto maxima: sugars 90 g/2,000 kcal (EU RI), saturated fat < 10 % kcal (WHO), salt < 5 g (WHO)
bands per macro (floor / good / ceiling) from kg, kcal, training load (ADR-0023/0025/0040)
```

### Constants and their evidence

| Constant | Value | Source | Status |
|---|---|---|---|
| BMR | Mifflin-St Jeor | Mifflin 1990; the most accurate of the common equations for non-obese adults (Frankenfield 2005) | ✅ |
| Everyday factor without steps | sitting 1.15–1.25, mixed 1.20–1.32, on feet 1.27–1.42 | ADR-0051, hand-derived ("~+0.5 kcal/min on your feet") | ⚠ not pinned to a source; see I-2 |
| Walking | 3.0–3.8 MET, 100 steps/min, net of 1 MET | Compendium of Physical Activities (Ainsworth 2011) | ⚠ see I-3 |
| Level's usual steps (no steps logged) | 5,000 / 7,500 / 10,000 | Tudor-Locke 2008 bands | ✅ |
| Training | session burn range, net of 1 MET for its duration | Compendium; ADR-0016/0021 | ⚠ see I-4 |
| kcal per kg | 7,700 | the usual rule (Wishnofsky); Hall 2008 shows it varies | ⚠ see I-6 |
| Pace ranges | lose 0.5–1.0 %/wk (usual 0.7), gain 0.10–0.25 %, recomposition ±0.05–0.5 % | Helms 2014, Garthe 2011, Iraki 2019 | ✅ |
| Protein | 1.6–2.2 g/kg of target weight | Morton 2018; ISSN 2017; Helms 2014 (cut) | ✅ |
| Fat | ≥ 20 % kcal (AMDR), ≥ 0.6 g/kg; 25 % default | IOM AMDR; Whittaker 2021 (testosterone < 20 %) | ✅ |
| Carbs band | rest 2–3, training 3–5, long 5–7 g/kg | ACSM 2016 (Thomas et al.) | ✅ |
| Fibre | ≥ 25 g, 14 g/1,000 kcal, no maximum | EFSA AI; IOM | ✅ |

## 3. Issues found

**I-1 Three answers to "what do I weigh".** `trendWeightAt` (EMA 10 %/day,
every weigh-in at reliability 1) feeds the engine; `weightTrend` (same EMA
but weighted by ADR-0027 reliability) feeds the Body page; the Kalman
state `W` in `calibration.ts` is a third. On a week with a salty dinner
they disagree by a few hundred grams, and the engine ignores the
reliability the app worked out.

**I-2 The everyday factors have no pinned source.** Sitting + 5,000 steps
gives a PAL of ~1.27–1.36. Doubly labelled water puts sedentary adults
at 1.40–1.69 (FAO/WHO/UNU 2004; Black 1996). The learnt factor `c` can
correct up to ±20 %, but the prior starts low, and `c` is capped at 1.20.

**I-3 Every step at walking pace.** Incidental steps (house, office) are
slower than 100 steps/min at 3–3.8 MET. The cost per step (≈0.03 kcal/kg
per 100 steps) is in the published range, but a 10,000-step day of short
bouts is likely overestimated. It also makes "steps on a future day"
ambiguous: counted, or planned? (`day_activity` has no field saying which.)

**I-4 Training counted in full.** Added exercise is partly compensated
(~28 % on average, Careau 2021). Strength sessions at MET × whole duration
overcount: rests are 60–70 % of the session. The calibration only learns
`c` on the baseline, so training errors land in `c` and leak into rest
days.

**I-5 Planned sessions move today's target.** "With the plan" includes a
routine's default sets as a pseudo-session. Planning a session raises
the day's target, and skipping it makes the day look over. ADR-0047
(the day in its week) softens this, but the number still jumps.

**I-6 The learnt expenditure is hidden until week ~8.** The Kalman filter
is good (ADR-0041/0042), but a factor is only *proposed* at σ ≤ 0.05 and
must be *accepted*. Until then the target uses the formula. MacroFactor
shows a moving estimate from day 3, with its uncertainty, and uses it.
The 7,700 kcal/kg constant also reads early water/glycogen loss as fat.

**I-7 Three sources for a dynamic day, and fixed types besides.**
`resolveDay` chooses between an accepted check-in, the goal, and the day
type's own parameters (`dynamicTargets`, `GOAL_PRESETS`), plus fixed
targets per type and `user_settings.target_*` (deprecated, still read by
the export only). ADR-0046 made the goal the one source *when there is
one*; the other paths are still alive.

**I-8 "Day type" means four things.** Targets (fixed numbers or dynamic
parameters), a program (slots with shares), a training time and a kcal
shift, plus the per-day copy in `day_plans`. The training **program**
(`programs*`, ADR-0024) is a separate cycle that decides which routine,
not which day type. The developer asks for "programs of the whole day"
(considerations.txt): today there is no single object for it.

**I-9 Session time defaults to 17:30.** `SESSION_DEFAULT_AT` places any
session without a start time at 17:30, and the add-session flow does not
remember the last time (considerations.txt).

**I-10 Bands and targets on different bases.** Protein targets use the
*target* weight; the protein band uses the *current* weight. The
`low_fat` split asks 20 % fat while the fat band's good zone starts at
25 %, so the app's own choice shows as "low".

**I-11 Weigh-in reliability doesn't reach the target.** It reaches the
calibration and the Body chart only (I-1).

## 4. Proposals

💡 **P-1 One weight estimator [decision].** The Kalman filter's `W` (scale
weight minus water noise, with reliability and the log) becomes *the*
trend weight for every screen, the engine and the Body chart. It already
exists. A plain EMA stays only as a fallback with < 3 weigh-ins.

💡 **P-2 The learnt expenditure is the expenditure [decision].** Show the
posterior (mean ± σ) from the first week. Targets use a blend: formula
while σ is large, the learnt value as σ shrinks (precision weighting).
Accepting a factor goes away. The weekly check-in stays as an optional
*review* ("your expenditure moved from X to Y; next week Z") rather than a
gate. It amends ADR-0020/0026/0041/0043.

💡 **P-3 Better prior, fewer double counts.**
- Everyday factors pinned to FAO/WHO PAL bands (sitting incl. ~5,000
  steps ≈ 1.40–1.55), split into "on your feet" and steps by a published
  step cost.
- Steps cost by cadence band: incidental (< 100/min, ~2.0–2.5 MET) vs
  brisk walks (≥ 100/min, 3.0–3.8 MET). Devices give both; by hand, "of
  which a walk of N minutes".
- Strength sessions: MET on work time (sets × duration), rest at ~1.5 MET.
- Training counted at ~0.7–0.8 in the *prior* only (compensation); the
  filter learns a separate factor for training (`c_train`), as it already
  does for estimates (`k`).
- Asymmetric energy density for the scale (Hall 2008 / MacroFactor V3)
  instead of a flat 7,700.

💡 **P-4 Counted vs planned movement.** `day_activity` gains a status
(planned / counted), like log entries (ADR-0009). Future days are planned
by construction. Planned steps feed the plan; only counted ones feed the
calibration.

💡 **P-5 The goal is the only source.** Remove the dynamic-type path
(`dynamicTargets`, `GOAL_PRESETS`, `deficitKcal` and g/kg on day types)
and `user_settings.target_*` after a migration that turns any type
without a goal into a "maintain" goal. Fixed targets stay possible as a
goal kind "fixed numbers" (for anyone following a coach's numbers).

💡 **P-6 A day template is the day's program, for everything [decision].**
This is the developer's "programmi per le giornate… programmazione delle
routine per tutto". It replaces "day type".

```
Day template ── an ordered list of BLOCKS, each with a time (or "after X")
  meal block      kind (breakfast/lunch/dinner/snack), share of kcal and protein (soft)
  training block  a routine or "the program's next day", duration
  activity block  work on your feet / walk / commute (gives "time on your feet" and planned steps)
  sleep block     bedtime and wake time (feeds the sleep target and pre-sleep)
  habit block     anything else to tick (later: supplements, stretching…)
Week layout ───── which template on which weekday; the training program fills training blocks
Day (instance) ── the template applied to a date; blocks can be moved, swapped, skipped;
                  switching template mid-day keeps what is done and replaces what is ahead
```

- Peri-workout becomes a *relation*, not a meal kind: a meal block within
  ~3 h before or ~2 h after a training block is pre/post-workout (see
  02-food P-2). Skip the training and the relation disappears by itself.
- The session time comes from the block; moving the block moves the
  meals that relate to it (fixes I-9; generalises ADR-0044's
  `moveWithSession`).
- "Incremental" templates (considerations.txt): a template can extend
  another ("Gym day = Rest day + training block 18:00 + post-workout
  share"), so changing the base changes all of them.
- The goal decides the energy; a template only shifts it within the week
  (as `shiftKcal` does now).

💡 **P-7 One band basis.** Protein bands and targets per kg of *reference
weight* (target weight, or lean-mass-based when body fat is known: ~2.3–
3.1 g/kg FFM, Helms 2014). The fat band follows the chosen split.

💡 **P-8 Body composition when known.** With a body fat % (or waist +
neck by the US Navy formula, already measured), use Katch-McArdle for BMR
and lean mass for protein; show FFMI and waist-to-height as trends.

## 5. Aggregation (this area)

```
raw      weigh-ins (+context) · activity · sessions · intake · closures · goal
derived  reliability per weigh-in → trend weight W(t) ± σ
         expenditure prior E0(t) → learnt E(t) ± σ (c, k, c_train)
         pace(t) from goal + W(t) → deficit(t)
aggregate day target(t) = E(t) − deficit(t) ± template shift; week budget = Σ targets
judgement week balance (ADR-0047), goal ETA, "on track" (W trend vs planned pace)
```

Questions for the developer: P-1, P-2, P-5 and P-6 are decisions. P-6 is
the largest: it changes Today, Food → Day types and Training → Programs.
