# Dossier — capture (⊕ and every quick log)

Status: **draft 2026-10-29**. **Decided 2026-10-29 by the agent at the developer's request** («procedi senza di me… fai le scelte migliori»): §9 as recommended; the developer reviews after. **Slice 1 built 2026-10-29:** the role stored (manual / auto from the time), «Fatto» at the tick's time with the planned one kept (Undo restores it), water asked before the same amount within 10 s, one «Sonno» in ⊕ (a sleep under 3 h by day is saved as a nap). **Slice 2 (29 Oct):** «Assunzione» (`intake`): ⊕ row, the composer with no role (`?per=assunzione`), counted in nutrients, caffeine and creatine, energy, pantry; edited from its row; «Di nuovo» keeps it an intake. The past ones convert with data-repair R6 (separate PR, merged after). Not yet: the ranked ⊕, «Unisci», planned → done from ⊕. Method:
`../method.md`. Code it changes: `app/(app)/aggiungi/` (page, kinds, the
sheets), `features/add/`, `features/food/MealWhen.tsx`, `core/entries/`;
interaction.md §3–§6; screens.md V-02 (board Capture).

## 1. Question
"I want to put down what I just did (or will do, or did earlier) in a
couple of taps, be sure it went in once and right, and find it again to fix
it." The developer (29 Oct): «nel + c'è un sacco di roba spesso ridondante
che confonde solo»; «nella registrazione ci sono incongruenze perché non si
riesce a registrare decentemente nulla»; «volevo mettere che ho corso, ma mi
faceva solo iniziare» (→ activity.md).

## 2. Today
**The ⊕ page** (`app/(app)/aggiungi/page.tsx`, one scroll):
search · «Adesso · Previsto · Prima» · «Cosa aggiungere» (Pasto, Allenamento,
Spesa, Tragitto, then 11 kinds: acqua, passi, attività, lettura, peso,
misure, sonno, pisolino, «come stai», diario, faccende, plus the person's
kinds) · «A quest'ora, di solito» · «Allenamento» (routines) · «Pasti
recenti» (4) · «Non trovi» (nuovo cibo, nuovo esercizio, nuovo tracker).
- **The same thing in several places:** a meal from 4 doors (Pasto, usual,
  recent, search), a workout from 3 (Allenamento, routines, search); sleep
  and nap as two kinds with the same times; peso and misure split; Spesa
  next to Dispensa's purchase.
- **Catalog duplicates reach the search:** Corsa · Run, Tapis roulant ·
  Treadmill, Cyclette · Bicicletta (pattern bike) — two names per thing.
- **A run** opens gym mode «now»: no way to log one already done (activity.md).
- **The meal's role is not saved** when left «Senza scelta»: MealWhen shows
  «pranzo, dall'ora» but sends `role = ""`; readers re-derive it from the
  time each time, so a change of the bounds rewrites history and the export
  says «no role».
- After a tap the sheet closes and Oggi reloads; nothing says «Acqua 500 ml
  aggiunta · Annulla», so a second tap looks needed.
- **«Fatto» keeps the planned time** (`setEntryStatus` changes the status
  only): a breakfast planned 06:58 and eaten 08:30 stays at 06:58, so the
  developer deletes the planned one and logs a new one (26–27 Oct).
- **Categories before the timeline:** `features/day/meal-groups.ts` puts
  every meal of the same role into one group wherever it sits in the day,
  against interaction.md §6 (only neighbours, nothing between, ≤ 60 min).
  The developer (29 Oct): «continua a dare priorità alle categorie
  piuttosto che alle timeline».
- **Coffee and creatine are meals** (`meal` entries of one food): they get a
  role, a composer, a meal score, and they split the meal groups: **50 of
  the 262 done meals** in the export are «CAFFÉ» (26) or «CREATINA» (24).

**The developer's data** (export 29 Oct, 70 entries created 26–29 Oct;
script `audit-capture.py`):

| Fact | Value | Consequence |
|---|---|---|
| Logged within a minute of the fact | median 1 min; 11 of 55 over 60 min | «Adesso» is the default, «Prima» is real (1 in 5) |
| Deleted after creation | 12 of 70 (6 meals, 4 sessions, steps, nap) | wrong first try, then redo: the first try's form misled |
| Done meals without a role | **25 of 33** | the role must be stored, from the time when not chosen |
| Identical entries < 10 s apart | 5 (water 2 × 500 ml at 1 s) | no visible confirmation |
| Steps with no time | 3 of 3, levels «sitting» with 15 000 steps | activity.md |
| Planned meals deleted by hand and logged anew | 26–27 Oct | «Fatto» on the planned row is not found; the meal is logged twice |

## 3. Evidence
- **Logging burden.** Self-monitoring of diet and activity predicts adherence
  and outcomes; completeness falls as the effort per entry grows (M: Burke
  2011, J Am Diet Assoc 111(1):92–102). Fewer taps per entry keeps the record
  complete (C).
- **Feedback and undo.** Every action needs visible feedback in ≈ 0.1–1 s;
  undo is preferred to confirmation for frequent actions (C: Nielsen
  heuristics 1 «visibility of system status», 3 «user control and freedom»).
- **Choices.** Decision time grows with the number of options shown
  (Hick–Hyman, C); recognition beats recall: show the person's usual
  things first (C).
- **Products** (O): Apple Health and Google Fit add a sample with «now»
  prefilled and an editable time; MyFitnessPal puts the meal slot first and
  remembers the last; Strava logs an activity done earlier with a manual
  form (time, distance, duration).

