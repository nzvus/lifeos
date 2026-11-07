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
3. [x] Pasto on the generic page: `EXTRAS.recipe` (porzione with Registra and «Cambia i cibi»,
       cibi, Famiglia), `NEW_FORMS.recipe` («Parti da», «Variante»), `/componi` (`COMPOSERS`);
       the old pages deleted; `archiveRecipe` → `act archive` (test); photos 390/360/320.
4. [ ] Food composer onto the kit `Composer` (PAT-62); composer tests; photos.
       - [x] 4a the form, the lines and the foot are the kit's: `Composer` takes the caller's
             lines (`lines` + `onLines`, `stamp`), a line's own part (`below`: the brand), its
             own search (`search`), a `head` and a titled section; «Salva» as the caller says
             (`canSave`). The food foot is «Annulla» + «Salva»; «Porzioni» moves above it
             among the meal's fields (PAT-62 order; decided by the agent). CSS: a Composer that
             is the page's form lays out its sections like the page. `ComposerFoot` deleted.
             Checked: photos before/after 390/320 (same but the foot), a meal logged end to
             end (123 ml × 2 porzioni, note, 130 kcal read back), «Salva» empty says «Aggiungi
             almeno un cibo», Pasti and Stima tabs.
       - [ ] 4b its search is the kit `Find` (Cibi · Pasti as filters, the scanner and «Crea …»
             beside it); the server reads `line.N` (`readLines`) instead of the JSON `lines`.
5. [x] `/aggiungi` onto the kit `Capture` (PAT-60); tests; photos.
       - [x] its search is the kit `Find` (PAT-41): `AddSearch` on `Find` (`onQuery`), its own
             matcher `searchTargets` gone; `Find` draws no empty list; photos 390/320.
       - [x] (Q-12 «a») ⊕ is the kit `Capture`: its `Find`, at rest the page's ranked rows
             (children) then the types, «Chiudi» at the foot; `CaptureSheet` draws it in place
             (`SheetInline`) so the page is the sheet from the first paint; `AddSearch` gone.
             Checked 390/320: opens from Cibo, «caffe» finds and hides the rows, cleared shows
             them again, «Chiudi» back to Cibo.
       - [x] over the page he is on: ⊕ is the app's link (`NavBar link`, Next's `Link`) and
             `/aggiungi` is intercepted in the `(app)/@capture` slot (`[...rest]` empties it on
             any other address). Checked: opens over Cibo with the page under it, «Chiudi»
             back, a result opens the composer with no sheet, back again, `/aggiungi` loaded
             directly, from Oggi.
6. [x] Doppioni (Q-11 «a»): cibi and esercizi read the one name detector (`nameTwins`,
       `nameKey`) beside the brand and variant proposals; the food page's own `plain` match
       gone; tests cite PAT-43.
7. [ ] Delta into the spec; counts in the PR; change archived.
