# Dossier — the live gym session (what to do now, how, and what was done)

Status: **draft 2026-10-29**, for the developer's review. Method:
`../method.md`. Builds on `training.md` (approved 2026-10-23: e1RM, trends,
learnt rests, duration), which stays the source for the numbers; this dossier
designs the **session as an experience**: order, warm-ups, the screen's
states, reversibility, robustness, and the links to the rest of the app.
Code it changes: `features/training/` (Gym, SetForm, FinishSheet),
`core/training/`, `core/engines/training/` (E6, E7); interaction.md §3, §6.

## 1. Question
"Where am I, what do I do now and how, what have I done, what comes next —
with values that fit me, today, and that I can change?" In the developer's
words (29 Oct): «non si capisce cosa hai fatto, cosa no, cosa stai facendo,
come dovresti farlo»; «ordine incomprensibile, inizio, fine serie fatti a
caso»; «il riscaldamento nemmeno si capisce… pause fatte a caso»; the app
«dovrebbe consigliarmi tutto: durata, pause, tonnellaggi, esecuzione, serie,
ripetizioni, in quale ordine gli esercizi, quali esercizi aggiungere… e tutto
modificabile»; «lo schermo dovrebbe rimanere acceso»; actions need «uno studio
di reversibilità»; «era meglio quella di v1». Earlier notes
(considerations.txt): auto mode, setup delay per exercise, side and warm-up
rests «esagerate» and editable, coherence by position in the session.

## 2. Today
**v2** (`features/training/Gym.tsx`, 792 lines; actions in
`app/(app)/palestra/actions.ts`). Nine stacked sections: header, exercise dots,
readiness, current exercise (name, target, trend, last time, set rows, clock,
SetForm, «Tempi» auto/manual, context pills, ExerciseSettings), «Poi», «La
sessione finora», «Elimina», footer. The set to do and its button sit
mid-page under three lines of text; settings and reading are mixed with doing.
- Warm-ups are **not generated**: a «Riscaldamento» switch in the form. v1
  had a ramp 50 %×8, 70 %×5, 85 %×3 (`src/core/training/live.ts:113`).
- The phase (set, rest, setup) lives only in client state: a reload or a
  killed tab loses the running rest. v1 rebuilt it from saved instants.
- «Correggi» deletes the set with no Undo; no reordering; no substitution;
  no superset; no «Salva nella routine» (flows.md:59).
- Engines written and never called: `readiness`, `deloadSuggestion`,
  `orderEffect`, `nextSession`, `weeklySets`. Context (sleep, macros,
  caffeine, creatine) is shown as pills and changes nothing.
- Fixed in #294: Wake Lock asked again on return; «Finisci…» opens a
  summary; «Riprendi»; exercises with no set end as skipped.

**The developer's data** (export 29 Oct, 35 finished sessions, 1 289 sets;
scripts `audit-session.py` next to this file):

| Fact | Value | Consequence |
|---|---|---|
| Warm-ups by position in the session | 1st exercise 13/17, 2nd 0/15, 3rd 0/15, later 7/70 | he warms up the first exercise of a muscle group, not every exercise |
| Warm-up sets when present | 3 sets in 14 of 20, 2 in 4, 1 in 2 | a 2–3 set ramp |
| Warm-up load, % of first work set | quartiles 50 / 67 / 80 (e.g. 50-67-83, 50-75-88) | his own ramp, close to v1's but lighter on top |
| Rest after a warm-up set | median **59 s** (IQR 54–62, n 43) | E6's 30/45/60 s is short on the first two |
| Rest between work sets | median 78 s (IQR 64–83, n 209) | as training.md |
| Change between exercises | median 90 s (n 100) | the transition to plan |
| Session length | median 55 min (IQR 49–57) | stable: a time budget can be predicted |
| Sets since 1 Oct without a start | 41 / 400; RIR on 14 / 400 | starting and RIR are skipped when they cost a tap |
| 25–28 Oct | 3 sessions deleted and restarted; sets ended in the same second; 27 Oct abs listed first, done last; an empty exercise «done» | the screen does not show the state, so he starts over |

## 3. Evidence
G guideline · M meta-analysis/systematic review · S single study · C
convention · O opinion. training.md §3 covers rests, volume, failure, order,
e1RM and context; added here:
- **Warm-up.** Specific warm-up sets help maximal and submaximal strength in
  most but not all studies (M: Ribeiro et al. 2021, *Motricidade*,
  revistas.rcaap.pt/motricidade/article/view/21143). Few light reps are not
  enough; a set near the work load matters most: 40 % + 80 % of the training
  load beat 40 % alone for bench, 80 % × 6 was best for squat (S: Ribeiro
  2020, IJERPH 17(18):6882); a second set at 90 % beat 45 % before squats to
  failure (S: Sousa 2024). A general warm-up before specific sets added ~8 %
  leg-press 1RM (S, in the 2021 review). Warm-up sets stay far from failure
  (C: NSCA Essentials).
