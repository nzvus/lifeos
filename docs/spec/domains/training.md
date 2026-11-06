# lifeos — domain: training (palestra, attività)

Status: **phase 2b, 2026-11-06**, under `product.md`, `model.md`, `patterns.md` (PROD-44,
ADR-0061). Only what is specific to training: rules, formulas, thresholds; everything
horizontal is cited. Specialisation: `core/training`, `core/engines/training` (MOD §8).
Ledger fold: `audit-2026-11/fold-training.md`. Sources: **E6** `v2/engines.md` · **tr**
`v2/dossiers/training.md` · **se** `session.md` · **act** `activity.md` · **n/c/x**
`audit-2026-11/needs.md` (his decisions, PROD-40). Paths under `apps/v2/src/`; «Today» = 6 Nov.

## 1. Session structure
- **TR-01** A **sessione** (voce, interval) holds its exercises in the order actually done
  (position rewritten on reorder), each holding **serie**. A serie: reps, load, RIR
  (optional), warm-up, side (sx/dx for a one-side exercise), start, end, confirmed. The
  exercise's kind sets what a serie asks: carico × ripetizioni · corpo libero (ripetizioni) ·
  a tempo (secondi) · cardio (one bout: durata, distanza, velocità, pendenza).
  [TRAIN-27, kinds «Training and movement», se §4, MOD-01] — Today: built.
- **TR-02** Loads are typed as lifted: «totale», «per manubrio» (× 2 shown), «per lato»; the
  stored load is always the total, with the text as typed and a «circa» flag. Load step:
  2,5 kg from 20 kg, else 1 kg. Dumbbells step by the rack's next pair: 1 kg a dumbbell under
  10 kg, 2 kg from 10 kg (the total moves by twice that). [TRAIN-19, TRAIN-27, TRAIN-31, E6]
  — Today: built (`schema/facts.ts` `loadEntry`, `progression.ts` `dumbbellStep`).
- **TR-03** **Warm-ups are generated**, on by default, skippable: an exercise gets a ramp when
  no exercise done before it today had its primary muscle group as primary, and its first
  work load ≥ 2 × the load step. The ramp is his own when ≥ 5 past ramps of the same length
  exist (median % of the first work load and median reps per step; today 50/67/80 %), else
  **50 % × 8, 80 % × 3**. Loads round down to the step; never 0, never the work load, never
  twice the same. An exercise for muscles already warm gets one «serie di avvicinamento»
  80 % × 3 only when its load is > 1,3 × the heaviest load used today on those muscles.
  [TRAIN-08, se §5.1, Ribeiro 2020/2021] — Today: built (`engines/training/warmups.ts`).
- **TR-04** Warm-up sets never count in volume, progress, records, voto or working rests.
  [TRAIN-29, TRAIN-04] — Today: built.
- **TR-05** An exercise with no set at «Finisci» is saltato. Order changes stay in the session;
  they reach the scheda only through «Salva nella scheda» (PAT-22). [TRAIN-08, se §9.4] — Today: built.
- **TR-06** Times: rest = next start − previous end, derived, never typed; only the planned
  rest is stored. Active minutes = first start → last end. An unknown time is a gap, never
  invented (PRD-22); editing one time moves the following ones as a chain. [TRAIN-14,
  TRAIN-17, TRAIN-26, TRAIN-34] — Today: partial (derived rests built; chain edit not built).
- **TR-07** The gym timer (a PAT-63 instance) has these states: prima → [riscaldamento] →
  serie → pausa → … → cambio esercizio → riepilogo → finita (⇄ Riprendi); one primary per
  state (Inizia · Serie fatta · Salta la pausa · Inizia il prossimo · Finisci), rebuilt from
  saved instants on every load. [TRAIN-09, TRAIN-26, se §5.6] — Today: partial (resume built;
  labels differ from `Gym.tsx`, audit B).

