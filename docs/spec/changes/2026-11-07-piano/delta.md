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
- **DT-34** adds (Q-19 (a), «ap yc» 12 Nov): before the next «migrate v2» he runs the restore
  drill of a v2 dump (`scripts/restore-drill.sh`, `docs/runbooks/restore-drill.md`) and puts a
  second copy of the backup key where the runbook says; the loader fix of the 6 Nov export is
  done (#345). *Undo:* a change picking (b) after the Piano, or (c) the risk written here.
- **PAT-61** adds: WHEN a field says how often (a blocco's `recurrence`, PL-20) THEN it is
  «Ogni quanto»: one choice (ogni giorno · certi giorni · ogni N giorni · N volte a settimana ·
  in certe date) and that kind's own control (weekday chips in two rows, a stepper, native
  date pickers), said in words under it («lun, mer, ven»); it posts the engine's `Recurrence`
  as JSON text, checked by the kit and again by the registry. Kit ✓ `Recurrence` (in `Field`,
  `type="recurrence"`), the stepper shared as `Stepper`. [Q-15 (a), his «segui i tuoi
  consigli» 10 Nov]
- **PAT-04** «Moved» adds: ciclo (change 2026-11-07-piano; `[area]/ciclo/[id]` redirects to
  `/oggi/ciclo/<id>`; `componi` mounted under `oggi` too, `compose-route.tsx`).
- **PAT-11** adds: a type with plain declared fields gets the generated form (`NewObjectForm`:
  its name and its fields, `objectCreate` through `core/verbs`); the ciclo is the first.
- **PAT-30** adds: a `ref` field is a row like the others, a choice of his live objects of its
  catalog, shown by name (`readRefs`); a field marked `internal` is stored, never a row (its
  type's section edits it: a blocco's `kind`). *Decided by Claude.*
- **PAT-62** adds: a line may be `fixed` — no stepper, its quantity posted as it is (a
  blocco's type, PL-03).
- **PAT-61** adds: «Ogni quanto» has a sixth choice **«Nel ciclo»** (`{"type":"inCycle"}`):
  no control of its own, said as «Nel Piano quando il passo del ciclo che lo tiene è di
  turno»; gallery `#ogni-quanto`. [Q-18 (a)]
- **PL-20** «Today» line: «nel ciclo» is the engine's `{ type: "inCycle" }`; `plannedOn` is
  false for it (only a step plans it). [Q-18 (a)]
- **PL-30** «Today» line: a step's item is a blocco «nel ciclo» (`cycle_step_items.item_id`,
  no schema change). Saving the steps turns a scheda picked into his live blocco «nel ciclo»
  holding it alone, else a new one (its name, Corpo, no time; a name his blocchi have takes
  « (ciclo)», *decided by Claude*). The step's keys for E3 are its blocchi's objects (a
  session of the scheda advances it, PL-31); on its day `dayBlocks` plans each of its blocchi
  with its own when, shown «dal ciclo». Steps that still hold a scheda are read as before until
  the data migration (Q-18 (a), after Q-19). A blocco «nel ciclo» anchored («N min prima/dopo
  di») to a blocco a due step holds comes with it, chains too (the caffè before the Push;
  «Nel ciclo» says so under it). [Q-18 (a), Q-24 (a)]
- **PAT-62** adds: a ciclo's step Composer searches his blocchi «nel ciclo» first, then his
  schede, each line said by what it is («blocco nel ciclo» · «scheda»). [Q-18 (a)]
- **PAT-61** adds: a day is `Field type="date"` (registry field type `date`, ISO, native picker).
- **PAT-62** adds: a ciclo's steps are composed as ordered lines (the scheda's
  `counted={false}`), with a fixed «+ Riposo» under the search that adds an empty step; a
  step's line says its blocco or «Riposo». [Q-16 (a), 10 Nov]
- **PL-70** «Today» line: blocchi and cicli are catalog objects (`block`, `cycle` in the
  registry): page, verbs, Elenco and archive are the generic ones.
- **PL-72** «Today» line: the migration of this change (cicli kept with their ids, day models /
  week layouts / habits → blocchi, «Rec» → Obiettivi), run by his «migrate v2».
- **PL-40** «Today» line: the Piano of a day is read from the blocchi (`core/plans/day-blocks.ts`
  `dayBlocks`: `blocksOn` + each ciclo's step with its scheda, placed by E3 `apply`, left out
  when covered by a voce of its object or of its type and category), shown on Oggi and Oggi ·
  Piano as previsto rows «dal piano» / «dal ciclo» (`features/day/block-items.ts`). On the
  first read of today they are written as previsti carrying `entries.block_id` (Q-17 (a);
  `write-day.ts`); what cannot be a voce by itself stays a computed row. A blocco that holds
  nothing plans nothing. *Decided by Claude.*
- **MOD-33** adds: the link is `entries.block_id` (FK, restrict: PL-70's «Elimina only when no
  voce links to it»), one voce per blocco per day; `entry_links.from_block` is not used. [Q-17]
- **PL-61 / MOD-42 / FD-20** «Today» line: the day's food targets read three goals
  (`metric.source` foodDeficit · proteinPerKg · fatPerKg, `core/goals/food.ts`), «Rec»'s values
  copied by `drizzle/0008` from its first day (past days keep their numbers, PL-41); the day
  models archived; no fixed-model branch left (`core/day/targets.ts` `dynamicTargets`).
  Obiettivi shows them as goal rows «entra negli obiettivi di ogni giorno». *One goal per number
  and their sources decided by Claude.*
- **PAT-03** adds: an area's Piano tab is its blocchi (and Corpo's the cicli) on the kit
  `Elenco`; Oggi · Piano is the week of every area with the blocchi and cicli under it.
- **PL-43** «Today» line: «Cambia la giornata» and «Salva come modello» are gone with the day
  models; «Salta», a step by hand, «Copia ieri», «Sposta l'allenamento» stay.
- **PL-60** «Today» line: shares are no longer read (`features/day/slots.ts` gone); the food
  Composer's `slots` prop is unfed until a food blocco's real kcal judges its share.
- **PL-44** «Today» line: «Ripeti nel Piano» on a logged voce's page opens «Nuovo blocco»
  prefilled from it (`?voce=`; `blockSeedOf`), the blocco holding its object or type with its
  category. «Salva come modello» is gone. *The words «Ripeti nel Piano» decided by Claude.*
