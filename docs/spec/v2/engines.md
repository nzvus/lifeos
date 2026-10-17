# v2 — Engines

Pure functions in `core/engines/*`: entries, catalog items, templates and
goals in; derived values out. No engine stores what it computes (concepts
§6). Each constant cites its source; the v1 spec's findings (01–05) are
referenced as `01 I-1` etc.

## E1 Time

- **Logical day** of an instant: local date of (instant − day boundary).
- **Windows:** day, ISO week (Monday), month, rolling N days, a session,
  a custom range. A window over days with no entries returns *unknown*,
  never zero (v1's "an unlogged day is not a fast").
- **Relations** (concepts §8): for each entry, the nearest entries of
  the kinds its kind declares, with the signed gap in minutes. Tags come
  from the declared bands, e.g. meal → session:
  - −180…0 min: pre-workout;
  - 0…+120 min: post-workout.
  Sources: ISSN 2017 nutrient timing; Kerksick 2017.
  A band's edges count; where two bands meet (a meal at the session's
  start) the first declared wins. Every related entry is tested, not only
  the nearest: a meal can be post-workout of one session and pre-workout
  of the next. Skipped entries relate to nothing; planned ones do (the day
  with the plan).
- **Recurrence:** daily, weekdays, every N days, N times a week (flexible
  days), on dates. "N times a week" plans nothing on fixed days; it counts
  done entries in the week.
  Progress over a window: fixed rules count the planned days done out of
  the planned days (the steps goal: weekdays over 8.000, out of the
  weekdays); "N times a week" counts any done day of one ISO week, out
  of N.
- **Code:** `apps/v2/src/core/engines/time/` (ADR-0056); `instantAt` is the inverse of a
  day minute (a typed time → its instant, across clock changes).

## E2 Metrics

