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
3. [ ] Screens. Done: the kit's «Ogni quanto» (`Recurrence`, `recurrence.ts`, `Stepper` out of
       `Field`; gallery `#ogni-quanto`, photographed in CI), the registry's `recurrence` field
       type checked by `core/kinds/recurrence.ts`. Next: the blocco and ciclo pages (`EXTRAS`, `NEW_FORMS`), «Blocchi» and «Cicli» in
       Elenco; photos.
4. [ ] The Piano tabs and Oggi read the Piano of a day from blocchi (PL-40…43); the old reads
       retired; «Rec» targets → Obiettivi (PL-61, FD-20) with a repair, «Rec» archived; habits
       created since 0006 carried; photos before/after.
5. [ ] Delta into the spec; change archived.
