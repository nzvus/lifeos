# Tasks — 2026-11-06-kit-patterns

1. [x] PAT-04 family route `[area]/[type]/[id]` + `typeSlug`/`typeAtSlug` + `readObject`; the
       generic ObjectPage (values in words, archive/restore/delete with toast «Annulla»); wrong
       area → redirect, unknown type → 404; tests in catalog, verbs, objects. Found and fixed in
       the kit: `ObjectPage` takes the toast inside the page (beside it, the shell's rules broke
       and left an 80 px gap), and the toast sits above ⊕ (PAT-74). `nuovo` (PAT-11) moves to
       the first type change: no type without its own folder has a generic form today.
2. [x] PAT-13 kit `InPlace` (+ `inPlaceCommit`, tests): a whole-row value, tapped → its
       `Field`, leaving or Enter saves, Esc puts back, an error keeps it open; on the generic
       ObjectPage every declared field (empty ones too) through `act edit`, toast «Salvato ·
       Annulla»; gallery section «valori» photographed. Checked on `/corpo/tragitto/<id>`.
3. [x] PAT-18 kit `MergeSheet`: «Quale è la stessa cosa?» with `Find` over the others, then
       what moves in words (`mergeLines` from `mergePreview`), «Non si può annullare.»,
       «Scegli un altro» / «Unisci» in tomato; `listObjects` in `core/verbs`; on the generic
       page through `act merge`, toast «Uniti». Gallery `?aperto=unisci` photographed. Checked
       on two local routes: the kept one took the missing duration, the other archived.
4. [x] PAT-43/19 kit `Elenco`: one `List` section per type (rows open the page, «+ Nuovo …»
       last, PAT-11), «Attivi · Archiviati» chips as links, the doppioni hint; the one detector
       `core/catalog/twins.ts` (`nameKey`, `nameTwins`: same words without accents, small words,
       order); gallery «elenco» photographed. The food/exercise detectors join it, and the area
       Elenco pages move onto it, in their types' changes. PAT-11 left `untested.txt`.
5. [x] PAT-62/14 kit `Composer`: the lines as boxes (stepper in its unit, «Togli»), the search
       under them (as the food composer), totals as they change, the type's own fields, sticky
       `k-formfoot` «Annulla» + «Salva» (off with no line); a plain form read with `readLines`
       (`addLine`/`removeLine`/`setQuantity`, tested). Gallery «compositore» photographed. The
       food composer and the session move onto it in their types' changes.
6. [x] PAT-60/10 kit `Capture`: one sheet, one `Find` over every type and object; with nothing
       typed the types, the current area's first then by use (`captureIdle`), never the objects
       until he types. `Find` gets `idle` (rows shown with nothing typed). Gallery
       `?aperto=aggiungi` photographed. `/aggiungi` moves onto it with the first type change.
7. [x] PAT-52 one ruler: kit `Fascia` (Nutrients' ZoneBand moved, its copy in `Box` replaced;
       Box's markup proven byte-identical before/after), `scoreFascia`, `FasciaBar`, and one
       chip `Judge` (mark + number + word). PAT-33 kit `ContextLine` (MOD-53). Gallery
       «giudizio» photographed; the other kit photos unchanged. The day and object pages move
       their hand-written marks onto `Judge` in their types' changes.
8. [ ] Delta into `patterns.md`; change archived; `verify` photos in the PR.
