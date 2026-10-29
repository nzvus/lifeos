# Dossier — the day's energy (what each thing burns, live)

Status: **draft 2026-10-29**. **Slice 1 built 2026-10-29:** hours on feet as a number (`core/energy/feet.ts`; the steps sheet asks «In piedi oggi», unsaid → your 14-day median, never the silent «seduto»), the day priced piece by piece (`core/energy/day.ts`, shared with `week.ts`), each done session and the steps with «≈ … kcal» on Oggi, the day's line «Speso finora · a fine giornata · h in piedi». **Slice 2 (29 Oct):** sessionCost checked against the 2024 Compendium (floor, see §7), the row shows the session's own cost, ranges at least ±15 %, «Energia del giorno» on Oggi folds open on the pieces (base, giornata with where its hours come from, passi, allenamento × 0,75, digerire). **Slice 3 (29 Oct):** runs and walks with a distance by ACSM (`engines/expenditure/acsm.ts`, ±10 %), their steps taken out of the phone's total (running 165 steps/min, walking by the stride 0,415 × height), planned sessions in «a fine giornata» at the person's median length in the Compendium's 3,5–5 MET band, said so. Not yet: trips (no distance in their data yet), Andamento's day picker. **Decided 2026-10-29 by the agent at the
developer's request** («procedi senza di me… fai le scelte migliori»): §9 as
recommended; the developer reviews after. Method: `../method.md`. Extends
`activity.md` (runs, steps), `session.md` (the gym session) and
`targets.md` (the week's targets). Code it changes: `core/energy/`,
`core/engines/expenditure/` (E4a), Oggi (`features/day/`), the steps entry
(`core/kinds/builtins.ts`), Andamento → Energia.

## 1. Question
"When I train, walk or stand all day, show me what it burned, on the thing
itself and on the day, and let the estimate follow what I actually did."
The developer (29 Oct): «se una giornata faccio sessioni di allenamento, non
vedo il loro consumo calorico stimato, o è voluto? … non dovrebbe essere
tutto dinamico, anche passi eccetera? poi divisione 2, 5, 8+ ore di
movimento o sedentarietà mi sembra incomprensibile, dovrebbero esserci più
fasce».

## 2. Today
- **Computed, never shown where it happens.** E4a already prices every
  piece: BMR, the everyday factor, steps by cadence band, a session set by
  set (`sessionCost`), cardio by MET, the thermic effect of food. The only
  place they appear is Andamento → Energia, as **daily means over the
  week** (`features/progress/energy.ts`). A session row on Oggi, the steps
  row and the day box carry no kcal.
- **On purpose, only half.** Targets are set once a week from the 7-day
  mean (`core/energy/week.ts`, targets.md §9, 24 Oct), so one session does
  not move the week's targets. That decision stands; hiding the day's own
  burn was never decided.
- **Three words for a continuous thing.** The everyday factor is already a
  line through three points, 2 · 5 · 8 hours on one's feet
  (`everydayFactor`, ADR-0051's FAO/WHO bands without walking), but the
  only input is the steps entry's `level`: seduto 2 h · misto 5 h · in piedi
  8 h. Nothing between, and nothing says what "misto" means.
- **A regression since #299.** The steps form no longer asks the level
  (activity.md §9). `week.ts:158` falls back to «seduto» (2 h), so from 29
  Oct every day counts as sitting, whatever was done.
- `hoursOnFeet(blocks)` exists (time on feet from the day's blocks, each
  seated or standing) but nothing calls it: the day models hold no blocks
  (export 29 Oct: 12 day models, 0 blocks).
- **His data** (export 29 Oct, last 8 days): steps 5 000–18 000, level
  «seduto» on 4 days (incl. 15 000 steps on 27 Oct), «misto» on 4. Steps
  and time on feet were read as the same thing.

## 3. Evidence
- **Physical activity level** (FAO/WHO/UNU 2004, *Human energy
  requirements*; G): PAL = TEE ÷ BMR; sedentary 1.40–1.69, active
  1.70–1.99, vigorous 2.00–2.40. These bands include walking and exercise;
  E4a counts those apart, so its everyday factor stays below them
  (1.15–1.42).
- **Activity costs** (Ainsworth et al. 2024 Adult Compendium of Physical
  Activities; G): sitting quietly ≈ 1.3 MET, standing light work 1.8–2.5,
  standing moderate (shop, kitchen, warehouse) 2.5–3.5. An hour standing
  instead of sitting ≈ +0.7–1.2 MET-h ≈ +55–95 kcal at 80 kg.
- **NEAT varies a lot** (Levine 2002, 2005; M): up to ~2 000 kcal/day
  between people of the same size, mostly time standing and moving.
  Hence a number of hours, not a label.
- **Steps by cadence** (Tudor-Locke 2018; G) and **walking/running by
  speed** (ACSM equations; G) as in activity.md §3.
- **Precision:** any single-day burn has ±15–25 % error (wearables
  included; O'Driscoll 2020 meta-analysis; M). Show ranges, never one
  number; E4's filter corrects the whole from the weight trend.

## 4. Data
| What | Stored | Change |
|---|---|---|
| Time on one's feet | today: `level` on the steps entry | **hours** (`onFeetH`, 0–16, step 0,5) as a field of the day (`day` entry value), the level kept for old days (seduto 2 · misto 5 · in piedi 8) |
| Default when unsaid | «seduto» | the person's median of the last 14 days with a value, else 3 h |
| Steps | the phone's running total (activity.md) | none |
| Session / cardio / trip | sets, minutes, km | none: priced on read |
No new table; one entry value (`onFeetH`) on the day. No migration: old
levels map to hours when read.

## 5. Model
- **Per entry, on read** (pure, `core/energy/day.ts`, new): a gym session
  → `sessionCost` (work, rests, after-burn × 0,75); cardio and runs → ACSM
  or the MET band × minutes; a trip or walk → its steps or minutes; the
  steps row → steps by cadence band, minus the steps of runs and trips
  already counted. Each a low–high range, net of rest (the BMR already
  counts that hour).
- **The day** = BMR × everyday factor(hours on feet) + steps + sessions +
  cardio + thermic effect of what was eaten. **Live**: «finora» counts BMR
  and the everyday part up to now, plus what is logged; «a fine giornata»
  adds the rest of the day at the same pace and the planned sessions
  (marked as planned).
- **Hours on feet** are continuous (interpolated between 2, 5 and 8 h,
  flat beyond 0–2 and 8+ as today). The words are only a reading of the
  number, in finer bands: 0–2 h «quasi sempre seduto» · 2–4 «per lo più
  seduto» · 4–6 «metà e metà» · 6–8 «molto in piedi» · 8–10 «in piedi quasi
  tutto il giorno» · 10+ «lavoro fisico».
- **Targets do not follow the day.** The week's targets stay as decided
  (targets.md §9). The day shows its burn and, on the day box, the gap to
  the week's mean («oggi ≈ +350 kcal sulla media della settimana»). The next
  Monday's recompute takes the day in through the 7-day mean.

## 6. Experience
- **A session row** (Oggi timeline, session summary): «Push · 63 min · 27
  serie · ≈ 250–380 kcal». The same on a run («Corsa · 5 km · 28 min · ≈
  330–400 kcal»), a trip, the steps row («15 000 passi · ≈ 450–600 kcal»).
  Planned ones in the planned style, with «previste».
- **The day box** gains one line: «Speso finora ≈ 2 050–2 350 kcal · a fine
  giornata ≈ 2 750–3 100». Tapping it opens the pieces (the Andamento →
  Energia rows, for this day): base, giornata (h in piedi), passi, palestra,
  corsa, digerire.
- **Hours on feet**: one stepper on the day («In piedi oggi: 3,5 h · per lo
  più seduto»), pre-filled from the person's median and marked «stima»
  until touched; also offered in the steps sheet. No level choice anywhere.
- **Andamento → Energia** keeps the week's means and adds the day picker:
  the same pieces for any day.
- Ranges everywhere; «≈» and the band, never a single kcal figure (P-rules,
  content.md).

## 7. Edge cases
A day with no steps and no hours (the median, «stima»); a session left
open (priced on its sets so far); a run with the phone's steps (its steps
subtracted from the day's total, activity.md §5); a planned session never
done (drops out of «a fine giornata» when the day ends); days before 29 Oct
(their level read as hours); travel days with 25 000+ steps (steps priced,
hours unchanged); hours over 16 (refused: the stepper stops).

**Checked 29 Oct (was open after slice 1):** the 22 Oct Pull (53 min,
24 work sets) priced at ≈ 80–110 kcal. Two causes. (1) The set-by-set sum
was ≈ 2/3 of the 2024 Compendium's whole-session value (02054, 3.5 MET:
resistance training, multiple exercises, 8–15 reps), because the rests at
1.5–2 MET under-price the recovery between sets. Fix: the Compendium is a
floor, net of rest (engines.md E4a). (2) The row showed the day's prior,
× 0.75 for the compensation (Careau 2021), which belongs to the rest of
the day, not to the session. Fix: the row shows the session's own cost;
the day keeps the × 0.75. The same Pull now reads ≈ 200–280 kcal. Every
range is at least ±15 % (§3), so a floor never reads as one exact number.

## 8. Acceptance tests (from his days)
1. 27 Oct, Push 08:01–09:04, 27 work sets, his weight trend → the session row shows
   `sessionCost` of those sets as a range; the day's pieces add up to the
   day total within 1 kcal.
2. 27 Oct, 15 000 steps, level «seduto» → read as 2 h on feet; the steps
   row shows its own range; changing the day to 5 h moves «giornata» by
   BMR × (factor(5) − factor(2)) and nothing else.
3. 29 Oct, steps with no level → hours = his 14-day median (levels read as
   hours, 21–28 Oct: 2, 5, 2, 5, 5, 5, 2, 2 → 3,5 h), marked «stima»; never the silent
   2 h of today.
4. 3,5 h on feet → factor halfway between the 2 h and 5 h points (1,175–
   1,285), label «per lo più seduto».
5. A day with a 5 km run in 28 min and 12 000 phone steps → the run's
   4 620 steps (165 a minute) come out, the steps are priced on 7 380; the
   run by ACSM (≈ 11,2 MET ± 10 %); the day counts the run once.
6. Any day of a week → the macro targets on Oggi are the same before and
   after logging a session; only the day's burn line changes.

## 9. Questions for the developer — decided 2026-10-29, as recommended
1. **Show each session's, run's and the steps' burn on their rows, as a
   range?** Recommended: yes.
2. **Hours on feet as a number with finer words, instead of three
   levels?** Recommended: yes, default from your own median.
3. **Should the day's targets follow the day's burn** (eat back what you
   burn)? Recommended: **no**: the week's targets stay (one session does
   not set the week, targets.md §9); the day shows the burn and its gap to
   the week's mean, and Monday's recompute takes it in.
4. **A live «finora / a fine giornata» line on the day box?** Recommended:
   yes, with the planned sessions marked.
