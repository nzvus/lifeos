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
3. [ ] PAT-18 `MergeSheet` (`act merge`, preview, confirm); gallery + photos; tests.
4. [ ] PAT-19/43 Elenco sections, «Archiviati» filter, doppioni hint; gallery; tests.
5. [ ] PAT-14/62 generic `Composer` from the food composer; gallery; tests.
6. [ ] PAT-10/60 `Capture` over types and objects; gallery; tests.
7. [ ] PAT-33 context line; PAT-52 judgement chip + fascia bar; gallery; tests.
8. [ ] Delta into `patterns.md`; change archived; `verify` photos in the PR.