- **Supersets.** Same hypertrophy and strength as traditional sets (SMD
  −0.05), shorter sessions; agonist–antagonist pairs keep the volume, same-
  muscle pairs lose it (SMD −1.08); higher perceived effort (M: Zhang,
  Weakley et al. 2025, *Sports Med*; eprints.leedsbeckett.ac.uk/id/eprint/11908).
- **Order.** Strength gains larger for exercises done early; hypertrophy
  similar (M: Nunes 2021). Compounds first is a convention built on it (C).
- **Products** (O, from their public apps): Strong and Hevy show the
  previous values beside each set, start the rest timer on ✓, have a
  warm-up calculator and supersets; Fitbod suggests exercises from muscle
  recovery and swaps a busy machine. All keep the session open until an
  explicit finish and let it be edited after.

## 4. Data
| Datum | How | Today → proposed |
|---|---|---|
| Warm-up sets | **proposed** rows before the first work set, pre-filled, each tick saved as `warmup` | typed by hand → generated, skippable |
| Muscle groups of an exercise | catalog `muscleGroups` (exists) | used to decide who needs a warm-up and which pairs superset |
| Phase instants | set start (on «Inizia» or auto), set end, planned rest | start only at save time → **saved at «Inizia»** (draft set) so a reload resumes |
| Order done | `position` rewritten when the person reorders | fixed by the routine → follows what is done |
| Skipped exercise / set | status `skipped` (exists, #294) | — |
| Substitution | a new `session_exercise` with `basedOnId`-like link to the replaced one in `entry_values` (`replaces`) | none |
| Superset | `entry_values.group` on the paired exercises | none |
| Per-exercise settings | rest, warm-up rest, setup, s/rep (exist in `catalog_values`) | editable in place from the row they affect |
No migration: every new field is an `entry_values` / `catalog_values` row.

## 5. Model
**5.1 Warm-up generator (E6, new `warmups()`):**
- An exercise gets a ramp when none of the exercises done before it today
  had any of its **primary** muscle groups as primary, and its first work
  load ≥ 2 × the smallest load step (a 5 kg cable does not need a ramp).
- The ramp is the person's own when ≥ 5 past ramps exist (median % per step
  and the number of steps, today 3: 50 / 67 / 80 %), else the evidence
  default **2 sets: 50 % × 8, 80 % × 3** (Ribeiro; a light set, then one near
  the work load). Loads rounded down to the exercise's step; reps fall as load
  rises, never to failure.
- Later exercises for warmed muscles: no ramp; one optional «serie di
  avvicinamento» at 80 % × 3 when the load is > 1.3 × the heaviest load already
  used on the same groups.
- Rest after a warm-up set: the person's median (59 s, n 43) ≥ 30 s floor;
  before the first work set the same, not a longer one.

**5.2 Order.** The routine's order is the default. Proposals, never automatic:
- «Macchina occupata» → move the next exercise that shares no primary group
  in front (one tap, Undo).
- Short on time (estimate > time left): pair agonist–antagonist exercises
  as a superset (Zhang 2025); never same-muscle pairs.
- The order effect (`orderEffect`, ≥ 8 points) is shown on the exercise:
  «di solito lo fai 1°: oggi 4°, ~−4 %», so a lower number is not read as a
  regression.

**5.3 The set to do.** training.md §5.5 (double progression on the first
set, learnt drop after). Readiness ≤ 2 or sleep < 6 h → one set fewer, same
load (`readiness`, wired); everything else in the context is shown, not
folded in (evidence too weak, training.md §3).

**5.4 What to add.** `weeklySets` against the 10–20 band per muscle: at the
end summary and in the routine, «spalle laterali 4 serie questa settimana:
aggiungi Alzate laterali?» with the person's own exercises for that muscle,
never a catalog they don't use. `deloadSuggestion` as a line at the start.

**5.5 Time and work.** Before starting: «~55 min, finisci alle 8:05»
(duration estimate, training.md §5.3), updated live. Tonnage per muscle as
work done, in the summary; never a single-session %.

**5.6 State machine (the screen is a function of it):**
`prima → [riscaldamento] → serie → pausa → serie … → cambio esercizio → … →
riepilogo → finita (⇄ Riprendi)`. Each state has one primary action:
Inizia · Serie fatta · Salta la pausa · Inizia il prossimo · Finisci. The
current state is rebuilt from saved instants on every load (draft set start,
last set end + planned rest), so reload, a killed tab or a locked phone
resume where they were.

## 6. Experience
Top to bottom, phone first (interaction.md §6, P4):
1. **Bar**: «‹ Oggi», routine, «esercizio 3 di 9», the session clock and
   «fine ~8:05». No NavBar (running mode).
