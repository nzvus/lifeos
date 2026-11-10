# Tasks — 2026-11-07-piano

0. [x] Q-14 answered «decidi tu» → (a); ADR-0062; delta.
1. [x] Registry «blocco» and «ciclo» (fields as MOD-36, words in `i18n/objects.ts`, type keys);
       `core/plans/blocks.ts`: `readBlocks` (values + parts → `Block`, a broken recurrence or
       area left out), `blockWhen` (PL-10), `parseRecurrence` (PL-20), `blocksOn` (PL-40, the
       rotation of PL-02 by last done, skipping items no longer live); unit + PGlite tests cite
       the IDs. Nothing reads it yet. Not yet: PL-02's item named for a weekday; PL-11/12 time
       resolution stays in `engines/planning` (slice 4 wires it).
2. [x] Migration: `drizzle/0006` (data) — each ciclo → a catalog «cycle» with the same id
       (paused = archived, deleted kept; `advance`, `onSkip`, `start` as values), counts in a
       NOTICE; `0007` (schema, generated) — `cycle_steps.cycle_id` → `catalog_items`.
       `cycles-repo` writes the catalog row too (`mirror`), the loader adds it to an older file
       (`withCycleItems`, also used by the v1 conversion). Habits / day models / week layouts →
       blocchi: none on his data (6 Nov: no habit, «Rec» holds no block, «Come martedì 3»
       paused and in no week), so the repair **stops** on a live habit or a planned block
       instead of dropping it (*decided by the agent*, PL-72 «or nothing»). Step items stay
       the schede until slice 4 reads a step's blocchi (*decided by the agent*: no screen
       breaks before then). Tested on PGlite (`data-repair.test.ts`) and on his export of
       6 Nov loaded with main's code, then 0006 + 0007 applied (7 cicli, PPLCR live with its
       5 steps, the same steps due 10–16 Nov before and after). **He runs «migrate v2»**,
       then the data is checked.
       Moved to slice 4: «Rec» targets → Obiettivi and «Rec» archived, with the code that
       reads the day's targets from Obiettivi (storing goals nothing reads would be a guess).
3. [x] Screens. Done: the kit's «Ogni quanto» (`Recurrence`, `recurrence.ts`, `Stepper` out of
       `Field`; gallery `#ogni-quanto`, photographed in CI), the registry's `recurrence` and
       `date` field types (`core/kinds/recurrence.ts`); the Piano, the cycle book and Salta /
       Sposta read the cicli from the catalog (`readCycles`, paused = archived); **the ciclo
       page** `/oggi/ciclo/<id>` (generic ObjectPage + `cycle-extra`: steps with «oggi», its
       rules in place with their words, «Andamento» of 14 days), `/oggi/ciclo/<id>/componi`
       (`CycleComposer`, «+ Riposo», `setCycleSteps`; mounted under `oggi` too), «Nuovo ciclo»
       (`NewObjectForm` + `objectCreate`, generated from the registry, then its steps); the
       old editor gone (`/corpo/ciclo/<id>` redirects; `createCycle` / `saveCycle` /
       `addStep` / `moveStep` and their mirror removed). Checked in the browser: + Riposo saved,
       Togli saved, a new ciclo with Push + Riposo. **The blocco page**
       `/oggi/blocco/<id>` (generic + `block-extra`: how often under its title, «Che cosa» or
       «A turno», each row to its page), «Nuovo blocco» (generated, «Rispetto a» his other
       blocchi: a `ref` field is a choice of his objects — *decided by the agent*), its
       Composer (`BlockComposer`, `setBlockWhat`: pasti, schede, tragitti with servings, or one
       type alone as a fixed line — kit `ComposerLine.fixed`); «Blocchi» and «Cicli» in Oggi ·
       Elenco. Checked in the browser: a rotation of two pasti saved, «Acqua» replacing it.
       Open detail: «Rispetto a» / «Scarto» show even when «Quando» is «a un'ora» (hiding a
       field by another's value would be a new registry rule: not now).
4. [ ] The Piano tabs and Oggi read the Piano of a day from blocchi (PL-40…43); the old reads
       retired; «Rec» targets → Obiettivi (PL-61, FD-20) with a repair, «Rec» archived; habits
       created since 0006 carried; photos before/after.
       Done: `drizzle/0008` (data; «Rec»'s deficit 200, protein 2.2, fat 0.8 g/kg → three goals
       from 1 Oct, the day models archived, a habit → a blocco of its type with the same id;
       stops on a fixed model in a week or a planned model block; tested on PGlite); the day's
       targets from the goals (`dynamicTargets`, his numbers unchanged: 2211/167/61 on 19 Oct);
       `dayBlocks` (PL-01/02/03/11/12/20/30/33 tests) and the rows on Oggi and Oggi · Piano;
       each area's Piano = its blocchi on `Elenco` (Corpo with the cicli); gone: day models
       (`models*.ts`, the model editor, «Modelli», `/oggi/giornata/<id>`), habits (`habits.ts`,
       HabitForm, `/<area>/abitudine/<id>`), «Cambia la giornata», «Salva come modello», the
       meal shares (`slots.ts`). Checked in the browser (local account): tomorrow's two Acqua
       blocchi at 20:00 and the ciclo's Legs at 20:42 (last Wednesday's time) on Oggi and on
       the Piano. **He runs «migrate v2»** for 0008, then the data is checked (three goals,
       «Rec» archived, the same kcal on Oggi).
       Left: writing the previsti `from_block` on the first read of today (PL-40, MOD-33);
       «Ripeti» → a new blocco (PL-44); a step's items as blocchi (PL-30, caffè with Push); the
       food Composer's unfed `slots` (PL-60); dropping `templates` / `week_layouts` later.
5. [ ] Delta into the spec; change archived.
