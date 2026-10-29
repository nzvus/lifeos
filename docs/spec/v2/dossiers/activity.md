# Dossier — activity (runs, cardio, the day's steps)

Status: **draft 2026-10-29**, for the developer's review. Method:
`../method.md`. Extends `movement.md` (routes, trips, steps from the phone;
its §5 stays the steps model) with the endurance activities it left out.
Code it changes: `core/kinds/builtins.ts` (steps), `core/training/` (cardio
sessions), `app/(app)/aggiungi/`, engines.md E3 (expenditure) and E6
(training load).

## 1. Question
"I ran (or cycled, rowed, walked fast): put it down with what matters —
when, how long, how far, how hard — even after the fact, and count it right
in my energy and my steps." The developer (29 Oct): «volevo mettere che ho
corso, ma mi faceva solo iniziare, e tra l'altro con parametri
incomprensibili. ma poi i passi? fatti malissimo».

## 2. Today
- **A run is a gym session.** ⊕ → Allenamento or a routine «Cardio facile
  30 minuti» starts a session *now* in gym mode; the set form asks reps or
  seconds, with no distance, pace or effort. `training_sets` already has
  `duration_s`, `distance_m`, `speed_kmh`, `incline_pct`, unused by the form.
- **28 Oct 19:40–19:58** (export 29 Oct): 4 sessions in 18 minutes, 3
  deleted; the one kept lasts 1 min with a set holding no value. The run
  itself is lost.
- **Catalog:** 13 cardio exercises with duplicates (Corsa · Run · Treadmill ·
  Tapis roulant); their guides are good.
- **Steps** (`steps` kind): one number a day with no time, walking minutes
  and a «level» (sitting · mixed · on feet). 26 Oct: 12 000 at 08:35 deleted,
  then 18 000 at 20:22 — a running total typed as if it were an addition;
  27 Oct 15 000 «sitting», 28 Oct 7 000 «sitting». movement.md already
  drops the level (contradictions in v1 too).
- E3 counts steps by cadence band; a run typed as steps or as a session is
  counted twice or not at all depending on the path.

## 3. Evidence
- **Energy of running and walking.** ACSM metabolic equations: running
  VO₂ = 0.2 × speed + 0.9 × speed × grade + 3.5 (ml·kg⁻¹·min⁻¹, speed in
  m/min), walking 0.1 × speed + 1.8 × speed × grade + 3.5 (G: ACSM's
  Guidelines for Exercise Testing and Prescription, 11th ed.). MET =
  VO₂ / 3.5; kcal ≈ MET × kg × h, net = (MET − 1) × kg × h for E3 so rest is
  not counted twice (C).
- **Other modes** (bike, rower, elliptical, rope): Compendium of Physical
  Activities 2024, MET by mode and intensity (G-like: Herrmann et al. 2024,
  J Sport Health Sci, pacompendium.com).
- **Effort.** Session RPE (CR10 × minutes) is a valid internal load for
  endurance and mixed training (S/M: Foster 2001, JSCR 15(1):109–115;
  Haddad 2017, Front Neurosci, systematic review). The talk test tracks the
  ventilatory threshold (S: Persinger 2004, MSSE 36(9):1632–6).
- **Steps.** More daily steps, lower mortality, levelling off around 6–8 k
  (>60 y) and 8–10 k (<60 y) (M: Paluch 2022, Lancet Public Health
  7(3):e219–28). Running cadence 150–180 steps/min (C).
- **Progression.** The «+10 % per week» rule has weak support; large week-
  to-week spikes in distance relate to injury (S: Nielsen 2014, JOSPT
  44(10):739–47). Shown as a caution, never a block.

