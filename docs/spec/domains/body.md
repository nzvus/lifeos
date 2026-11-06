# Corpo — domain rules (weight, energy, sleep, movement)

Status: **draft 2026-11-06, phase 2b** (PRD-40). Only body rules, formulas, thresholds; the
horizontal is cited (MOD-10/12 voce and confidence, MOD-40…44, MOD-54/55, PAT-51/55). IDs `BD-nn`.
Sources: ledger IDs, phase 1 answers (`n10`, `x05`: `audit-2026-11/needs.md`), `v2/engines.md`,
dossiers, ADRs. «Today» = `apps/v2/src`, read 6 Nov. Ledger fold: `audit-2026-11/fold-body.md`.

## 1. Weight
- **BD-01** One estimator for every screen: the E4 Kalman filter, state [W, c, cT, k], daily step
  W += (weighed + k·estimated − c·B − cT·T − S) / ρ. ρ asymmetric: fat 9 440, lean 1 820 kcal/kg,
  fat share = FM / (FM + 10.4) (Forbes 1987, Hall 2008), never a flat 7 700. Scale noise 0.6 kg,
  variance × 2 for water that lasts days. Outputs W ± σ and E ± σ, used directly. [BODY-03,
  BODY-12, E4] — Today: partial: `engines/body/filter.ts` feeds targets and Energia; the weight
  chart smooths on its own (`features/progress/tracker.ts` `smoothWeight`): a second estimator.
- **BD-02** A weigh-in is never corrected, it gets a reliability: standard (fasted, after the
  toilet, known hour) 1 · unknown 0.75 · each clue multiplies: after food > 100 kcal 0.5, after
  training 0.6, from 12:00 0.7, before the toilet 0.85, yesterday's carbs ±30 % of the 14-day
  mean 0.8, salt +30 % 0.85, night < 6 h 0.9 · floor 0.25 · implausible jump 0.02. Clues shown
  in words (MOD-53). [BODY-22, ADR-0027, ADR-0031] — Today: partial: `weigh-in.ts`; the filter's
  run (`core/energy/week.ts`) passes only what was said, the hour and «implausible».
- **BD-03** Weighing voto parts (MOD-43): `reliable` (BD-02); `pace` = actual kg/week against the
  goal's, 1 from 0.8 × needed up to 1 % of W a week (Helms 2014), 0 at 0.5 % outside; a goal
  within 0.3 kg = keep ±0.25 %/week; `consistency` = plausible weigh-ins in the last 7 days, 5 =
  full (Zheng 2015). The scale's number is never judged. [BODY-22] — Today: built (`weighing.ts`).
- **BD-04** Intake certainty per day, for the filter: closed complete ±10 % weighed, ±30 %
  estimates · closed partial: at least what was logged, else the neighbours, ±30 % · not closed:
  logged ≥ 60 % of the day's prior → as complete + 10 %, else as partial · unlogged: mean of the
  trusted days within ±7, ±35 %. [ADR-0041, ADR-0042, E4] — Today: built (`filter.ts`).
- **BD-05** k (estimated food): prior 1.15 ± 0.15; learnt only while estimates ≤ 50 % of logged
  kcal, else k = 1 and estimates only widen σ. If k settles outside 0.9–1.4: one advice (MOD-52)
  «le tue stime sono corte: aggiungi ~X %». [ADR-0042, BODY-18 F] — Today: partial: k learnt;
  the advice not built.
- **BD-06** Only fatto voci feed the filter and the calibration; previsto ones never. [BODY-15]
  — Today: built (`core/energy/read.ts` reads done entries only).

## 2. Expenditure: the priors (E4a)
- **BD-10** BMR: Mifflin-St Jeor; Katch-McArdle (370 + 21.6 × lean kg) when a body fat % is
  measured (BD-70). [BODY-03, BODY-16, Frankenfield 2005] — Today: partial: `bmr()` has both;
  the day's pipeline never passes a measured % (`core/energy/day.ts` `DayBody`).
- **BD-11** Everyday factor × BMR by hours on feet (BD-42), walking excluded: 2 h 1.15–1.25 ·
  5 h 1.20–1.32 · 8 h 1.27–1.42, linear between, flat outside (FAO/WHO 2004 bands without
  walking; Levine NEAT). [BODY-19, ADR-0051] — Today: built (`everyday.ts`).
