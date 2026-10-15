# 03 — Training: exercises, routines, programs, sessions, gym mode, guidance

Read from: `core/training/*` (live, targets, guides, analysis, progress,
readiness, program, presets, anatomy), `features/training/live/*`, schema
`training.ts`, `programs.ts`. ADRs in force: 0005, 0016, 0024, 0029, 0037,
0049 (0028 as amended).

## 1. Objects and what is collected

| Object | Fields | Table |
|---|---|---|
| Exercise | name, kind (strength / bodyweight / cardio), muscle groups, movement pattern, equipment, unilateral, notes | `exercises` |
| Routine | name, notes, ordered items: exercise, sets, reps, load, duration, rest | `routines`, `routine_items` |
| Program | an ordered cycle of slots from a start day; each slot is rest, a routine, or items (routines and/or exercises); skips and per-day overrides | `programs`, `program_slots`, `program_slot_items`, `program_slot_exercises`, `program_skips`, `program_overrides` |
| Session | day, label, planned/done, start, duration, routine, notes, intensity and kcal (estimated sessions), muscle groups | `training_sessions` |
| Session exercise | exercise, position, rest, notes | `session_exercises` |
| Set | position, reps, load (kg, text, approximate), duration, distance, speed, incline, rest, warm-up, RIR 0–4, done, started/ended at | `sets` |

**Derived:** tonnage (Σ reps × kg, working sets); e1RM (Epley, 1–12
reps); records; burn range (strength 3.5–5 MET on strength time, cardio
from ACSM equations ±15 %, estimated sessions by intensity); weekly sets
per muscle (main group 1, others ½; band 10–20); per-routine and
per-exercise progress; the program's coming days (`programPlan`); today's
target per exercise (`nextTarget`); readiness reasons.

## 2. Gym mode today (`core/training/live.ts`, ADR-0037)

- The session is a planned one whose sets are the plan. Each set stores
  `startedAt` (Go) and `endedAt` (✓), and the clock is derived from them,
  so closing the app resumes where it was.
- Cycle: rest (counts down, then +overtime) → **Go** → set → **✓** → rest.
  Every step is a tap.
- Rest after a set: the exercise's rest, else 90 s; after a warm-up a
  fixed 60 s; **between the two sides of a unilateral set, half the
  exercise's rest** (`restAfter`).
- Warm-up ramp: 50 % × 8, 70 % × 5, 85 % × 3 of the first working load.
- The % next to a set (`setChange`): (reps × kg) now vs the same position
  last time.
- Next target (`nextTarget`, ADR-0028/0049): double progression on the
  pattern's guide (compound 6–10 reps, 3–4 sets, 120–180 s; isolation
  10–15, 2–4, 60–90 s), gated by RIR: RIR 0 on a working set except the
  last set of an isolation → hold; twice in a row → one step lighter.
- Readiness (`readiness.ts`): under 6 h of sleep, check-in energy ≤ 2 or
  stress ≥ 4 → "keep the load, one set fewer".