## 4. Data
| Datum | Today → proposed |
|---|---|
| Meal role | `""` when not chosen → **the role from the time stored at save**, with `roleSource = auto`; a manual choice stores `manual` |
| When | «Adesso · Previsto · Prima» switch → one time field prefilled «adesso», «Prima» = changing it; «Previsto» only from Piano or a future time |
| Doubles | none → the same kind with the same values within 10 s asks «Di nuovo? 500 ml anche adesso» |
| Sleep vs nap | two kinds → one «Sonno» sheet; under 3 h and by day it is stored as a nap |
| Catalog duplicates | → «Unisci» on the object page (keeps history on the kept one), offered when two items share pattern and words |
| Planned time | kept on «Fatto» → each planned item has **«ora fissa»** (an appointment, the class at 18:00) or **«ora della spunta»** (default for meals and quick items: «Fatto» writes now, or the time typed in the toast «Fatto alle 08:30 · Cambia»); the planned time stays as `plannedStart` for adherence |
| Coffee, creatine, supplements | `meal` → **`intake`**: one food or supplement, a dose, a time; nutrients and compounds counted in the day's totals (caffeine and creatine ranges, ranges.md), no role, no meal score, never grouped with meals |
No migration except a backfill of `role` on past meals (data-repair).

## 5. Model
- **The ⊕ ranks, it does not list.** One list of at most 8 rows built from:
  (a) what is usual at this hour (`usualAt`, 28 days), (b) the planned
  items of today not yet done, (c) the kinds logged in the last 7 days.
  Each row is one tap to log with its usual values («Acqua 500 ml»,
  «Colazione — Avena, lamponi…», «Push»), or to open its sheet when it
  needs a value («Peso»). The full list of kinds is a fold «Tutti i tipi»,
  grouped (Cibo · Allenamento e movimento · Corpo · Sonno e mente · Casa e
  soldi · I tuoi).
- **Search** is on top and covers kinds, foods, saved meals, routines,
  activities, routes; duplicates merged by name and pattern.
- **One door per thing:** a meal opens the composer at «quando e quale
  pasto» (P4), already filled when it came from a usual/planned row; a
  workout opens the session (session.md) or, for a past one, the activity
  sheet (activity.md).
- **Planned → done:** a planned item in the list logs as its planned entry
  turned done (no second entry), at the time its rule says (§4).
- **The timeline first:** Oggi orders everything by time; meals are named
  by their role but grouped only as interaction.md §6 says (neighbours,
  nothing between, ≤ 60 min apart). A role is a name, not a container: two
  snacks at 10:00 and 16:00 are two rows.
- **Intake** rows (coffee, creatine, water) sit on the timeline as small
  marks with their dose, logged from the «Al volo» row on Oggi or ⊕'s first
  rows; their caffeine/creatine feed the context of the gym session
  (training.md §4) and the ranges.

## 6. Experience
- ⊕ opens as a sheet: search, then «Adesso» (time chip, tap to change),
  then the ranked list, then «Tutti i tipi», then «Non trovi? Nuovo…».
- A one-tap log closes the sheet and shows the toast «Acqua 500 ml ·
  Annulla» on Oggi, with the new row highlighted for 2 s.
- A sheet with values opens on the field changed most (interaction.md §6),
  with the last value prefilled and the unit in the label.
- Reversibility (interaction.md §3): every log is undoable (toast + Elimina
  in its sheet); nothing in ⊕ is consequential or irreversible.
- Empty states: a new person sees the kinds grouped and three examples.

## 7. Edge cases
Logging for another day (from that day's Oggi, the time chip shows the
day); after midnight before sleep (the day boundary, clock.ts); offline
(queued, the toast says «salvato sul telefono»); a kind archived later
(its past entries stay, the row leaves ⊕).

## 8. Acceptance tests (from his days)
1. 29 Oct 12:02, «Acqua 500 ml» tapped twice within 1 s → one entry and
   the question; a third tap after 30 s → a second entry, no question.
2. 27 Oct 11:09 meal saved with no role chosen, lunch from 11:00 → stored
   role `lunch`, source `auto`; moving lunch's start to 12:00 later does not
   change it.
3. 27 Oct, a planned «Avena, lamponi…» at 08:30, logged from ⊕ at 08:41 →
   the planned entry becomes done at 08:41; no deleted twin.
4. At 06:40 on a weekday ⊕'s first rows are creatina, avena (his usual at
   that hour), then today's planned session, then acqua.
5. Search «corsa» → one row «Corsa» (Run merged into it), not two.
6. 26 Oct sleep 22:11 → 05:23 entered from «Sonno» → a sleep, never a nap.

## 9. Questions for the developer — decided 2026-10-29, as recommended
0. **Coffee, creatine and supplements as «assunzioni»** (`intake`), not
   meals: counted in the day's nutrients and ranges, logged in one tap, no
   role or score? Recommended: yes; existing single-food «meals» of a
   supplement or a drink are converted (data-repair R6).
0b. **«Ora della spunta» by default for meals and quick items, «ora
   fissa» for appointments** (a class, a visit), switchable per planned
   item and per block of a day type? Recommended: yes.
1. **Store the role from the time** when not chosen (and backfill the past
   meals the same way)? Recommended: yes.
2. **Merge sleep and nap** into one «Sonno» sheet? Recommended: yes.
3. **Merge Run → Corsa, Treadmill → Tapis roulant, Bicicletta ↔
   Cyclette** (keep both names as aliases)? Recommended: yes for the first
   two; Bicicletta (outdoors) and Cyclette (indoor) stay separate.
4. **«Previsto» only from Piano** and from a future time, not as a ⊕
   switch? Recommended: yes.
