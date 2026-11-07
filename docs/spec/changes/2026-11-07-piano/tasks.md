# Tasks — 2026-11-07-piano

0. [x] Q-14 answered «decidi tu» → (a); ADR-0062; delta.
1. [ ] Registry «blocco» and «ciclo» (fields as MOD-36); `core/plans/blocks.ts`: read blocchi
       from values and parts, and the pure Piano of a day from them (PL-01, PL-02, PL-10…12,
       PL-20, PL-40) on the existing engines; db and unit tests citing the IDs. Nothing reads
       it yet.
2. [ ] Migration (schema + data, `drizzle-kit generate`, read the SQL): cicli → catalog
       «cycle» with the same ids, `cycle_steps` FK → `catalog_items`; day models, week layouts
       and habits → «block» rows (PL-72); «Rec» targets → Obiettivi; tested on PGlite with his
       export's shape; **he runs «migrate v2»**, then the data is checked.
3. [ ] Screens: the blocco and ciclo pages (`EXTRAS`, `NEW_FORMS`), «Blocchi» and «Cicli» in
       Elenco; photos.
4. [ ] The Piano tabs and Oggi read the Piano of a day from blocchi (PL-40…43); the old reads
       retired; photos before/after.
5. [ ] Delta into the spec; change archived.