- **BD-12** Food's thermic effect 8–12 % of the day's intake, a share **inside** the everyday part
  («Digerire», di cui), never added on top. [BODY-20, ADR-0021, E4a] — Today: built; open defect
  (BODY-30): on a big-intake day the carve-out makes «La giornata» read «+ 0 kcal».
- **BD-13** A gym session, set by set, net of 1 MET: work time measured, else reps × 4 s; MET on
  work time by class (lower compound 6, upper 5, isolation 3.5–4, core 3.8) × intensity (load ÷
  e1RM against 0.75, clamped 0.6–1.3; RIR/Epley without e1RM); rests 1.5–2 MET; floor 3.5 MET
  over the session's minutes (Compendium 02054, Herrmann 2024); EPOC + 5–15 %; next-day tail
  3–5 % of BMR, halved for repeated work. Tonnage is a check.
- **BD-14** The row shows the session's
  own cost; the day counts training × 0.75 (Careau 2021), cT learns the rest. [BODY-04, BODY-14,
  BODY-20] — Today: built (`expenditure/training.ts`, `core/energy/day.ts`).
- **BD-15** Runs and walks with a distance: ACSM (±10 %), running from 134 m/min; other cardio:
  MET band × minutes (moderate 4–7). [energy-day slice 3] — Today: built (`acsm.ts`, `classes.ts`).
- **BD-16** A previsto session enters only «a fine giornata»: his median length (else 60 min) ×
  3.5–5 MET, said «prevista»; it leaves when the day ends undone. [BODY-02] — Today: built.

## 3. Expenditure: learnt, calibrated, shown
- **BD-20** The expenditure is the filter's E ± σ (BD-01): learnt from intake and weight,
  automatic, nothing to accept, no stored factor; reversible: computed on read, the week (BD-30)
  remade by «Ricalcola la settimana» and, automatically, when a past day's food or a weigh-in
  changes. [BODY-13, BODY-30, c07, MOD-54] — Today: partial: the automatic stale remake not built.
- **BD-21** Priors of the factors: c 1 ± 0.12 (drift 0.015²/7 a day), cT 1 ± 0.25 (no drift),
  k as BD-05. Window: the 56 days before Monday; the week's E = mean of the filter's last 7 days.
  [E4, targets §9] — Today: built (`week.ts`).
- **BD-22** Calibration t of a day = the week's learnt E ÷ the same week's priors, used only
  within 0.6–1.6 (else the plain priors); every piece × t, so the pieces still add up; the ± is
  E's σ share; «tarato sulle tue pesate (× 0,99)». [BODY-30] — Today: built (`burn.ts` `tuneOf`).
- **BD-23** One number first, the width only when opened (PRD-19, PRD-20): the day «≈ 2.740 kcal»,
  a row «≈ 310 kcal»; the ± and the pieces in its «Perché?» (PAT-51). Without a learnt week: the
  priors' midpoint «≈ N kcal · dalla formula», the range only when opened, never narrower than
  ±15 % (O'Driscoll 2020). [n05, BODY-30, BODY-26; BODY-02 «ranges everywhere» superseded]
  — Today: partial: the fold head shows «± 280» (`oggi/day-page.tsx:684`); without a week, ranges.
- **BD-24** The pieces of a day: Base · La giornata (h in piedi) · Passi · Allenamento (× 0,75)
  · Digerire, adding up to the total within 1 kcal. Andamento → Energia: learnt E ± σ beside the
  sum of priors and the gap; c, cT, k with σ; any day's pieces by a day picker. [BODY-02, E4a,
  targets §10] — Today: partial: week means and gap built; the day picker not.
- **BD-25** Coverage (PAT-55): under 14 days of weigh-ins and food «stima dalla formula (pochi
  dati): si affina con le pesate»; no weigh-in in 7 days: «l'andamento è vecchio». [targets §6]
  — Today: partial: only the goal row says «nessuna pesata negli ultimi 7 giorni».

