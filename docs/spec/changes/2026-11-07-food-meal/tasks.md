# Tasks — 2026-11-07-food-meal

1. [x] Registry: cibo and prodotto label fields with today's limits; `act edit` on a food value
       and its undo (db test, MOD-02, PAT-13, PAT-24); the generic «Parti da» / «Variante» open
       the type's create form (PAT-16, PAT-17).
2. [x] Cibo on the generic page: `EXTRAS.food` (voto, Così appare, Marche, Nei pasti salvati,
       In casa), `NEW_FORMS.food` / `.product`; the old pages deleted, links updated; tests;
       photos 390/360. Found: an `ObjectForm` inside the page puts a second sticky «Salva» on
       it and hides ⊕ (PAT-01's `:has(.k-formfoot)`), so «Comprato» / «Ne ho…» open their
       form in a `Sheet` (`PantryActions`, decided by the agent); `ObjectPage.parts` is a list
       of sections; `updateFood` / `valueChanges` deleted (editing is `act edit`).
3. [ ] Pasto on the generic page: `EXTRAS.recipe` (Registra, cibi, porzione, Famiglia),
       `NEW_FORMS.recipe`, `/componi`; the old pages deleted; tests; photos.
4. [ ] Food composer onto the kit `Composer` (PAT-62); composer tests; photos.
5. [ ] `/aggiungi` onto the kit `Capture` (PAT-60); tests; photos.
6. [ ] Cibo · Elenco twins onto `core/catalog/twins.ts` + `MergeSheet` (PAT-43); tests.
7. [ ] Delta into the spec; counts in the PR; change archived.
