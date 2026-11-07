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
- **PAT-43** «Today» line: Cibo · Elenco reads the one detector; «Possibili doppioni» opens the
  `MergeSheet`.
- **PAT-60** «Today» line: `/aggiungi` is the kit `Capture`.
- **PAT-62** «Today» line: the food composer is the kit `Composer`.