## 4. Energy of the day and the week's targets
- **BD-30** The week's energy is decided once (MOD-44), on the first open of a day in it:
  kcal = E − deficit; deficit = the goal's pace × ρ(W) ÷ 7, ≤ 500 kcal in a recomposition
  (Murphy & Koehler 2022); never under BMR. Protein, fat and the rest are food's (MOD-42).
  [targets §9, BODY-26] — Today: built (`week.ts`, `core/day/targets.ts`).
- **BD-31** Targets do not follow the day: a session does not raise today's kcal, a skipped one
  does not make the day «over»; the day box shows the gap to the week's mean («oggi ≈ +350 kcal
  sulla media»), Monday's run takes it in. [energy-day §9.3; BODY-17 resolved] — Today: partial:
  targets stable; the gap line not built.
- **BD-32** The day's line, live: «Speso finora» = everyday part × the share of the day gone +
  done steps and training; «a fine giornata» = the whole day + previste (BD-16); a past day: its
  total. [BODY-02] — Today: built (`dayBurnLine`).

## 5. Inputs: steps, hours on feet, trips
- **BD-40** Steps = one reading a day: the phone's count, typed once (or the next morning for
  yesterday), confidence 1. Readings are never summed; the most reliable wins. No count → no
  steps piece (hours on feet and the learnt E carry the day); never a guess from a level, never an
  assumed baseline (PRD-22). [BODY-32, n10, c06, BODY-01] — Today: partial: one typed count a
  day; no source on the value («telefono»).
- **BD-41** Steps priced by cadence, net of 1 MET by body mass: without minute counts 30 % in walks
  (≥ 100 steps/min, 3.0–3.8 MET), the rest incidental (2.0–2.5 MET). First subtract the steps of
  runs and walks priced by distance (run 165/min; walk metres ÷ (0.415 × height)). [E4a,
  Tudor-Locke 2018, ADR-0030] — Today: built (`day.ts`, `everyday.ts`).
- **BD-42** Hours on feet: a number 0–16, step 0.5, on the day. Unsaid → an old level read as
  hours (seduto 2 · misto 5 · in piedi 8) → his median of the 14 days before (estimate 0.6) → 3 h
  (assumed 0.3); both marked «stima» until touched. Words only read the number: < 2 «quasi
  sempre seduto» · 2–4 «per lo più seduto» · 4–6 «metà e metà» · 6–8 «molto in piedi» · 8–10 «in
  piedi quasi tutto il giorno» · 10+ «lavoro fisico». [BODY-02, BODY-19, ADR-0051] — Today: built
  (`feet.ts`).
