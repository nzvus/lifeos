# Delta — 2026-11-07-piano

## ADDED
- **MOD-36** Storage (ADR-0062): a blocco is a catalog «block» — its object (or a rotation's
  objects, in order, each with its quantity) as `catalog_parts`, or a type (`kind`: a voce
  kind or his tracker, with `defaults` as JSON — an abitudine, a walk of 30 min, PL-01, PL-03), its when (`when` ∈ time · after · before · wake · bed,
  `atMin`, `anchor` a blocco, `offsetMin`), how often (`recurrence`, the engine's `Recurrence`
  as JSON), `area` and `durationMin` as `catalog_values`; a ciclo is a catalog «cycle»
  (`advance` ∈ occurrence · date, `onSkip` ∈ shift · lose, `start` an ISO day) whose steps stay in `cycle_steps` /
  `cycle_step_items` (a step's items are blocchi). WHEN the Piano of a day is read THEN
  `core/plans` turns these rows into the engine's input; no screen reads them directly.

## MODIFIED
- **PL-70** «Today» line: blocchi and cicli are catalog objects (`block`, `cycle` in the
  registry): page, verbs, Elenco and archive are the generic ones.
- **PL-72** «Today» line: the migration of this change (cicli kept with their ids, day models /
  week layouts / habits → blocchi, «Rec» → Obiettivi), run by his «migrate v2».
