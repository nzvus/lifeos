# Delta — 2026-11-06-kit-patterns

## MODIFIED (meaning unchanged; «Kit ✗» becomes «Kit ✓» with the component and its test)
- **PAT-04** WHEN he opens `/{area}/{type}/{id}` THEN one route resolves the type from the
  registry and shows its ObjectPage (or, until its type change, the type's own page).
- **PAT-10**, **PAT-60** WHEN he taps ⊕ THEN `Capture` opens: one `Find` over every type and
  object, the current area's types first.
- **PAT-13** WHEN he taps a value on an object page THEN it is editable in place; leaving
  saves via `core/verbs` and shows «Salvato · Annulla». No `/modifica` page for a moved type.
- **PAT-14**, **PAT-62** WHEN a type has lines THEN its form is the generic `Composer`.
- **PAT-18** WHEN he picks «Unisci» THEN `MergeSheet` asks for the other, previews, confirms.
- **PAT-19**, **PAT-43** WHEN he opens an area's Elenco THEN its types are `List` sections,
  with an «Archiviati» filter and the «Possibili doppioni» hint.
- **PAT-33** WHEN a voce is open THEN one context line (MOD-53) sits under it.
- **PAT-52** WHEN a number is judged THEN one chip and one fascia bar show it.
