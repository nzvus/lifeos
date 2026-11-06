# Tasks — 2026-11-06-tracker

1. [x] `core/verbs`: read, list and rename a tracker (kinds), undo; db tests (PAT-24, PAT-04).
2. [x] Generic page: name in place for every type; a tracker's page (what it is, its fields,
       Andamento); tests; photos 390/320.
3. [x] `/oggi/tracker/nuovo` with `TrackerForm`; after saving, its page.
4. [x] Oggi · Elenco «Tracker» section with the kit `Elenco`; photos.
5. [x] `/profilo/tipi` deleted + redirect; links updated; counts in the PR.
6. [x] Delta into the spec; change archived.

Done 6 Nov. Found: `/oggi/...` is served by the `oggi` folder before `[area]`, so the family page
is mounted again as `oggi/[type]/[id]` (`object-route.tsx` shared). Counts: pages −1
(`/profilo/tipi`), archive implementations −1 (`archiveTracker` → `act`), `lint-baseline` −1
(its raw form), words moved to `i18n/tracker.ts` (one list for the form and the page).
