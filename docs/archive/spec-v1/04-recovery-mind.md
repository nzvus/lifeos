# 04 — Recovery and mind: sleep, check-ins, compounds, readiness

Read from: `core/training/sleep.ts`, `core/mind/*`, `core/supplements/*`,
`core/training/readiness.ts`, schema `sleep_logs`, `day_checkins`,
`ingredient_compounds`. ADRs in force: 0031, 0038 (Mind), 0039, 0049.

## 1. What is collected and derived

| Fact | Entered | Table | Derived / used by |
|---|---|---|---|
| A night: bedtime, wake time, quality 1–5, notes | Today chip "sleep", the night ending that day | `sleep_logs` | hours; score 100 for 7–9 h (AASM/NSF), 50 at 6 or 10 h → day score (20 %), weigh-in clue (< 6 h), readiness (< 6 h), wake and bed on the timeline |
| Mood, energy, stress 1–5, a note | Mind tab / Today chip | `day_checkins` | Mind averages; readiness (energy ≤ 2, stress ≥ 4) |
| Caffeine, creatine per 100 g of an ingredient | Ingredient form | `ingredient_compounds` | caffeine in the body (one compartment, ka 4/h, half-life 5 h; EFSA 400 mg/day, ~50 mg at bedtime); creatine saturation (+1/28 per day ≥ 3 g, −1/35 without) |

## 2. Issues found

**R-1 Sleep is read by duration only.** Quality (typed 1–5) is stored and
never used. Regularity is not computed, though it predicts health outcomes
at least as well as duration (Windred 2024, UK Biobank; Phillips 2017,
Sleep Regularity Index). Timing is not computed either (mid-sleep vs the
person's usual).

**R-2 Recovery is spread around.** Sleep is 20 % of the *food* score;
readiness is three yes/no reasons inside gym mode; caffeine and
creatine are a panel of their own (FEEDBACK 10-11: "dispersivi"). There is
no single answer to "how recovered am I today".

**R-3 One check-in a day, with no time.** Energy in the morning and in the
evening are different facts; the readiness hint reads whichever was
entered.

**R-4 Fixed population constants.** A 5 h caffeine half-life (individuals
range ~2–10 h: CYP1A2, smoking, oral contraceptives). Sleep need fixed at
7–9 h.

**R-5 Nothing correlates.** The developer asks to "intrecciare tutto ciò che
può essere rilevante" (considerations.txt). Sleep, caffeine, late eating,
training and the check-in are all logged with times, but the app never
says what goes with what *for this person*.

## 3. Proposals

💡 **P-1 Sleep, read properly.**
- Duration against the person's own need (learnt: the average on free
  days, bounded by 7–9 h).
- Regularity (SRI, or the SD of mid-sleep over 7 days).
- Timing (mid-sleep vs the usual).
- Quality as typed. Caffeine at bedtime from the model.
- The sleep block of the day template (01 P-6) gives a planned bedtime;
  the evening timeline counts down to it.

💡 **P-2 A recovery score of its own [decision].** It takes sleep out of
the food score (02 P-4). It is built from:
- sleep vs need, and regularity;
- the check-in vs the person's own baseline (z-scores over 28 days, so a
  habitual "3" is not read as poor);
- energy balance over the last 3 days vs target;
- training load trend (this week's volume vs the last 4 weeks; described,
  not used as an injury predictor: the ACWR evidence is contested,
  Impellizzeri 2020).
It feeds training (03 P-7) and says *which* part is low.

💡 **P-3 Check-in with a moment.** Morning (how I woke up), optional
evening (how the day went), plus optional soreness. One tap each from the
timeline; the morning one sits next to "woke up".

💡 **P-4 Personal correlations, honestly.** A "What goes with what" page,
only after enough paired days (e.g. n ≥ 21):
- caffeine after 14:00 → sleep that night;
- late energy → sleep;
- sleep → next-day check-in and session e1RM;
- carbs before training → session e1RM;
- hunger (02 P-6) → protein and fibre of the meal.
Each shows n, the effect size with its interval, and "may be chance" when
it is. Correlation, never advice.

💡 **P-5 Personal caffeine half-life (optional).** A setting (fast /
usual / slow: 3 / 5 / 7 h) until P-4 can suggest one from the
caffeine → sleep pairs.

💡 **P-6 Compounds as entries on the timeline** (02 P-7), the curve drawn
behind the evening part of the timeline.

## 4. Aggregation (this area)

```
raw        night (bed, wake, quality) · check-in (mood, energy, stress, moment) · doses with times
derived    hours, mid-sleep, regularity, debt vs need · caffeine(t), creatine saturation · check-in z-scores
aggregate  7- and 28-day baselines
judgement  recovery score (with its parts) · readiness for training · personal correlations
```
