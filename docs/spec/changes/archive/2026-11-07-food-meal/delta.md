# Delta — 2026-11-07-food-meal

## MODIFIED
- **MOD-02** «Today» line: cibo and prodotto declare their label values per 100 as fields; the
  food and pasto screens read the registry.
- **PAT-04** «Today» line: cibo, prodotto and pasto are served by the family route; WHEN a type
  has lines THEN `/{area}/{type}/{id}/componi` is its Composer (PAT-62), from one map by type
  key; the per-type folders `cibo/` and `pasto/` are gone.
- **PAT-16 / PAT-17** WHEN he opens «Altro» on an object whose type has a create form THEN
  «Parti da…» opens it prefilled from the object (`nuovo?da=<id>`) and, for a type with
  variants, «Variante» opens it as a child (`nuovo?variante=<id>`).
- **PAT-43** (Q-11 «a», his «scegli tu» 7 Nov) Elenco of an area = its types as `List`
  sections + «Archiviati» + «Possibili doppioni» hint WHEN a detector finds some: the one name
  detector (`core/catalog/twins.ts`: the same words without accents, case, punctuation, small
  words or order) for every type, and for cibo and pasto also their proposals — «X è una marca
  di Y» (a brand in the name) and «variante» (two pasti with mostly the same cibi; ADR-0060) —
  never a pair he said are different. The hint opens «Possibili doppioni», one pair per box
  with the proposal as its first button (Uniscili · È una marca di · Variante di · Sono
  diversi); «Unisci» on an object's page is the `MergeSheet` (PAT-18). — Today: built
  (`features/library/twins.ts` reads `nameTwins` for cibi and esercizi).
- **PAT-60** (Q-12 «a», his «scegli tu» 7 Nov) **Capture** (⊕): a sheet over any page, one
  `Find` over every type and object; WHEN nothing is typed THEN it shows the day's ranked rows
  first — previsti to tick (PAT-15), what he logs at this hour (MOD-51), schede to start, water
  in one tap, the last meals — then the types, the current area's first; «Adesso · Previsto ·
  Prima» says when what opens from it happened. One tap on a ranked row logs it with Annulla;
  an unknown thing becomes a stima object at once (FD-92). One door per type. Kit `Capture`.
- **PAT-62** «Today» line: the food composer is the kit `Composer`.
