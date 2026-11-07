# Tasks — 2026-11-07-piano

0. [x] Q-14 answered «decidi tu» → (a); ADR-0062; delta.
1. [x] Registry «blocco» and «ciclo» (fields as MOD-36, words in `i18n/objects.ts`, type keys);
       `core/plans/blocks.ts`: `readBlocks` (values + parts → `Block`, a broken recurrence or
       area left out), `blockWhen` (PL-10), `parseRecurrence` (PL-20), `blocksOn` (PL-40, the
       rotation of PL-02 by last done, skipping items no longer live); unit + PGlite tests cite
       the IDs. Nothing reads it yet. Not yet: PL-02's item named for a weekday; PL-11/12 time
       resolution stays in `engines/planning` (slice 4 wires it).
2. [ ] Migration (schema + data, `drizzle-kit generate`, read the SQL): cicli → catalog
       «cycle» with the same ids, `cycle_steps` FK → `catalog_items`; day models, week layouts
       and habits → «block» rows (PL-72); «Rec» targets → Obiettivi; tested on PGlite with his
       export's shape; **he runs «migrate v2»**, then the data is checked.
3. [ ] Screens: the blocco and ciclo pages (`EXTRAS`, `NEW_FORMS`), «Blocchi» and «Cicli» in
       Elenco; photos.
4. [ ] The Piano tabs and Oggi read the Piano of a day from blocchi (PL-40…43); the old reads
       retired; photos before/after.
5. [ ] Delta into the spec; change archived.