## 2. Rests and auto mode
- **TR-10** **Planned rest** of a working set: a rest set on the exercise wins; else his
  median of the measured gaps between its working sets (≥ 5, gaps < 20 min, not between the
  two sides), clamped to a floor of 60 s and a cap of 180 s (compound) or 120 s (others);
  else the role's default: heavy compound (≤ 6 reps or ≥ 85 % e1RM) 120 s, other compound
  90 s, isolation and core 60 s. Shown with its source («tua media 78 s»). [TRAIN-03,
  TRAIN-14, TRAIN-05, tr §5.4, E6; ACSM 2009, Schoenfeld 2016, Singer 2024] — Today: built
  (`rests.ts` `learntRest`).
- **TR-11** **Adaptive:** +30 s (up to the cap) when reps fall ≥ 2 across sets at the top load
  in 2 of the last 3 sessions; −15 s (not below 60 s) when they never fell in the last 3 and
  the last set's RIR was ≥ 2. Proposed, shown with the change. [TRAIN-03, TRAIN-11, tr §5.4]
  — Today: built (`adaptRest`).
- **TR-12** After a warm-up set: his median rest after warm-ups (≥ 5), else 45 s, within
  30–120 s; the same before the first work set, not a longer one. Between exercises: his
  median transition (≥ 5), else 90 s. [se §5.1 (59 s, n 43), TRAIN-05] — Today: built.
- **TR-13** **One side at a time:** between the two sides only the setup (the exercise's,
  default 5 s, at most 10 s); after the pair, the planned rest minus the other side's set
  time, at least 30 s. Each side is timed on the set's clock. [TRAIN-05, TRAIN-31, TRAIN-32,
  tr §5.4] — Today: built (`unilateralRests`).
- **TR-14** Superset (agonist–antagonist only, no shared muscle group): A, B after 15 s, then
  the longer of the two rests. [TRAIN-08, se §5.2, Zhang 2025] — Today: built (`superset.ts`).
- **TR-15** **Start delay** (manual mode): «Inizia» runs the exercise's setup countdown
  (editable per exercise), then the set starts; the stored start is the end of the delay.
  [TRAIN-13, TRAIN-32] — Today: built (`Gym.tsx` `begin`, `ExerciseSettings.tsx`).
