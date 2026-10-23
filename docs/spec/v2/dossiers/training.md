# Dossier — training (gym mode, progress, rests, auto mode)

Status: **draft for the developer's review** (2026-10-23). Method:
`../method.md`. Code it changes: `apps/v2/src/core/engines/training/` (E6),
`core/training/`, `features/training/`; engines.md E6 and the E7 "Training
session" model.

## 1. Question
"Am I getting stronger and bigger, is today's session coherent with the
others, and what should I do next set — without touching the phone more than
needed?" In the developer's words: the advice on sets is «fatto a caso»; the
percentages of improvement «considerano in modo semplicistico serie e
ripetizioni» and ignore rests, the other exercises, the moment in the
session, energy, sleep, macros, stress, caffeine, creatine; rests between
sides and after warm-ups are too long and not editable; an automatic mode
should chain sets and rests, and a manual mode should wait a per-exercise
delay to get into position (considerations.txt, considerations2).

## 2. Today
**What the code does**
- v1 `core/training/live.ts` `setChange`: % change of a set = reps × kg now
  vs the same set (by position) last time. 10 × 20 kg and 5 × 40 kg are
  "equal"; effort, rest and order are ignored.
- v1 `progress.ts`: a routine's % = session tonnage vs the run before (moves
  with the number of sets and with swapped exercises); an exercise's % = best
  e1RM (Epley, no RIR) vs the one ~4 weeks earlier — two noisy points.
- v2 uses only two pieces of E6: `nextTarget` (double progression per
  exercise, the same reps and load for every set) in `core/training/plan.ts`,
  and `restAfter` by role in `features/training/present.ts`. Written and
  tested but **not wired**: `session.ts` (weekly volume, order, readiness),
  `setFlags`, `expectedSetS` (auto timing), `deloadSuggestion`.
- Rests in E6: compounds 90–180 s, isolation 60–90 s, sides 0–15 s, warm-ups
  30/45/60–90 s; editable per exercise only on paper.

**What the data says** (refined export of 16 Oct, 25 sessions 28 May → 15 Oct;
script: `audit-training.py` next to this file)

| Fact | Value | Consequence |
|---|---|---|
| Working sets with RIR | **0 / 509** | E6's effort gate never runs; e1RM is plain Epley |
| Sessions | median 55 min, 8 exercises, 24 working sets | dense sessions: rests are short in practice |
| Measured rest, bilateral working sets | median **78 s** (IQR 64–81, n 104) | E6 suggests 90–180 s on compounds: «esagerate» is right for how he trains |
| Rest after a warm-up set | median 57 s (n 28) | E6's 60–90 s before the first work set is long |
| Rest in unilateral exercises | median 85 s (n 7); sides not stored | can't tell side-to-side from set-to-set |
| Change between exercises | median 86 s (IQR 78–111, n 48) | a transition time to learn |
| Seconds per rep (timed sets) | median **4.2 s** (n 196) | E6's defaults 2.75–3.5 s are too short |
| Same load, ≥ 3 sets: last − first reps | 0 in 47 of 82; −1…−4 in the rest | the fatigue drop is small but real; proposals ignore it |
| e1RM session-to-session change | median 0 %, IQR ±5.3 %, **SD 14.5 %** | a single-session % is mostly noise |
| Order | Lat pulldown 44 kg e1RM done 4th vs 53 kg done 1st | position is a confounder |
| Break | May → Sep: chest press 73 → 63 kg e1RM after 3 months off | a trend must restart after a long gap |
| Duration from a naive sum (sets × reps × 4.2 s + 78 s rests + transitions) | error median +9 %, IQR −8…+16 % | a learnt estimate can be good |
| Context logged | 11 check-ins, 16 activity days in 4.5 months | readiness can't come from the check-in alone |

## 3. Evidence
Strength: G = guideline/position stand, M = meta-analysis, S = single study,
C = convention, O = opinion.
- **Rest intervals.** Hypertrophy is similar across rest lengths when volume is
  matched; point estimates lean slightly to longer rests for arms/thighs,
  wide intervals (M: Singer 2024, doi:10.3389/fspor.2024.1429789). Longer
  rests (3 vs 1 min) gave more strength and volume in trained men (S:
  Schoenfeld 2016, doi:10.1519/JSC.0000000000001272). ACSM: 2–3 min for
  heavy multi-joint loads, 1–2 min for moderate (G: ACSM 2009,
  doi:10.1249/MSS.0b013e3181915670). Between sides of a unilateral move: no
  study found (C).
- **Volume.** Weekly sets relate to growth with diminishing returns; indirect
  sets count fractionally (M: Schoenfeld 2017,
  doi:10.1080/02640414.2016.1210197; M preprint: Pelland et al. 2024,
  SportRxiv). The 10–20 sets/muscle/week band is a convention built on them (C).