## 4. Data
| Datum | How | Today → proposed |
|---|---|---|
| Activity | a `session` of one cardio exercise, one «bout» set: start, end (or duration), distance, incline | gym set form → **its own sheet** |
| Pace / speed | derived (distance ÷ duration) | — |
| Effort | RPE 0–10, one tap at the end, optional | none |
| Avg heart rate | typed, optional (from a watch) | none |
| Route | ref to a route (movement.md) for runs and rides done often | none |
| Steps | **the phone's running total** for the day, with the time it was read | an addition with a level → a total «alle 20:22»; a new value replaces the old one |
| Run steps | derived: minutes × 160 (C) or distance ÷ the person's run stride when learnt | none |
No migration: the steps' `level` is no longer asked (kept for old entries).

## 5. Model
- **Energy (E3):** running/walking by the ACSM equations from speed and
  incline, weight from the latest weigh-in; other modes by Compendium MET
  for the chosen intensity; net of rest. With no distance: Compendium MET
  for the mode at «facile / medio / forte» (from RPE ≤ 4 / 5–6 / ≥ 7).
- **Steps without double counting:** day steps (phone) = incidental +
  trips' walking + activity steps; E3 counts the activity by its own
  equation and the remaining steps by cadence band (movement.md §5).
- **Load (E6/E7):** session RPE × minutes per activity; the week's load and
  distance per mode, with the spike caution (> 1.5 × the 4-week mean).
- **Trend:** pace at the same RPE on the same route over 6 weeks, restarted
  after 21 days off (as training.md §5.2).

## 6. Experience
- ⊕ → «Corsa» (or any cardio, or its route) opens the **activity sheet**:
  «Fatta» (default: ended now, duration prefilled from the usual) or
  «Inizia adesso» (a timer with the screen on, session.md's robustness).
- Fields, in this order: when (end time chip), durata, distanza (km, pace
  shown live as «6:40 /km»), percorso (optional), fatica (0–10), FC media
  (optional, in «Altro»). One primary «Salva».
- Oggi: the activity on the timeline as a bar from start to end, with its
  mode glyph, distance, pace and kcal; tapping it edits in place.
- Passi: a row «Passi · 18 000 alle 20:22» on Oggi; tapping it asks the
  phone's number now («Quanti ne segna il telefono?»), replacing the value.
- A gym session can contain a cardio bout (warm-up bike): same bout row
  inside the session, same fields.

## 7. Edge cases
Treadmill (incline, no route); intervals (one bout with the total, notes
for the reps; split bouts later); a watch's numbers typed late («Prima»);
GPS/GPX import (not in a web app now; later, ADR); steps entered the next
morning for yesterday (the day chip); a walk that is also a trip (one
entry: the trip with «a piedi», never both).

## 8. Acceptance tests (from his days)
1. 28 Oct, «Corsa» saved at 19:42 as done, 30 min, 4,5 km → one session,
   start 19:12, pace 6:40 /km, 9 km/h → VO₂ 33,5 → 9,6 MET → gross ≈ 364
   kcal, net ≈ 326 kcal at 76 kg; no empty set, no deleted twins.
2. 26 Oct steps 12 000 at 08:35, then 18 000 at 20:22 → one entry, 18 000;
   the day's steps are 18 000, not 30 000.
3. 27 Oct 15 000 steps → no level asked; E3 uses steps alone.
4. A 30 min run on a day with 18 000 phone steps → activity steps ≈ 4 800,
   incidental 13 200 for E3; the day's energy counts the run once.
5. RPE 4, 30 min → session load 120; three such runs (360 in the week)
   after a 4-week mean of 180 → caution «carico doppio rispetto al solito».
6. Cyclette 40 min, no distance, RPE 6 → Compendium MET for moderate
   stationary cycling, net kcal at 76 kg.

## 9. Questions for the developer
1. **Activities logged with their own sheet**, «Fatta» by default and
   «Inizia adesso» as the second choice? Recommended: yes.
2. **Steps as the phone's running total** (a new value replaces), level
   no longer asked? Recommended: yes (movement.md already proposes it).
3. **RPE 0–10 at the end** of every activity, optional? Recommended: yes —
   it is the only effort measure without a watch.
4. Heart rate only typed for now; a watch import later with its ADR.
   Recommended: yes.