- **TR-16** **Auto mode** (toggle, no setup delay): set clock = reps × seconds per rep (the
  exercise's median of timed sets, ≥ 5; else his, ≥ 5; else 3,5 s); one side: 2 × side +
  between sides. At the end: beep + vibration → rest countdown → next set; a 3-2-1 cue before
  the set; Wake Lock re-asked on return. One tap corrects the reps. [TRAIN-12, TRAIN-32,
  TRAIN-03, E6] — Today: partial (all but the 3-2-1 cue).
- **TR-17** Auto-mode sets are **presunte** (MOD-12, confidence 0,3): stored unconfirmed, out
  of history, proposals, trend, records and voto until «Conferma e finisci» in the summary.
  A set left running over 3 × its expected length becomes «da controllare», not presunta.
  [c09, TRAIN-03, TRAIN-11, tr §7] — Today: partial (`write.ts` `done` false + `confirmSets`,
  history reads confirmed only; «da controllare» not built, a reload just drops the set clock).
- **TR-18** A break > 3 × the planned rest and > 10 min is flagged, not counted as a rest.
  [TRAIN-26] — Today: not built.

## 3. Progress (the training parameters of MOD-50)
- **TR-20** **Comparable** (the registry's `comparable` for serie): same exercise (another
  machine or variant is another exercise), same position class (**first** exercise of the
  session with sets, or **not first**), confirmed working sets only, set k against set k, and
  «similar load» = equal, or one load step (TR-02) apart. The comparable session is the most
  recent one that matches, inside the trend window (TR-24). [n06, MOD-50, TRAIN-33] —
  Today: not built (the gym shows «L'ultima volta» without the position class).
- **TR-21** **e1RM** = load × (1 + reps / 30) (Epley), 1–12 reps; RIR **not** added (on ~12 %
  of sets: mixing breaks comparability). Corpo libero: reps; a tempo: seconds. [n06, TRAIN-25;
  Reynolds 2006] — Today: partial (`sets.ts` `e1rm` adds RIR when present).
- **TR-22** After a set, the row says its comparison in words, never a %: same load →
  «stesso carico, +2 ripetizioni» / «stesse ripetizioni» / «−1 ripetizione»; another load →
  «+2,5 kg, stesse ripetizioni». With no comparable: nothing. [n06, MOD-50, TRAIN-07] —
  Today: partial (row compares with the proposal, «+1 rispetto al previsto»).
- **TR-23** **Records** per exercise, from confirmed working sets, all time, from its 3rd
  session: «forza stimata» (best e1RM, TR-21), «carico massimo», and «record a 40 kg»
  (most reps at that load); corpo libero: most reps; a tempo: longest. Presunte and «circa»
  loads never set a record. [n06 («record a 40 kg»), MOD-50] — Today: not built.
- **TR-24** **One trend per exercise**: best e1RM per exercise-session in its usual position
  class (others drawn beside, not fitted); 6 weeks, restarted after a gap > 21 days; < 3
  points → «servono 3 sessioni per un andamento» (PAT-55). Least squares; TE = residuals' SD ÷
  mean (≥ 5 points, else 7 %); «stabile» when |change| < 2 × TE / √n, else «in crescita» /
  «in calo» with %/mese. [TRAIN-04, TRAIN-11, tr §5.2, n06; Hopkins 2000] — Today: partial
  (`trend.ts` fits all positions, with an order regressor at ≥ 8 points).
- **TR-25** Tonnage is work done, never progress. Volume = working sets per muscle per ISO
  week (indirect sets × 0,5) against the fascia 10–20. [TRAIN-04, TRAIN-06, TRAIN-16;
  Schoenfeld 2017, Pelland 2024] — Today: built (`session.ts` `weeklySets`).
- **TR-26** **Context** (MOD-53, MOD-60 windows): night ended ≤ 18 h before; kcal 24 h and
  carbs 3 h before; coffees 3 h before; creatine days ≥ 3 g in 28 (or stores); readiness 1–5 if
  typed; «oggi 3°, di solito 1°»; rest vs planned. One line «Prima: …» beside, no number
  changed. [TRAIN-31, TRAIN-15, c02, tr §4; Grgic 2018, ISSN 2017, Craven 2022] — Today:
  partial (`context.ts` built; `orderNote` adds «−3 % atteso», to remove).

## 4. Advice (the training parameters of MOD-51 and MOD-52)
- **TR-30** **Proposal** for an exercise (MOD-51): double progression on its movement
  pattern's guide (`GUIDES`) from the last two sessions: every working set at the top load at
  the top of the range → one step up, back to the bottom; else weakest set + 1 rep; under the
  range → hold. A tempo and cardio +10 %. No pattern: last sets; nothing: 3 × 10. [TRAIN-25,
  TRAIN-29, E6; ACSM 2009] — Today: built (`nextTarget`, `proposeSets`).
- **TR-31** The proposal applies to the **first** set; set i loses his learnt drop × i (median
  over the last 6 sessions of reps lost per set at one load, ≥ 0). Number of sets = the more of
  the last two sessions. [TRAIN-05, tr §5.5] — Today: built (`advice.ts`).
- **TR-32** **RIR** is one optional tap on the **last** set (0–4+), never a driver of progress.
  When given, it only gates the proposal: RIR 0 on a working set at the top load (except the
  last set of an isolation exercise) → same load; twice in a row → one step down. Effort band
  for a goal of size: compound 1–3, isolation and core 0–2. [TRAIN-03, TRAIN-21, n06; Robinson
  2024, Refalo 2023] — Today: built.
- **TR-33** A **readiness 1–2** typed at the start (or a night < 6 h): same load, one set fewer,
  said with its reason (MOD-52). [TRAIN-05, TRAIN-03, se §5.3] — Today: partial (readiness
  wired, removes the set without saying why; the night not used).
- **TR-34** **Cosa aggiungere**: a muscle under 10 weekly sets → one of *his* exercises for it,
  only in the summary and the scheda, never during sets; over 20 → nothing added.
  [TRAIN-08, se §5.4] — Today: built (`missingVolume`).
- **TR-35** Order proposals, never automatic: «Fai dopo» moves the next exercise sharing no
  primary group; «Cambia» (another of his exercises, not begun); superset offered when the
  estimate exceeds the time left. [TRAIN-08, se §5.2] — Today: partial (no time-short offer).
- **TR-36** **Incoherence checks** before saving: load or e1RM ≥ 60 % above the trend →
  «per manubrio o totale?»; reps > 1,5 × (reps to failure at the trend) + 3; tonnage per set
  > 3 × the median of ≥ 2 same-muscle exercises; the same day, scheda and sets twice.
  [TRAIN-11, TRAIN-16, TRAIN-19, E6] — Today: not built (`sets.ts` `setFlags` written, not wired).
- **TR-37** **Duration** = Σ reps × s/rep + Σ rests + warm-up rests + (exercises − 1) ×
  transition, each his median (≥ 5) else 3,5 / 90 / 45 / 90 s; «~55 min, finisci alle 8:05»,
  live; ±10 % on 7 of his last 10. [TRAIN-05, TRAIN-30, tr §5.3] — Today: built.

## 5. Cardio and activities
- **TR-40** An **attività** is a sessione of one cardio exercise with one bout: «Fatta»
  (ended now, the usual duration) or «Inizia adesso» (PAT-63); fields quando, durata, distanza
  (pace live «6:40 /km»), tragitto, fatica 0–10 (session RPE), FC in «Altro», typed only.
  A gym session may hold a cardio bout with the same fields. [TRAIN-01, TRAIN-37, act §6] —
  Today: partial (sheet built; «Inizia adesso» not built).
- **TR-41** Energy (an input to MOD-54): run and walk by the ACSM equations from speed and
  incline (act §3, ±10 %); other modes by the Compendium band per mode (`CARDIO_MET`; unnamed
  4–7 MET), level by RPE ≤ 4 / 5–6 / ≥ 7; net = (MET − 1) × kg × h; lifting set by set
  (`expenditure/training.ts`). [TRAIN-01, act §5; ACSM 11th ed., Ainsworth 2011, Herrmann
  2024] — Today: partial (built; RPE does not pick the level).
- **TR-42** Comparable for an attività (MOD-50): same mode, same tragitto, RPE within ±1; one
  pace trend over 6 weeks, restarted after 21 days. [TRAIN-01, act §5] — Today: not built.
- **TR-43** Load = RPE × minutes; a week > 1,5 × the 4-week mean → caution «carico doppio
  rispetto al solito» (MOD-52), never a block. [TRAIN-01, act §5; Foster 2001, Nielsen 2014]
  — Today: not built.

## 6. Session voto (MOD-43 instance)
- **TR-50** Parts (weights fixed, x10): **progressione** 40 = share of exercises at least
  equal to their comparable (TR-22, within 1 rep; a set at another load brought to it by
  TR-21 both ways); **volume** 30 = working sets done ÷ proposed, full at 90–120 %, 0 half a
  plan beyond; **impegno** 20 = share of exercises whose last-set RIR is in the band (TR-32),
  left out and named without RIR; **pause** 10 = share of measured rests within ± 30 % of the
  planned. Shown on the session's box on Oggi and Corpo. [TRAIN-06, TRAIN-31, TRAIN-36, E7
  «Training session»; Schoenfeld 2017, Helms 2016, Grgic 2017] — Today: partial
  (`score.ts`: progression compares with the proposal, not the comparable).

## 7. Not done (decided; code still holding them is removed in phase 4)
- **TR-60** Dropped by n06/c02: e1RM with RIR; expected reps from the trend; order as a
  regressor and the order % («−3 % atteso», «dopo 6 serie di petto: −4 %»); a per-person
  model after 8–12 weeks; context folded into a number; per-session % («forza stimata · +2 %
  dall'ultima volta», `present.ts` `strengthPill`); session density.
- **TR-61** Not now: readiness measured from recovery signals, recovery score, deload from
  falling e1RM with poor recovery (x08; `deloadSuggestion` stays unwired); adjustable voto
  weights (x10); «in piedi» and mobility types (PRD-02: no data); watch, GPS or GPX import
  (a change with its ADR); AI advice (PRD-27).