- **Proximity to failure.** Failure vs non-failure: similar growth (M: Refalo
  2023, Sports Med); closer to failure tends to more growth, strength flat
  across RIR (M: Robinson 2024, Sports Med, "proximity to failure
  meta-regressions"). Trained lifters estimate RIR within ~0.5–1 rep near
  failure, worse far from it (S: Refalo 2024; Zourdos 2016,
  doi:10.1519/JSC.0000000000001049; Helms 2016,
  doi:10.1519/SSC.0000000000000218).
- **Order.** Strength gains are larger for exercises done early in the
  session; hypertrophy similar regardless of order (M: Nunes 2021, Eur J Sport
  Sci 21(2):149–157).
- **e1RM.** Epley/Brzycki are reasonable up to ~10–12 reps and degrade beyond
  (S: Reynolds 2006, doi:10.1519/R-15304.1). Estimates from sets short of
  failure are biased low unless RIR is known (S, preprint: arXiv 2603.17495).
- **Noise and change.** A change is real only beyond the measure's typical
  error; compare with the smallest worthwhile change (G-like method: Hopkins
  2000, doi:10.2165/00007256-200030010-00001).
- **Rep duration.** 0.5–8 s per rep gives similar hypertrophy (M: Schoenfeld
  2015, doi:10.1007/s40279-015-0304-0): tempo is for timing, not judging.
- **Context.** Caffeine: small strength gain, SMD 0.20 (M: Grgic 2018,
  doi:10.1186/s12970-018-0216-0); 3–6 mg/kg ~60 min before (G: ISSN 2021,
  doi:10.1186/s12970-020-00383-4). Creatine: muscle stores saturate in ~4
  weeks at 3–5 g/day, or 5–7 days loading (G: ISSN 2017,
  doi:10.1186/s12970-017-0173-z). Sleep loss lowers resistance performance
  (M: Craven 2022, doi:10.1007/s40279-022-01706-y).
- DOIs searched today: Singer, Grgic, Nunes, Refalo/Robinson (titles). The
  others are written from memory and are checked again when the slice cites
  them in code.

## 4. Data
| Datum | How | Precision | Today → proposed |
|---|---|---|---|
| Reps, load | typed, proposal pre-filled | exact | as now |
| **RIR** | one tap **on the last working set** of each exercise (0–4+) | ±1 | never logged → asked, skippable |
| Set start/end | taps, or the auto-mode clock | 1 s | 196 timed sets → every set in gym mode |
| **Side** | unilateral sets stored as left/right pairs | — | not stored → stored |
| Rest | derived: next start − previous end; the planned one stored | 1 s | derived only |
| Position in session, preceding hard sets for the same muscles | derived | — | not used → covariate |
| **Readiness** | one tap at session start (1–5), optional | ordinal | 11 check-ins → asked where it is used |
| Sleep last night, intake 24 h, carbs 3 h before, caffeine 3 h before (mg), creatine days ≥3 g in 28 | derived from the timeline | as logged | shown, never folded in |
| Per-exercise settings | rest, side rest, warm-up rest, setup delay, s/rep | 5 s | catalog values on the exercise (no migration: `catalog_values`) |
| Auto-mode sets | logged as **presunti** (assumed) until confirmed at the end | — | new state; E11 lowers their confidence |

## 5. Model
**5.1 Set → exercise-session**
- e1RM per set: `kg × (1 + (reps + RIR)/30)` for 1–12 reps; with no RIR,
  plain Epley, marked "senza RIR" (a lower bound).
- The exercise-session's value = best e1RM of its working sets, and **reps
  vs expected**: expected reps at the load = `30 × (trend/kg − 1) − RIR target
  − drop × set index`, where `drop` is learnt per exercise (median reps lost
  per set at the same load; 0 with no history).

**5.2 Trend and progress (replaces every v1 %)**
- Trend per exercise = least-squares line over the last 6 weeks of
  exercise-sessions (≥ 3 points), **restarted after a gap > 21 days**.
- Typical error TE = SD of the residuals (≥ 5 points; before that, 7 %, his
  IQR-derived prior).
- Progress words: slope × 28 days as "%/mese"; **"stabile"** when |change
  over the window| < 2 × TE/√n; "in crescita"/"in calo" otherwise. Never a
  single-session %.
- **Order:** with ≥ 8 points, the hard sets done before for the same muscles
  enter the regression as a covariate; its coefficient is shown ("dopo 6
  serie di petto: −4 %"), and the trend is read at the exercise's usual
  position.
- Tonnage stays as work done, not as progress.

**5.3 Session**
- Session score (E7 "Training session"): progression = share of exercises at
  or above their expected reps; volume = hard sets vs the plan; effort = last
  set RIR in the role's band (compound 1–3, isolation 0–2); rests = actual vs
  planned within ±30 %.
- **Duration estimate** = Σ sets (reps × s/rep + setup) + Σ rests + warm-ups
  + (exercises − 1) × transition; every term learnt per exercise (medians,
  ≥ 5 points), else the person's medians (4.2 s, 78 s, 57 s, 86 s), else E6's
  defaults.

**5.4 Rests (per exercise, editable, shown with where they come from)**
- Default = the person's median rest for that exercise (≥ 5 points),
  clamped to an evidence floor: 60 s working, 30 s warm-up.
- **Adaptive:** if reps fall ≥ 2 across sets at the same load in 2 of the
  last 3 sessions, suggest +30 s (up to the ACSM band); if they never fall
  and RIR is ≥ 2, suggest −15 s (not below the floor).
- Unilateral: between sides = setup only (0–10 s); after the pair = the
  set rest **minus the other side's set time** (each side rests while the
  other works), at least 30 s.
- Warm-ups: 30 s light, 45 s middle, **60 s** before the first work set.

**5.5 Next set and next session**
- Double progression kept (E6), applied to the **first** set; the following
  sets inherit the learnt drop instead of copying the first.
- The volume band per muscle and readiness (a short night or readiness ≤ 2:
  same load, one set fewer) are wired from `session.ts`; deload hint from
  `deloadSuggestion`.

**5.6 Aggregation tree**
set → exercise-session (best e1RM, reps vs expected, last RIR) → session
(score, volume per muscle, duration, density) → week (sets per muscle vs
band, sessions) → block of 6 weeks (trend per exercise, deload) → goal (V-09:
strength or size goals read the trends).

## 6. Experience
- **Set row:** "8 × 40 kg · RIR 2" proposed; after ✓: "+1 rispetto al
  previsto" (green/neutral/amber), never a %.
- **Rest chip** under the done set: countdown, its source ("tua media 78 s"),
  ± 15 s; long-press → the exercise's settings sheet.
- **Auto mode** toggle in the header: set timer (expected duration) →
  vibration + beep → rest countdown → next set, screen kept on (Wake Lock);
  one tap corrects reps; sets marked presunti, confirmed on «Fine». Manual
  mode: tap → setup delay countdown → set.
- **Exercise page:** trend line with its noise band, "stabile · ±5 %" or
  "+3 %/mese", the order effect when learnt, the last session's context row
  (sleep, intake, caffeine, creatine, readiness).
- Empty and partial states: fewer than 3 sessions → "servono 3 sessioni per
  un andamento".

## 7. Edge cases
Gaps > 21 days (restart the trend); equipment changes (a new exercise, not
the same one); loads typed per dumbbell (stored total, 03 T-10); bodyweight
and timed moves (reps or time trends, no e1RM); a session split in two
(same day, same routine: one session); auto mode left running (sets after
3 × the expected time are not presunti but "da controllare").

## 8. Acceptance tests (from his data)
1. Machine chest press e1RM 69.7, 80, 80, 80, 86.7, 80, 78 (19 Sep → 15 Oct):
   "in crescita", not "−10 %" for the last session.
2. Lat pulldown 13 Sep at position 4 (44.3) vs position 1 (53.3): with
   ≥ 8 points the order coefficient is negative and the 13 Sep point is not
   read as a regression.
3. Chest press 28 May (73.3) → 11 Sep (63.3), gap 106 days: the trend
   restarts on 11 Sep.
4. Duration estimate within ±10 % of the logged minutes on ≥ 7 of his last
   10 sessions ≥ 30 min.
5. A bilateral compound with median rest 78 s and no rep drop → proposed
   rest 78 s (≥ 60 floor), source "tua media".
6. Unilateral exercise, other side's set 35 s, set rest 80 s → after the
   pair 45 s; between sides ≤ 10 s.
7. Auto mode, 10 reps at learnt 4.2 s/rep → set timer 42 s, no setup delay;
   manual with an 8 s setup → 8 s countdown first.
8. No RIR on any set → e1RM marked "senza RIR", effort part of the session
   score left out and named.

## 9. Questions for the developer
1. **Auto mode logs the proposed reps as "presunti"** until you confirm them
   at «Fine». Recommended: yes — otherwise the data would record what was
   planned, not done.
2. **RIR on the last set only**, one tap, skippable. Recommended: yes —
   without it no effort rule can work (0/509 today).
3. **Readiness 1–5 at the start of a session**, optional. Recommended: yes,
   it replaces the daily check-in you rarely log.
4. **Your goal now: size, strength, or both?** It sets the RIR bands and
   whether the adaptive rest leans longer (strength) or follows your habit
   (size). Recommended default: size, with strength from the trends.
5. **Rests from your habit** (78 s) within evidence floors, instead of the
   textbook 2–3 min. Recommended: yes, with the adaptive +30 s when reps drop.
