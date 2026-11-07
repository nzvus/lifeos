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
4. [ ] Kit `Timer` (PAT-63) from the gym clock; `GymClock` on it; tests; gym mode photos
       before/after.
5. [ ] Delta into the spec; counts in the PRs; change archived.
