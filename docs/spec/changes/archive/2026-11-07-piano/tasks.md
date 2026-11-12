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
       instead of dropping it (*decided by Claude*, PL-72 «or nothing»). Step items stay
       the schede until slice 4 reads a step's blocchi (*decided by Claude*: no screen
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
       blocchi: a `ref` field is a choice of his objects — *decided by Claude*), its
       Composer (`BlockComposer`, `setBlockWhat`: pasti, schede, tragitti with servings, or one
       type alone as a fixed line — kit `ComposerLine.fixed`); «Blocchi» and «Cicli» in Oggi ·
       Elenco. Checked in the browser: a rotation of two pasti saved, «Acqua» replacing it.
       Open detail: «Rispetto a» / «Scarto» show even when «Quando» is «a un'ora» (hiding a
       field by another's value would be a new registry rule: not now).
4. [x] The Piano tabs and Oggi read the Piano of a day from blocchi (PL-40…43); the old reads
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
       «Ripeti» (PL-44, #?): «Ripeti nel Piano» on a voce's page (the meal Composer and the
       entry sheet) opens «Nuovo blocco» from it (`?voce=`: its object's name or its
       category's, its area, «a un'ora» at its time, its weekday) and the blocco holds the
       voce's object with its servings, or its type with its category (`blockSeedOf`;
       `setBlockWhat` keeps a type's defaults when the same type is saved again). Checked in
       the browser: an activity «Studio» at 18:00 on a Monday → blocco «Studio», Mente, lun,
       «tipo · Studio». The meal Composer's link was not clicked (no meal on the local account).
       Previsti written (PL-40, MOD-33; Q-17 (a)): `drizzle/0009` (schema: `entries.block_id`,
       FK to his blocco on delete restrict, unique per user + day + blocco); `core/plans/
       write-day.ts` `writeDayPlan` on Oggi's read of today: each blocco due and not covered →
       a previsto with its `block_id`, source «template» (a pasto with its foods and servings,
       a scheda as a planned session, a type with its defaults; by the catalog type's
       `savedFrom`, MOD-14); never twice (a trashed voce counts; the index too); a tragitto, a
       saved estimate, a type needing a value (Acqua's ml), a ciclo's step stay computed rows.
       Tested on PGlite (three cases); in the browser: a daily «Studio» blocco written once on
       two reads, «Togli i previsti (1)». **He runs «migrate v2»** for 0009 before the merge.
       «Nel ciclo» (PL-30, Q-18 (a), 12 Nov, autopilot): the sixth «Ogni quanto» choice (kit,
       registry, engine `inCycle`); `setCycleSteps` turns a scheda picked into a blocco «nel
       ciclo» (reused; « (ciclo)» on a name clash); `read.ts` takes a blocco's objects as the
       step's keys and carries `blockIds`; `dayBlocks` plans a due step's blocchi with their
       own when; the step Composer searches blocchi then schede. Tests: engine, kit, PGlite
       (`cycles-repo.test.ts`), `day-blocks.test.ts` (acceptance 3: caffè 07:30, none on Rest,
       moves to 08:10 after a fatto at 08:40). Checked in the browser: «Legs» picked twice →
       one blocco «Legs», «blocco nel ciclo»; old step still «scheda». Gallery photos updated.
       Q-24 (a) (12 Nov, «ap yc»): a blocco «nel ciclo» anchored to a step's blocco comes
       with it, chains too (`dayBlocks`; test: avena 07:00 → caffè 07:30 → Push 08:00, none on
       Rest).
       Q-23 (a) first half (12 Nov): no screen or Piano read uses `templates`,
       `template_blocks`, `week_layouts`, `cycles_state` any more. What is left keeps data
       safe until the drop and stays: the export (`account/export.ts`), old files' loading
       (`convert/file.ts`, `load.ts`, DT-40), the v1 conversion (`convert/plans.ts`), and
       merge re-pointing `template_blocks` (`catalog/merge.ts`, FK). The drop goes with its
       migration, **asked of him** after Q-18's step migration and a verified export.
       Step migration (12 Nov): `drizzle/0010` (#349), dry-run on his 10 Nov export, run by his
       «migrate v2» after the first v2 restore drill (pass) and the second key copy; checked on
       a fresh backup restored locally: PPLCR = Push | Pull | Legs as blocchi «nel ciclo»,
       Corsa (exercise) and Rest unchanged, 3 blocchi.
       Not done here, carried: the food Composer's unfed `slots` (PL-60, ROADMAP «Now»);
       dropping the old Piano tables (Q-25 in the inbox, a delete: his).
5. [x] Delta into the spec (12 Nov: model MOD-33/36/42, patterns PAT-03/04/11/30/61/62, plan
       PL-01…03/20/30/40/43/44/60/61/70/72, food FD-20, data DT-34); change archived.