- **BD-43** A tragitto is a shortcut: one tap logs a repeated trip (MOD-14, PAT-60). Its walking
  is already in the phone's count, so it adds neither steps nor kcal. [BODY-27, BODY-01, x05]
  — Today: built (`core/movement/routes.ts`, #292; no energy link).
- **BD-44** A native shell reading Health Connect (steps, sleep) is a future change with its ADR,
  after phase 4; the same readers take its pieces. [BODY-32, BODY-28] — Today: not built.

## 6. Sleep
- **BD-50** A night from pieces: pieces with 0 < length ≤ 14 h; overlaps merge (union); pieces
  join while the gap ≤ **G = 2 h**; a period has bed, wake, TST = Σ asleep, WASO = gaps,
  awakenings = their count. The stored kind (sleep / nap) never decides counting. [BODY-29,
  sleep §5] — Today: built (`core/engines/sleep/periods.ts`).
- **BD-51** Attribution: a period belongs to the **calendar date of its wake** (not the 04:00
  logical day); the longest TST of the date is «la notte», the others are naps; 24-h sleep = all
  of it (Jackson 2014). [BODY-29, sleep §5.3] — Today: built.
- **BD-52** The sheet places by instants: «Sveglia» = the latest instant at that clock time not
  after now within (D−1 04:00, D+1 04:00] (a past page: its own date); «A letto» the latest
  before it (< 24 h); a live line «Notte tra giovedì 29 e venerdì 30 · 3 h 30»; on joining
  «Aggiunto alla notte: in tutto …» with Annulla. [BODY-29, sleep §5.0, §6] — Today: partial:
  placing and the line built; the day chip per time and the joining toast not.
- **BD-53** Sleep voto (registry `sleep` v2): duration 35 (25–50) = band(24-h h, 7–9, tolerance
  2 h) · regularity 35 (locked ≥ 30) = mean gap of bed and wake from the 7 main sleeps before,
  1 within 30 min, 0 at 2 h, needs 3 nights · continuity 10 (0–20) = WASO, 1 at ≤ 20 min, 0 at
  60, null for one piece with nothing typed · feel 20 = quality and the morning energy. Need
  7–9 h fixed (Hirshkowitz 2015; Windred 2024; Ohayon 2017). [BODY-29, BODY-24, BODY-07]
  — Today: built (`sleep.ts`, `judgements/registry.ts`).
- **BD-54** Naps are described, not scored: ≤ 30 min before 16:00 «breve, buon orario»; 30–60 min
  «possibile intontimento al risveglio»; ≥ 60 min «lungo» with the evidence's caveat; ending after
  17:00 «tardi: può spostare l'ora di dormire». [sleep §5.6] — Today: not built.
- **BD-55** Every reader uses the period: weigh-in «hours slept» = main TST; water's wake and bed;
  Oggi's countdown bed; the tracker's 24-h bars with naps lighter, «sotto le 7 h», «notti
  spezzate». Quality = the last piece's, else the mean of those said. [sleep §5.7] — Today:
  partial: readers built (`sleepOfDay`, `nightOf`); stacked naps, «notti spezzate» not.
- **BD-56** Awakenings typed on a one-piece night (count, minutes), optional. [sleep §4] — Today:
  not built.
- **BD-57** Sleep stays out of the expenditure (falsely precise). [BODY-24, ADR-0031]
  — Today: built.

## 7. Water and weather
- **BD-60** Water need: EFSA total water 2.5 l (men) / 2.0 l (women), ≈ 20 % from food; + sweat
  per session 0.5 / 1 / 1.5 l/h by intensity, + 0.05 l/h per °C apparent over 20 (0.5–2 l/h);
  + 0.05 l per °C of the day's highest apparent over 25; habitual caffeine counts as fluid; after
  weighed training replace 1.25–1.5 × the loss (ACSM 2007). Advice with its reason. [BODY-05,
  E10] — Today: built (`core/engines/hydration`).
- **BD-61** Weather: Open-Meteo hourly for his city, read live (one-hour cache), as context only
  (water's heat margin, the night's temperature beside sleep: MOD-53); never stored as voci.
  [BODY-06, E11, x11] — Today: built (Oggi's card).

## 8. Measurements
- **BD-70** Measurements (body fat %, waist, hip, neck, abdomen) on a weigh-in or alone. A
  measured body fat % replaces Deurenberg's estimate in BMR (BD-10) and in ρ's fat share.
  [BODY-16, ADR-0027] — Today: partial: fields exist; `week.ts` always estimates.
- **BD-71** Indices only as screening, in words, only when their inputs exist: BMI with the WHO
  bands («sovrastima chi ha muscoli»), waist ÷ height (0.5 line), FFMI with a body fat %, US Navy
  body fat from waist + neck. Built when measurements are logged (PRD-02). [BODY-16, BODY-22]
  — Today: not built in v2.

## 9. Correlations
- **BD-80** Only the six default pairs: sleep h → morning energy; sleep h → mood; steps → the next
  night's sleep; training minutes → the next night's sleep; training → the next day's energy;
  stress → the next night's sleep. Spearman ρ, bootstrap 95 % interval, «potrebbe essere caso»
  when it crosses 0, never advice; shown after ≥ 3 months of data and ≥ 21 paired days.
  [MOD-55, E8, BODY-10] — Today: partial: 90 days, n ≥ 21 (`progress/links.ts`); no 3-month gate.

## 10. Not done
- Steps by covered windows, a vertical movement layer, trips priced by speed or turned into steps,
  the incidental baseline, the > 30 % check, routing services, Maps distances, Timeline import
  (x05, c06: the learnt expenditure absorbs constant errors; routes only as a shortcut).
- A recovery score, measured readiness, chosen correlations, a learnt sleep need, SRI, a personal
  caffeine half-life (x08: months of complete daily data first).
- Weather stored as voci (x11). Check-in moments (PRD-02). Targets that follow the day (BD-31).
  A factor accepted by hand, `energy_corrections` (BODY-18, 21, 25: superseded by BD-20/22).