- Misclicks keep a set's times; ticks within 20 s while catching up leave
  times unknown (#181).

## 3. Issues found (the developer's, confirmed in code)

**T-1 Every transition is a tap.** No automatic chaining of rest → set →
rest; the phone must be touched between every set (considerations.txt).

**T-2 The recorded start is the tap, not the lift.** For exercises that
need setting up (bench, squat rack, cable), "Go" is pressed seconds
before the first rep, so work time is overstated and rest understated.

**T-3 Rests between sides and after warm-ups are arbitrary.** Half the
working rest between sides (60–90 s for a compound) is far longer than
usual practice (switching sides at once, ~10–20 s), and a fixed 60 s after
every warm-up ignores the ramp (a 50 % set needs less than an 85 % one).
Neither is configurable.

**T-4 Advice per exercise, in isolation.** `nextTarget` reads only that
exercise's last session. It ignores where the exercise falls in the
session (first or after three others), the rest actually taken, the
day's readiness and the week's volume. Two exercises for the same muscle
can both be told "add load" on a day that can't support it.

**T-5 The % change is tonnage per set.** 8 × 60 vs 10 × 50 reads as −4 %,
though the second is no weaker for most purposes. RIR, rest, order,
sleep, energy intake, caffeine and creatine are not considered.

**T-6 Rest is stored four times.** On the routine item, the session
exercise, the set (`restS`), and derived from the instants. They can
disagree (ADR-0049 leftover).

**T-7 Context is collected but not joined.** Sleep, the check-in, the
day's intake, caffeine and creatine levels exist (02, 04) but reach
training only as three yes/no readiness reasons.

**T-8 Session times can't be edited.** After a misclick or opening the app
mid-session, times are unknown (#181 stops inventing them); there is no
way to set them.

**T-10 Dumbbell loads are ambiguous.** A load is one number; nothing
says whether it is one dumbbell or both. The tonnage counts the total
("con 2 da 20" = 40, `analysis.ts`), but the form does not say so. The
developer logged "Incline db press" per dumbbell (14–17.5 kg) for 8
sessions and as the total (30 kg) on 2026-10-15: the e1RM trend jumped
+100 %. The 24 sets were corrected by a replace on 2026-10-15. The
exercise also had no equipment set.

**T-9 The training program is a separate world from the day.** It picks a
routine; the day's program (01 I-8) picks meals; the session time falls
back to 17:30 (01 I-9).

## 4. Proposals

💡 **P-1 Automatic mode (one toggle) [decision on behaviour].**
- Rest ends → a 3-2-1 cue (sound, vibration, big countdown) → the set
  starts by itself.
- The set ends by a tap, or by itself after its expected duration (reps ×
  this exercise's own seconds per rep, learnt from past sets; time-based
  sets end at their time).
- RIR is asked once per exercise, after its last set, or skipped.
- The screen stays on (Wake Lock API); the phone can stay in the pocket.
- Manual mode keeps the taps, plus P-2.

💡 **P-2 A setup delay per exercise (manual mode).** Seconds between "Go"
and the first rep (default 0, learnt or set in the exercise): the stored
`startedAt` is Go + delay. Automatic mode starts after the delay.

💡 **P-3 Rests from the evidence, editable per exercise.**
- Working rest from role and intensity: heavy compounds (≤ 6 reps or
  ≥ 85 % e1RM) 2–3 min; other compounds 90–120 s; isolation 60–90 s
  (Schoenfeld 2016; Singer 2024: little hypertrophy gain beyond ~90 s,
  more rest still helps strength and volume load).
- Between sides: 0–15 s by default (the other side rests while one
  works); an option "rest between sides" for those who want it.
- Warm-up rests scale with the ramp: ~30 s after 50 %, ~45 s after 70 %,
  ~60–90 s after 85 % (common coaching practice, marked as such: no trial
  pins it).
- Stored once: the planned rest lives on the routine item (and the
  session exercise when changed in the gym). The actual rest is always
  derived from the instants (fixes T-6).

💡 **P-4 One performance measure that reads effort [decision].** Per
working set, an estimated 1RM that counts reps in reserve: e1RM = load ×
(1 + (reps + RIR) / 30) (Epley with RIR; Helms 2016 RIR-based RPE). The %
change, the trend and the progression read that, not tonnage.
- Context travels with each set and is *shown*, not hidden in a fudge
  factor: its position in the session, the rest before it vs planned,
  the night's sleep, the check-in, intake over the last 24–72 h vs
  target, caffeine in the body at that minute, creatine saturation.
- "−4 %: 3rd exercise, 75 s rest instead of 120, 5.5 h of sleep."
- Once ~8–12 weeks of sets exist, a simple per-person model (a mixed
  regression of e1RM on those factors) can say which of them matter *for
  this person*. Until then, only the descriptions.

💡 **P-5 Coherent advice across the session.** `nextTarget` for the whole
session at once:
- order effect: the expected e1RM of an exercise after others for the
  same muscles, learnt from history;
- a session volume cap per muscle (sets, with diminishing returns per
  Pelland 2024 on the weekly 10–20 band);
- readiness lowering the whole session, not one exercise;
- flags for incoherent data: a tonnage jump beyond what the e1RM trend
  allows (a typo?), reps outside any plausible range for the load.

💡 **P-6 Edit a session's times as a chain.** A session timeline (sets as
blocks, rests between) where a set's start or end can be dragged or
typed; the neighbours keep their order (an end can't pass the next start).
Unknown times show as gaps, never invented.

💡 **P-7 Readiness as a measured input.** It becomes one of the recovery
signals of 04 (P-2): sleep vs the person's own baseline, HRV/resting HR
if ever imported, the check-in, energy balance, soreness (one tap,
optional). It suggests the session-level adjustment of P-5.

💡 **P-8 Deload and blocks.** Suggest a lighter week after N weeks of
rising volume, or when the e1RM trend falls across several exercises
together with poor readiness (ADR-0049 leftover).

💡 **P-10 Loads typed the way they are lifted.** Equipment decides the
input: dumbbells and kettlebells ask "kg per dumbbell" with a ×2 shown
("2 × 15 kg"), unilateral sets ask per side; the stored load stays the
total, so tonnage and e1RM never mix the two. A jump of ≥ 60 % against
the e1RM trend asks "per dumbbell or total?" before saving (P-5's
incoherence flags).

💡 **P-9 The program fills the day template's training block** (01 P-6):
the session's time and duration come from the block.

## 5. Aggregation (this area)

```
raw        set: reps, load, RIR, start/end, warm-up · exercise: pattern, groups, unilateral, setup delay
derived    work time, actual rest, e1RM(RIR) per set, sets per muscle, burn range
context    order in session, rest vs planned, sleep, check-in, intake 24–72 h, caffeine now, creatine saturation
aggregate  per exercise: best e1RM per session, trend · per muscle: weekly sets · per session: volume, duration, density
judgement  next target (session-wide), progress %, deload suggestion, incoherence flags
```