`metric(entries, definition, window) → value | series` per concepts §6.
- Exact decimals (big.js) for sums of nutrients and money, rounded once
  at display (v1's invariant "totals = parts").
- Shares, ratios and "per kg" read the trend weight (E4), not a single
  weigh-in.
- **Streak** = consecutive windows meeting the habit's target; a
  *skipped* entry with a reason (sick, travel) can be set to not break it.
- **Regularity** = 1 − coefficient of variation over the window (for
  times of day: circular SD of the minute).
- A window with no data breaks a streak (it cannot be shown as met);
  today, still open and not met yet, does not.
- `metric()` buckets a window per day, ISO week (clipped), month or the
  whole window. A day has data when it holds an entry of the source kind
  in a counted status, before the other filters (a logged day with no
  late snack is 0 kcal after 21:00; an unlogged one is unknown). Filters:
  status (done; with planned, the day with the plan), catalog item,
  relation tag, time of day (wrapping past midnight). A metric's source
  may be a per-day metric (the week's mean daily protein, the regularity
  of daily steps). Per kg takes E4's trend weight as an input (the
  bucket's mean) until E4 exists.
- **Code:** `apps/v2/src/core/engines/metrics/` (exact sums, streak,
  regularity, circular time, `metric()`, per session, trend as an EMA by
  half-life with σ, rate per week). The body's trend weight is E4's.

## E3 Planning

- `apply(template, date) → planned entries` with `from-block` links.
- Relative blocks resolve against the day's actual entries first, then
  the planned ones ("40 min after the session": the real start, else the
  planned).
- `swap(date, template)`: keeps done and skipped entries, replaces planned
  ones ahead of now, returns an undo.
- Training blocks take the next item of the active program (v1 ADR-0024
  semantics: a missed day slips the cycle; overrides and skips kept).
- Default time of a block without a time: the last time used for that
  block, else that kind, on that weekday; else the kind's default; else
  no time, at the end of the day (fixes v1's 17:30, 01 I-9). The same
  holds for a relative block whose anchor cannot be placed.
- A model resolves through its bases (concepts §5): each block says base
  / local / changed; differences naming a lost block come back as stale.
- `apply` skips a block already on the day; `swap` replaces only a
  model's planned entries ahead of now, never ones typed by hand.
- **Code:** `apps/v2/src/core/engines/planning/`; cycles generalise v1's
  program (by occurrence or date), its 14 cases run as a parity test.

## E4 Body state (specialisation: body)

One Kalman filter per person, run over the whole history, for the whole
app (01 P-1, P-2).
- **State:** W (weight without water noise), c (factor on the everyday
  baseline), c_train (factor on training burn), k (factor on estimated
  intake).
- **Daily step:** W += (weighed + k·estimated − c·B − c_train·T − S) /
  ρ(ΔW), where B is the baseline, T training and S steps.
  - ρ is asymmetric: fat ≈ 9,440 kcal/kg, lean ≈ 1,820 kcal/kg, mixed
    by the trend (Hall 2008; MacroFactor V3); not a flat 7,700.
- **Observation:** each weigh-in by its reliability (v1 ADR-0027 clues:
  fasted, toilet, after training, salt and carbs the day before,
  implausible = 0.02).
- **Intake uncertainty by day:** closed complete ±10 % weighed, ±30 %
  estimates; partial and half-logged days filled from neighbours ±30 %;
  unlogged ±35 % (ADR-0042, kept).
- **Outputs:** trend weight W(t) ± σ, used by every screen; expenditure
  E(t) ± σ, used directly (no "accept a factor" step); the learnt c,
  c_train, k with σ.
- **Prior** (01 P-3):
  - BMR: Mifflin-St Jeor, or Katch-McArdle with a body fat %;
  - everyday PAL from FAO/WHO bands by time on feet;
  - steps by cadence band: incidental 2.0–2.5 MET, brisk walks 3.0–3.8;
  - strength work at MET on work time, rests at ~1.5 MET;
  - training at 0.75 in the prior (Careau 2021 compensation).
- **Validation:** known-truth simulations, as for ADR-0041, and a
  back-test on the developer's export: predicted vs actual 7-day trend
  change.
  - Simulations (2026-10-17): c and the expenditure are found (±4 %);
    c_train and k barely leave their priors, since a session or a meal
    out is ≈ 0.1 kg, under the water noise, and c's drift absorbs slow
    changes. Their σ says so; the expenditure stays right.
- **Code:** `apps/v2/src/core/engines/body/` (weigh-ins, density, filter;
  the E4a priors next). c_train does not drift: compensation is a trait.

### E4a The expenditure prior, piece by piece (2026-10-16)
Every piece below is a **prior**: the filter's learnt factors (c, c_train)
correct it from the weight trend. The priors decide how fast the estimate
is right in the first weeks, and how well a single day is explained.
- **Training, set by set** (gym mode already records what is needed):
  - **Work time** per set, measured from the set's start and end in gym
    mode; when not timed, reps × tempo by movement (≈ 3–4 s per rep for
    compound lifts, ≈ 2.5–3 s for isolation).
  - **Exercise class.** MET on work time, scaled by the set's relative
    intensity (load ÷ e1RM, or RIR when there is no e1RM):

    | Class | MET on work time |
    |---|---|
    | lower-body compound | ≈ 6 |
    | upper-body compound | ≈ 5 |
    | isolation and machines | ≈ 3.5–4 |
    | core and bodyweight | ≈ 3.8 |
  - **Rests:** measured, at ≈ 1.5–2 MET; the setup between exercises
    counts as rest.
  - **After the session**, in two parts:
    - the first 1–2 hours (EPOC): + 5–15 % of the session's net cost,
      higher with short rests and many hard sets;
    - a long tail of up to 24–48 h after hard or new work: resting
      metabolism + ≈ 3–5 % the next day, about 50–90 kcal here. It is
      smaller for a trained person and for repeated sessions of the
      same kind.
  - **Why not one MET for the whole session**, as v1 did: a MET counts
    the rests as work. Today's session lasted 55 min with 17 min of
    sets; v1's ≈ 277 kcal becomes ≈ 109 for the session plus the tail
    the next day.
  - **What the person does after training** is partly compensated
    (sitting more, moving less: Careau 2021, ≈ 25 %). The filter's
    c_train learns the net effect for this person.
  - **Tonnage** (sets × reps × kg) is a check, not the driver.
    Mechanical work (load × range of motion × g, at ≈ 20–25 %
    efficiency) gives a floor for the working sets. A session's kcal
    should not move by tonnage alone: heavy low-rep work costs less
    per kg lifted.
  - **Context:**
    - frequency and habituation lower the cost of a repeated session;
    - sleep debt and heat raise the perceived effort but barely the
      cost; they are shown, not added;
    - Careau 2021 compensation (≈ 0.75) stays in the prior.
  - **Shown on the session:** "≈ N kcal: work X min · rests Y min ·
    after Z", with its range.
- **Steps by cadence band:**
  - incidental bouts under 100 steps/min at ≈ 2.0–2.5 MET;
  - walks of 100 steps/min or more at ≈ 3.0–3.8 MET;
  - net of 1 MET, by body mass.
  - The bands come from the phone's minute counts when available, else
    from the share of steps in bouts of ≥ 10 min.
- **Sedentary time and time on one's feet:**
  - The everyday factor comes from the day's blocks: study, work and
    commute are seated or on one's feet, from the day type.
  - It is no longer a single "level" chosen once.
  - Long seated blocks are shown, as context for steps and mood; they
    are not judged.
- **Shown in Andamento → Energia:**
  - the learnt expenditure ± σ next to the sum of its priors (base,
    everyday, steps, training, food's thermic effect);
  - the gap between the two, which is what the filter learnt about this
    person.
  - Sources: Ainsworth 2011 (Compendium); Careau 2021; Reis 2017 and
    Vezina 2014 (resistance-exercise energy cost); Tudor-Locke 2018
    (cadence bands).
- **Code:** `apps/v2/src/core/engines/expenditure/`. v1's three levels are
  points of a line in hours on one's feet; without an e1RM a set's
  intensity comes from reps + RIR (Epley), the MET scaled to 75 % of 1RM.

## E5 Targets (food)

From the weight goal (a goal with "reach W by date") and E4:
- pace % BW/week planned within ranges (v1 ADR-0045):
  - lose 0.5–1.0;
  - gain 0.10–0.25;
  - recomposition ±0.05–0.5;
- deficit = pace × W × ρ / 7;
- kcal = E(t) − deficit ± template shift, ≥ floor (BMR or 1,200);
- protein 1.6–2.2 g × reference weight (target weight, or lean mass when
  body fat is known: 2.3–3.1 g/kg FFM, Helms 2014);
- fat ≥ 20 % kcal and ≥ 0.6 g/kg, 25 % by default or the split's;
- carbs the rest; fibre 14 g/1,000 kcal, at least 25 g;
- maxima: sugars 90 g/2,000 kcal (EU RI), saturated < 10 % (WHO), salt
  < 5 g (WHO).
- **Micronutrients:** EFSA's adult PRI or AI by sex and age, with the
  upper level and its scope (a form- or supplement-only UL never judges
  food); sodium 2 g as an upper aim (EFSA 2019). Checked 2026-10-17
  against EFSA's DRV summary (2017) and UL overview (v11, 2025).
- **Week:** targets read in the week (v1 ADR-0047: carry ±30 %, never
  under BMR; protein daily; limits as 7-day averages).
- **Slots:** a meal block's shares × the day's targets; relation hints
  (pre-workout carbs 0.5–1 g/kg 1–3 h before; post-workout protein
  0.25–0.4 g/kg within 2 h; pre-sleep protein ~0.4 g/kg).
- **Code:** `apps/v2/src/core/engines/targets/`; E4's E(t) and ρ come in as
  numbers. v1's pace and week cases run as parity.

## E6 Training (specialisation: training)

- **e1RM with effort:** load × (1 + (reps + RIR) / 30) (Epley with RIR;
  Helms 2016). Without RIR: Epley on reps, 1–12 reps.
- **Loads typed as lifted:** dumbbells "per dumbbell ×2", unilateral
  per side; the stored load is always the total (03 T-10).
- **Context of a set:** order in session, rest before vs planned, sleep
  vs need, check-in z, intake 24–72 h vs target, caffeine now, creatine
  saturation. Shown with the % change, never folded into it (03 P-4).
- **Incoherence flags**, asked before saving, listed in Review:
  - load or e1RM jump ≥ 60 % vs the exercise's trend ("per dumbbell or
    total?");
  - reps beyond a plausible range for the load (e1RM implausible);
  - an exercise's tonnage out of proportion with exercises for the same
    muscles in the same session (> 3× the median per set);
  - duplicated sessions (same day, routine, sets).
- **Next session (session-wide):** double progression on the pattern
  guide, gated by RIR (v1 ADR-0049); then the order effect learnt from
  history, the session volume per muscle (diminishing returns, Pelland
  2024; band 10–20 weekly sets), readiness lowering the whole session.
- **Rests:**
  - heavy compounds (≤ 6 reps or ≥ 85 %) 2–3 min; other compounds
    90–120 s; isolation 60–90 s (Schoenfeld 2016; Singer 2024);
  - between sides 0–15 s;
  - after a warm-up 30 / 45 / 60–90 s by the ramp (practice).
  All editable per exercise.
- **Auto mode timing:** a set's expected duration = reps × this exercise's
  learnt seconds per rep, plus the setup delay.
- **Deload suggestion:** e1RM falling on several exercises for 2+ weeks
  with low recovery, or after N weeks of rising volume.
- **Code:** `apps/v2/src/core/engines/training/`; v1's progression cases run
  as parity. Per side counts ×2 like per dumbbell; N = 6 weeks.

## E7 Judgements: a registry of scoring models

Every score is a declared **scoring model** (concepts §7):
- its parts, each a metric against a band;
- weights with an allowed range;
- locked health limits;
- the sources;
- a version and a date.
The developer can move weights within their range on the score's page
(V-16 "Come valutiamo"), where each part says why it is there and on
which evidence. Health limits cannot be switched off. An edit is dated,
the numbers are recomputed, and the screen says which version made them.
Missing parts are left out and named. Scores of different domains are
never mixed. Each model has its own parts and weights, chosen from its
evidence: models never share a weight pattern by default.

| Model | Parts (default weight, allowed range) | Sources |
|---|---|---|
| Food and meal, per 100 kcal | **density** (40 %, 25–60): protein × DIAAS, fibre, K, Ca, Fe, Mg, vitamins A/C/D, folate, omega-3. **Limits** (25 %, locked ≥ 20): free sugars, sodium, SFA, trans. **Value** (15 %, 0–30): useful nutrients per €. **Fit to its block** (20 %, 0–30): kcal and protein vs the slot's shares | NRF 9.3 (Drewnowski 2009); WHO 2015/2023; EFSA DRVs; FAO 2013 (DIAAS) |
| Day targets | energy in week context, protein daily, limits as 7-day averages (ADR-0047) | ISSN 2017; WHO |
| Distribution | protein spread (meals ≥ 0.25–0.4 g/kg), peri-workout coverage, energy after 21:00 | ISSN 2017; chrononutrition reviews |
| Recovery | sleep vs need and regularity, check-in z-scores, 3-day balance, load trend | Windred 2024; Impellizzeri 2020 |
| Habits, goals | completion, streaks; pace vs needed | — |
| Sleep (a night) | **duration vs need** (40 %, 30–50), **regularity** (40 %, locked ≥ 30): bed and wake times vs the 7-day mean, **how you feel** (20 %, 0–30): the morning check-in | Windred 2024 (regularity ≥ duration for mortality); Hirshkowitz 2015 |
| Training session | **progression** (40 %, 25–50): e1RM or reps at the same load vs the last sessions, **volume** (30 %, 20–40): hard sets vs the block's plan, **effort** (20 %, 10–30): reps in reserve in the planned band, **rests** (10 %, 0–20) | Schoenfeld 2017; Helms 2016 (RIR); Grgic 2017 |
| Weighing | **reliable** (30 %, locked ≥ 20): morning, fasted, after the toilet, same scale; lowered by context — salt or carbs high the day before, legs trained in the last 3 days, a meal out. **Pace** (40 %, 25–55): 7-day trend slope vs the goal's, within 0.25–1 %/week. **Consistency** (30 %, 10–40): valid weighings in the last 7 days. The number itself is never judged; reliability also sets the weighing's weight in the trend (E4) | Thomas 2014; Helms 2014; Zheng 2015 |
| Water | **vs expected now** (50 %, 30–70): the day's need (E10) spread over waking hours. **After training** (30 %, 10–40): 1.25–1.5 × estimated sweat within 2 h. **Spread** (20 %, 0–30): small doses, little in the 2 h before bed | EFSA 2010; ACSM 2007; Shirreffs 1996 |

NOVA is shown, not scored. The parts of a score are what the timeline
box's gradient draws (screens.md).
- **Code:** `apps/v2/src/core/engines/judgements/`: the five models with
  weights above; day targets, distribution, recovery and habits wait for
  theirs. Each part's scorer comes with its domain's slice.

## E10 Hydration
- **Need:**
  - baseline: the EFSA adequate intake (total water 2.5 l a day for men,
    2.0 for women, ~20 % from food);
  - plus sweat losses by session duration, intensity and apparent
    temperature (≈ 0.5–2 l/h, ACSM 2007);
  - plus a margin for heat above ~25 °C.
- **Intake:** drinks, plus food water from the catalogue. Habitual
  caffeine counts as fluid (Maughan & Griffin 2003; Killer 2014).
- **After training, when weighed before and after:** replace 1.25–1.5 ×
  the mass lost (ACSM 2007).
- **Output:** advice with its reason ("+0.4 l: 55 min of training at
  22 °C"), never a judgement.
- **Code:** `apps/v2/src/core/engines/hydration/`, with the water score's
  parts. Sweat 0.5 / 1 / 1.5 l/h by intensity, + 0.05 per °C over 20;
  heat + 0.05 l per °C over 25: assumptions within ACSM's range.

## E11 Environment
- Hourly weather and air quality from Open-Meteo for the day's place (the
  home city; the phone's position when allowed), stored as imported
  entries with their source.
- **Context for:** hydration (E10), sleep (night temperature), mood
  (daylight), outdoor training, and the correlations (E8: e.g. night
  temperature → sleep).
- **Code:** `apps/v2/src/core/engines/environment/`: the requests and the
  reading of answers; the fetch is the server's.

## E8 Correlations

Pairs of daily (or per-session) metrics, after n ≥ 21 paired days:
- Spearman ρ with a bootstrap 95 % interval;
- lagged pairs (today's caffeine after 14:00 → tonight's sleep);
- "may be chance" when the interval crosses 0;
- never advice.
Default pairs come from the kinds' relations; the user can add their own
in Review.

## E9 Data quality

For every kind: missing days, implausible values (per field range),
duplicates, sudden unit-like jumps (×2, ×10, ÷1000), estimated share.
Shown in Review → Data quality, and before saving where cheap (E6
flags). The dumbbell loads of 2026-10-15 are its first test case.
×2 counts only on fields typed per side (loads): steps doubling is real.
- **Code:** `engines/correlations/` (a seeded bootstrap, so the interval
  repeats) and `engines/quality/`.
