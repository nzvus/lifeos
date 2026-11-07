# Tasks — 2026-11-07-exercise-scheda

1. [x] Esercizio on the generic page: `EXTRAS.exercise` (Andamento = trend + best e1RM,
       sessions, «Usato in» the schede), `NEW_FORMS.exercise` (`ExerciseForm`); the
       `esercizio/` folder deleted (page, `/unisci`, `nuovo`, layout); photos 390/320.
       Open: in dev, React warns «each child in a list should have a unique key» on this page
       only (not on cibo or pasto); it goes when either `parts` or `usedIn` is left out, and
       stays with keyed rows and a constant `usedIn` — not found yet.
2. [ ] Kit `Composer`: lines without quantity, move up/down (PAT-62); tests; gallery photos.
3. [ ] Scheda on the generic page: `EXTRAS.routine` (exercises, duration, Inizia, Famiglia),
       `NEW_FORMS.routine` and `COMPOSERS.routine` on the kit `Composer`; Corpo · Elenco
       «Schede»; db tests for writing a scheda's lines; photos.
4. [ ] Kit `Timer` (PAT-63) from the gym clock; `GymClock` on it; tests; gym mode photos
       before/after.
5. [ ] Delta into the spec; counts in the PRs; change archived.