2. **Now card** (the only big thing): the state in words and numbers —
   «Serie 2 di 3 · 10 × 50 kg · RIR 2», or «Pausa 0:52 · tua media 78 s»
   with ±15 s, or «Riscaldamento 1 di 3 · 8 × 30 kg». Under it **how**: the
   exercise's cue (catalog `guide`), tempo, side. The primary button of the
   state, sticky at the bottom, 56 px.
3. **The exercise's sets** as rows: done ✓ with the result against the
   proposal («+1»), now, next (hatched as planned). Tapping a done row
   edits it in place; ✓ shows «Serie salvata · Annulla».
4. **Poi**: the remaining exercises with their targets, ↕ to reorder,
   «⋯» → Salta · Sostituisci · In superserie con…; «+ Aggiungi esercizio»
   as the list's last row.
5. **Fatto**: the finished exercises, folded, each with its line.
6. Settings of the exercise (rest, setup, s/rep, auto) live in the «⋯» of
   the now card and on the values they change (long-press the rest chip).
7. «Finisci…» (secondary, in the bar's «⋯» and after the last set) → the
   summary sheet: sets, skipped, presunte, tonnage per muscle, what to add.

**Reversibility** (interaction.md §3):
| Action | Class | Form |
|---|---|---|
| Inizia, move between exercises, pause ± | free | one tap |
| Serie fatta, salta serie/esercizio, reorder, substitute | undoable | tap + «Annulla» 5 s; edit the row after |
| Finisci | consequential | summary sheet, then «Riprendi» from the session |
| Elimina la sessione | undoable (trash 30 d) | in the session's «⋯», never in the footer |

**Robustness:** Wake Lock re-asked on return (#294); vibration + beep at
each change; the phase resumes from instants; offline taps queue and say so.

**On Oggi** (the developer, 29 Oct: «quando faccio un allenamento mi
compaiono tutti sotto gli esercizi, quando lo elimino mi compaiono
pianificati»): a session is one row on the timeline, from start to end,
with its state — planned («Push · 17:30», «Inizia»), **in corso** («Pull ·
esercizio 3 di 8 · Riprendi», never Fatto/Salta), done («Pull · 50 min ·
24 serie · voto»). Its exercises show only when the row opens, done ones
first; no icon strip of every planned exercise. Trashing it takes its
exercises with it (#296).

**Links:** Piano proposes the session at the person's usual time (not a
fixed 17:30) and the routine's next step; Oggi shows the session on the
timeline with pre/post meal labels by time; Andamento reads the trends;
E3 counts the session's expenditure; «Salva nella routine» writes today's
order and sets back to the routine («Parti da…» for a variant).

## 7. Edge cases
A session started by mistake (no set in 10 min → «Annulla la sessione»
without the trash); two sessions in a day (both kept); an exercise done at a
different machine (substitution, not the same trend); bodyweight and timed
exercises (no ramp, no e1RM); a reload in the middle of a set (the set's
clock resumes, a set left over 3 × its expected length becomes «da
controllare»); cardio inside a gym session belongs to `activity.md`.

## 8. Acceptance tests (from his days)
1. 27 Oct, machine chest press first, work 10 × 60 kg, his ramp 50/67/80 %
   → proposed 8 × 30, 5 × 40, 3 × 47,5 kg (step 2,5), rests 59 s.
2. 27 Oct, shoulder press 5th, front delts never primary before → a ramp;
   peck back 2nd after chest press (chest already primary) → none.
3. 26 Oct Pull, pulley row done before lat pulldown → the ramp moves to the
   pulley row, the lat pulldown gets none; positions follow the done order.
4. No past ramps, first work 10 × 60 kg → 8 × 30, 3 × 47,5 kg.
5. Reload 40 s into a 78 s rest → the countdown shows 0:38 and the same
   primary action.
6. 27 Oct «Alzate laterali» with no set at «Finisci» → listed as skipped in
   the summary, «last time» for it stays 22 Oct (#294).
7. Estimate for a 9-exercise Push with his medians → within ±10 % of 63 min.
8. Weekly sets for lateral delts < 10 → the summary proposes one of his own
   lateral-raise exercises; > 20 → nothing added.

## 9. Questions for the developer
1. **Generated warm-ups on by default**, pre-filled from your own ramp and
   skippable per exercise? Recommended: yes.
2. **Supersets now** (agonist–antagonist only, proposed when short on time)
   or later? Recommended: now, as a «⋯» action, never automatic.
3. **«Cosa aggiungere»** only in the end summary and the routine, never
   during sets? Recommended: yes, to keep the session focused.
4. Order changes write back to the routine only through «Salva nella
   routine». Recommended: yes, a session is not a routine edit.
