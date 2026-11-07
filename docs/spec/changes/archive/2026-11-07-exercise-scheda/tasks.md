# Tasks — 2026-11-07-exercise-scheda

1. [x] Esercizio on the generic page: `EXTRAS.exercise` (Andamento = trend + best e1RM,
       sessions, «Usato in» the schede), `NEW_FORMS.exercise` (`ExerciseForm`); the
       `esercizio/` folder deleted (page, `/unisci`, `nuovo`, layout); photos 390/320.
       Open: in dev, React warns «each child in a list should have a unique key» on this page
       only (not on cibo or pasto); it goes when either `parts` or `usedIn` is left out, and
       stays with keyed rows and a constant `usedIn` — not found yet.
2. [x] Kit `Composer`: `counted={false}` — no stepper, «Su» / «Giù» (`moveLine`), the order
       posted as `line.N.key` (`readOrder`); tests cite PAT-62; gallery section
       `#compositore-ordine` and its photos at 390/320.
3. [x] Scheda on the generic page: `EXTRAS.routine` («Inizia» = `startGym` through a client
       `StartButton`, «Cambia gli esercizi», its exercises in order as rows), `NEW_FORMS
       .routine` («Parti da» only: a scheda variant would store differences of an ordered
       list, not modelled — decided by the agent) and `COMPOSERS.routine`, both
       `RoutineComposer` on the kit `Composer` (`counted={false}`); `saveRoutine` (name through
       `core/verbs`, exercises through `setRoutineExercises`, a new scheda with none undone);
       Corpo · Elenco «Schede» (Esercizi · Schede · Tragitti). `saveRoutineFromSession` shares
       `writeRoutineParts`. Db test cites PAT-62. Checked: list, page, Giù + Salva and back,
       «Parti da» with its 8 exercises, an empty new one refused in words; 360/320 photos.
       Duration (TR-37) not shown yet: it needs the proposal per exercise (gym mode's).
4. [x] Kit `Timer` (PAT-63): `timerClock` (pure: countdown with what is left and how far
       past, running against its expected length, the caller's clock at rest) and `Timer`
       (the `k-gstate` box); `GymClock` maps the gym's phases (setup, rest → countdown; set →
       running) and keeps the gym's words. Proven by the HTML of 7 states before and after
       (identical); tests cite PAT-63; gallery `#timer` photos 390/320. The rest of PAT-63
       (resume from saved instants, offline queue) stays in `Gym.tsx` for now.
5. [x] Delta into the spec; counts in the PRs; change archived.

Done 7 Nov in #338. Counts: pages −5 (`[area]/esercizio/*`), merge −1 (`mergeExercise`),
archive −1 (`archiveExercise`); new screens on the family route only (scheda page, nuovo,
`/componi`); jscpd 794 → 772; lint-baseline −1 (GymClock's inline style, now the kit's).
Q-13 moved to `changes/inbox.md`.
