# Round 1 (ADR-0064) — Discover: raw inventory (Sonnet sweep, 20 Nov), then Define (stop A, at the end)

> **Folded 20 Nov (Deliver ①; proposal §123):** the tables are `docs/spec/orca/`; D1–D3 → VIS-40, VIS-102, PAT-100; D4 → MOD-01, MOD-58. Kept here as round 1's record until the change archives (PRD-41).

Every object he knows by name, collected with its sources. Nothing is chosen here; conflicts are
listed, not settled. Counts are computed from the export (rule: no estimates). «Live» = not in the
trash (`deletedAt` empty). The export is `lifeos-2026-11-19.json` (format `lifeos-v2-export`, v1,
exported 2026-11-19 19:43 UTC). No personal values are copied, only counts and field names.

## Sources read
Read whole: `eslint/type-keys.json`; `src/core/kinds/builtins.ts`, `catalog.ts`; `docs/spec/model.md`,
`product.md`; `changes/2026-11-14-five-places/` `reframe.md`, `target.md`, `delta.md`;
`bars-study.md` §16–§23 (§16–§19, §21–§22 read; §20, §23 only by heading); `map.md`;
`patterns.md`; `visual.md` (headings + ID lines only); `domains/*.md` (headings + ID lines; FD-01…07,
FD-50, FD-80, PL-01…03, PL-30, PL-40, PL-70, TR-01, TR-40, BD-24, DT-50…53 read in full);
`src/features/day/words.ts` (UI names of the voce kinds), `src/features/shell/nav.ts` (places by
address), `src/core/food/intake.ts` (how the assunzione flag is stored); `.claude/rules/design.md`
(loaded as context). The export: all 22 tables counted.
Skipped: `proposal.md` (1220 lines, only grep), `method.md`, `tasks.md`, `bars-study.md` §1–§15, §20, §23,
ADR files, `docs/archive/`, `audit-2026-11/`, the rest of `visual.md` and the domains' prose, `src/`
beyond the files above. Registry keys: 20 voce + 14 catalog = 34; all 34 appear below.

### The export, table by table (rows)
settings 1 · kinds 0 · catalog_items 525 · catalog_values 4885 · catalog_parts 263 · price_observations 65 ·
entries 1518 (live 981, trash 537) · entry_values 3509 · entry_lines 1938 · entry_line_values 20054 ·
entry_links 0 · training_sets 1564 (1013 on live session_exercise) · receipts 0 · money_movements 2 ·
money_lines 0 · receipt_aliases 0 · templates 14 · template_blocks 5 · cycle_steps 34 ·
cycle_step_items 20 · cycles_state 7 · week_layouts 7 · goals 9 · decisions 61.
Live entries span 2026-05-28 … 2026-11-19, on 59 distinct days. Status in the DB is
`done` / `planned` / `skipped` (UI: fatto / previsto / saltato). Of the 537 trashed entries 469 are
`planned`-status rows of the old plan (meal 198, session_exercise 205, session 36, intake 29, …).
Entry `source`: `import` / `typed` / `derived`. `entries.blockId` is filled in 0 rows.

## Objects

### Voci (the 20 voce keys; each: a thing logged in time, MOD-10)
Common to all (MOD-10): `start`, `end?` (interval), `day` (logical, boundary 04:00 = settings
`dayBoundaryMin`), `status`, `values`, `lines[]`, `parent?`, `links[]`, `source`, `confidence`, `note`.
Common actions: log (⊕ Capture PAT-60; «Al volo» chips), plan (previsto, MOD-15), fatto / salta (PAT-15),
edit in place (PAT-13), saltato, sposta, elimina → 30-day trash (DT-31), salva come … (MOD-14, PAT-22), why.

### activity — «Attività» (activity)
- A span of time with a category (work, study, commute, chores, leisure, social, family, screen).
- Attributes: `category` (required), `project` (ref project), `focus` (1–5); family habit, class activity,
  domain work, shape interval, capture timer.
- Actions: log by timer; sheet `/aggiungi/attivita` (ActivitySheet).
- Relations: `project` → catalog `project` (no CatalogType, see below).
- Data: 0 rows.
- Sources: builtins.ts; bars-study §18.1; TR-40 uses «attività» for another thing (see Conflicts).
- Conflicts: «attività» = this kind (work/study…) · TR-40 «una sessione di un esercizio cardio» ·
  reframe/bars-study «Attività» = a class (session, trip, steps, reading, chore).

### batch — «Cucinato» (batch)
- A cooking batch of food (class exchange, domain food, instant); has food lines.
- Attributes: `portions`, `label`; composite lines of food.
- Data: 4 live (all done, source import); `portions` 4/4, `label` 4/4, `itemId` 4/4; 18 lines.
- Sources: builtins.ts; MOD-14 not named; bars-study §18.1 lists it under Assunzione.
- Conflicts: builtins class `exchange` · bars-study §18.1 «Assunzione: meal, intake, water, batch».
  No spec file defines it (no FD-/MOD- ID names «batch» or «cucinato»).

### checkin — «Come stai» (checkin)
- How he feels, at an instant (class measurement, domain mind, capture quick).
- Attributes: `mood`, `energy`, `stress` (1–5), `moment` (morning/evening).
- Actions: one tap each, tap again clears (DT-51); judged only vs own 28-day baseline (DT-51).
- Data: 19 live; mood/energy/stress 19/19; moment 1/19; start time null in 18.
- Sources: DT-51; bars-study §18.1 (Misura). Today: baseline, tap-to-clear, 30-day bars «not found» (DT-51).

### chore — «Faccenda» (chore)
- A home chore done (family habit, class activity, domain home, instant, quick).
- Attributes: none declared. Data: 0 rows. Sources: builtins.ts; bars-study §18.1 (Attività).

### intake — «Assunzione» (intake)
- Something taken that is not a meal: coffee, creatine, a supplement; no role, no score, never grouped
  with meals (builtins comment; FD-50: no voto for an assunzione).
- Attributes: `servings`, `label`, `estimated`; composite lines of food; dose = the compound on the line (FD-60).
- Actions: one tap logs (dock, «Al volo», PAT-99); undo; «Fissa» a pin (PAT-99).
- Relations: made of food lines; `itemId` → catalog (see data); feeds caffeine left (FD-61), creatine stores (FD-63).
- Data: 78 live (77 done, 1 planned; source import 41, typed 37); `servings` 44, `label` 41, `estimated`
  filled 41 (true in 0); 78/78 have lines; `itemId` 52 — all 52 point to a `recipe` item, none to a
  flagged food; 39 distinct days.
- Sources: builtins.ts; FD-60…64; MOD §3; bars-study §22.4–22.5.
- Conflicts: spec §3 «assunzione = a food with the `intake` flag» (`intake_item`, MOD-02) · data: 0 foods
  carry `intake`/`dose`/`doseName`; his intake voci link to saved pasti.

### journal — «Diario» (journal)
- A note (class note, domain mind, form). No fields; the text is the voce's `note`.
- Data: 2 live, `note` 2/2, no time (2). Sources: builtins.ts; bars-study §18.1 (Nota). Not in product.md §3.
- Conflicts: UI name «Diario» (words.ts) is also the name of the old tab Diario (PAT-03) and of Oggi · Diario.

### meal — «Pasto» (meal)
- A meal eaten or planned, with a role (colazione / pranzo / spuntino / cena) and food lines.
- Attributes: `role` (4 choices, FD-10), `roleSource` (manual/auto), `servings` (× porzioni, FD-93), `label`,
  `estimated` (stima), `leftOut`; lines of food; relation to the session bands (MOD-60).
- Actions: log (⊕, composer `/aggiungi/pasto`, `/voce/<id>`), plan, fatto/salta/sposta, × servings,
  edit lines (local copy, FD-93), salva come pasto (MOD-14), ripeti nel Piano (PL-44), registra di nuovo oggi,
  open in place (Box levels 0–2, VIS-70), elimina.
- Relations: made of lines (cibo/prodotto/formato snapshot, MOD-11); `itemId` → a pasto (recipe); judged by
  the meal voto (FD-50…54); shown on the time rail; cost (FD-82).
- Data: 315 live (all done; source typed 130, import 185); 49 days. Start time filled 306/315 (9 null).
  `role` 285 (lunch 75, breakfast 73, snack 71, dinner 66), `roleSource` 112 (auto 99, manual 13),
  `servings` 200, `label` 185, `estimated` 188 (true in 27), `leftOut` 0. `itemId` 219 (a recipe; 96 none).
  Lines: 315/315 meals have lines, 1111 lines. Extra field not in the registry: `plannedStart` 12.
  Trash: 218 (done 15, planned 198, skipped 5).
- Sources: builtins.ts; FD-10…13, 50…54, 90…93; MOD-14, MOD-15; PAT-30…32, PAT-60, PAT-62; VIS-40…42;
  target.md §1 (6 drawings), §2.
- Conflicts: «pasto» names both this voce and the catalog `recipe` (saved meal) (see Words).
  PAT-60 «Adesso · Previsto · Prima» and the composer's «Mangiato · Previsto» vs reframe §11 / delta MOD-15
  (the time decides; those buttons go).

### measurements — «Misure» (measurements)
- Body measures alone: `bodyFatPct`, `waistCm`, `hipCm`, `neckCm`, `abdomenCm` (BD-70, form).
- Data: 0 rows (they ride on weigh_in: waist 31/34, the other four 0/34). Sources: builtins.ts; BD-70, BD-71.

### movement — «Movimento» (movement)
- A money movement: signed cents (family money, domain money, specialised capture).
- Attributes: `tags`; table `money_movements` carries amountCents, categoryId, shop, method (DT-50).
- Data: 2 live (note 2/2, tags 1, no time); `money_movements` 2 (category 2). Sources: DT-50; builtins.ts.
- Conflicts: the word «movimento» is also the body-movement model of reframe §12 and BODY-27
  (see Words).

### nap — «Riposo» (nap)
- A nap (class state, interval, timer). No fields. Data: 0 live (1 in trash). Sources: BD-54 (described, not
  scored); builtins.ts. UI name «Riposo» (words.ts).

### purchase — «Spesa» (purchase)
- Shopping: what it brought in (`packages`, `quantity` in the food's unit, `priceCents`, `shop`); domain home.
- Data: 0 rows (prices arrive as `price_observations`, 65 rows, all source import). Sources: builtins.ts;
  MOD-22; FD-81. Pantry that plans: product.md §4 «not now».

### reading — «Lettura» (reading)
- A reading span: `book` (ref book), `pages`. Data: 0 rows. Sources: builtins.ts; bars-study §18.1 (Attività).
- Relations: `book` → catalog `book` (no CatalogType, no rows).

### session — «Allenamento» in UI, «sessione» in the spec (session)
- A gym visit, interval, made of session_exercise children each holding serie (TR-01).
- Attributes: `durationMin`, `intensity`, `kcalEstimate`, `rpe` (0–10), `label`, `muscleGroups`; spec adds
  readiness 1–2 (TR-33), «Come ti senti?» 1…5 in the gym.
- Actions: start from a scheda («Da un modello») or «Inizia senza modello»; gym mode (PAT-63: Timer, set by
  set); Finisci / Riprendi / Esci; salva nella scheda (MOD-14); fatto / riprendi / elimina (target.md §7.3).
- Relations: children session_exercise; `itemId` → a scheda; voto (TR-50); energy input (BD-13); a «span» frame
  (reframe §2).
- Data: 45 live (all done; typed 13, import 32); start time 40/45; `endAt` 40; `itemId` 38 (all `routine`);
  `durationMin` 45, `label` 32, `readiness` 3 (not in the registry); `rpe`/`intensity`/`kcalEstimate`/
  `muscleGroups` 0; `note` 8; 40 days. Trash 46 (done 10, planned 36).
- Sources: TR-01…07, 50; MOD-14; target.md §7; PAT-62/63; product.md §3 (sessione, «allenamento» is «Not»).
- Conflicts: product.md §3 «sessione… Not: allenamento (as object)» · words.ts NAMES `session: "Allenamento"`.

### session_exercise — an exercise inside a session (session_exercise)
- Child of a session: one exercise with its serie (child: true).
- Attributes: `position`, `restS`; serie in `training_sets` (reps, load, RIR, warm-up, side, start, end, done).
- Actions: fai dopo, cambia, salta (a session_exercise with no set at Finisci is saltato, TR-05); reorder.
- Data: 318 live (done 307, skipped 11); `parent` 318, `itemId` 318 (all `exercise`); `restS` 205; `position` 318;
  25 distinct exercises; 307 have live sets. Trash 232.
- Sources: TR-01, 05, 06; builtins.ts. No word of its own in product.md §3.

### sleep — «Sveglia» in UI, «sonno» in spec (sleep)
- A night, interval, anchored on its end (wake); built from pieces (BD-50), belongs to the date of its wake (BD-51).
- Attributes: `quality` (1–5), `bedAt`, `wakeAt` (only when pieces did not make a span); awakenings (BD-56).
- Relations: voto (BD-53), regularity; the sleep engine (`core/engines/sleep`); context for training (TR-26).
- Data: 40 live (start+end 40/40, source typed 14, import 26); `quality` 36; `bedAt`/`wakeAt` 0; 40 days.
  Trash 3.
- Sources: BD-50…57; bars-study §22.7. Conflicts: UI «Sveglia» vs spec «Sonno» vs BD-52 «Sveglia» = a time.

### steps — «Passi» (steps)
- A day's steps, one reading a day (BD-40), no time (instant, quick).
- Attributes: `steps`, `walkingMin`, `onFeetH` (BD-42), `level` (sitting/mixed/on_feet, old).
- Actions: type once a day; planned as «an amount to reach» (target.md §6).
- Data: 43 live (typed 18, import 23, derived 2); `steps` 43; `level` 28 (sitting 15, mixed 9, on_feet 4);
  `onFeetH` 1; `walkingMin` 8; start time null in 40. 43 days.
- Sources: BD-40…44; reframe §12 (windows of movement); bars-study §22.10.
- Conflicts: product.md §4 «step windows… not now» was dropped by reframe §12/§13 (his «yc» 20 Nov).

### stock_count — «Scorta» (stock_count)
- A count of what is at home (`quantity`). Data: 0 rows. Sources: builtins.ts; the Dispensa (target.md §1 row 2);
  product.md §4 (a pantry that plans: not now).

### trip — «Tragitto» (trip)
- A trip along a route: walk, run, bike, bus, train, car, mixed (interval).
- Attributes: `route` (ref route), `mode`, `distanceKm`, `walkingM`.
- Actions: one tap logs a repeated trip (BD-43); salva come tragitto (MOD-14).
- Data: 7 live (all done, typed); start time 7, `endAt` 7, `itemId` 7 (all `route`); `mode` 7 (mixed 4, walk 3),
  `distanceKm` 7, `walkingM` 7; 2 days. Trash 2.
- Sources: builtins.ts; BD-43; BODY-27 (via reframe §12). Conflicts: «tragitto» = the voce (trip) and the
  catalog `route` (both called «tragitto», words.ts and catalog.ts).

### water — «Acqua» (water)
- A drink of water, in ml (instant, quick); shows as an assunzione (FD-73).
- Attributes: `ml` (1–5000, required). Actions: +250 / +500 on the Acqua box, in the dock (PAT-99).
- Data: 74 live (typed), `ml` 74/74, 21 days, all with a time. Sources: FD-70…73; BD-60; bars-study §22.6.

### weigh_in — «Peso» in UI, «pesata» in spec (weigh_in)
- A weighing, with the body measures, instant, quick.
- Attributes: `weightKg` (required), `bodyFatPct`, `waistCm`, `hipCm`, `neckCm`, `abdomenCm`, `fasted`,
  `afterToilet`, `afterTraining` (reliability, BD-02).
- Actions: log; plan («pesata» as a ritmo, target.md §6 Q4); the page Peso (Chart, «Pesate»).
- Relations: feeds the Kalman filter (BD-01); voto parts reliable + pace (BD-03).
- Data: 34 live (typed 13, import 21); `weightKg` 34, `waistCm` 31, `fasted` 33 (true in 25), `afterToilet` 33,
  `afterTraining` 33; body fat/hip/neck/abdomen 0; start time 33; 34 days. Trash 3.
- Sources: BD-01…06, 70; bars-study §22.8. Conflicts: UI «Peso» · spec «pesata» (target.md, PL) · «Pesate»
  (the page's list).

### Catalog (the 14 registry keys + the catalog-like words outside the registry)
Common life (MOD-20, PAT-16…20): crea · parti da · variante (variants rule only) · modifica in place ·
unisci · archivia · ripristina · elimina (only if unused). One page `/{area}/{type}/{id}` (PAT-04),
one Box at three levels (target.md §2).

### abitudine (— not a registry key)
- A blocco whose object is a tracker («bere 2 l ogni giorno»); its own word because he recognises it (PL-03, product.md §3).
- Relations: blocco → tracker; covered by any voce of its type that day. Data: no tracker rows (`kinds` 0).
- Sources: PL-03, PL-71, product.md §3 note, PROD-45. PL-71 lists «abitudine» among UI words.

### block — «blocco» (block)
- Something planned that repeats: what + when + how often + area (MOD-30, PL-01…).
- Attributes: `area` (required), `when` (time/after/before/wake/bed), `at`, `anchor` (ref block), `offsetMin`,
  `durationMin`, `recurrence` (required), `kind` + `defaults` (internal, a type with defaults).
- Actions: create, parti da, edit, archive, restore, delete, undo (no variant, no merge); BlockComposer;
  Ripeti on any voce (PL-44); «Questa volta»: passo, salta, sposta (PL-43).
- Relations: its object(s) in `catalog_parts` (a pasto, a scheda, an assunzione, a tragitto, a tracker); a
  rotation = several objects in order (PL-02); «nel ciclo» = held by a ciclo step (PL-30).
- Data: 3 (area 3, recurrence 3; `when`/`at`/`anchor`/`offsetMin`/`durationMin` 0); parts 3 (block → routine).
  Legacy: `template_blocks` 5 (meal 4, session 1).
- Sources: MOD-30, 33, 36; PL-01…03, 10…13, 20…21, 70…71; catalog.ts; delta MOD-30…36.
- Conflicts: product.md §3 «blocco» is a word · delta «blocco leaves the screens… forbidden once the last
  form of a loose blocco goes» · PL-71 «blocco» is a UI word (see Words).

### book (book) — no CatalogType
- Declared as a `ref` target of `reading.book` only (builtins.ts); in type-keys.json `catalog`; 0 rows.
- No spec home: not in model.md §3, product.md §3 or any domain file.

### cycle — «ciclo» (cycle)
- Blocchi that advance one step per occurrence or per date; on skip, shift or lose (MOD-31, PL-30…33).
- Attributes: `advance` (occurrence/date), `onSkip` (shift/lose), `start` (date); steps in `cycle_steps`,
  step items in `cycle_step_items` (blocchi «nel ciclo»).
- Actions: create, parti da, edit, archive, restore, delete; CycleComposer; «oggi Push, poi Riposo» (PL-33);
  skip / override as decisions.
- Data: 6 live (5 archived); `advance`/`onSkip`/`start` 6/6; `cycle_steps` 34 (label 14); `cycle_step_items` 20;
  decisions `cycle_override` 4, `cycle_skip` 3. Legacy: `templates` scope cycle 7; `cycles_state` 7.
- Sources: MOD-31, 36; PL-30…33, 43; delta MOD-30…32 («giornata tipo» = a ciclo's step).

### esercizio (exercise)
- An exercise of the gym, with variants.
- Attributes (registry): `pattern`, `equipment`, `sides`, `muscleGroups`, `loadStepKg`, `restS`, `setupS`,
  `warmup`, `guide`. Learnt/computed: e1RM, records, trend (TR-20…24).
- Actions: create, parti da, variante, unisci, archivia; the settings link `ExerciseSettings` (rest, setup).
- Relations: lines of a scheda; `itemId` of a session_exercise; «Usato in».
- Data: 70 live (2 archived); values: `kind` 70, `pattern` 70, `unilateral` 70, `muscleGroups` 70, `guide` 54,
  `notes` 48, `equipment` 34, `aliases` 2, `mergedInto` 2; registry fields `sides`, `loadStepKg`, `restS`,
  `setupS`, `warmup`: 0 rows.
- Sources: catalog.ts; target.md §7; TR-01…37; PAT-43 (doppioni).
- Conflicts: target.md §7.1 «the registry declares only `guide`» · catalog.ts (17 Nov) declares 9 fields ·
  data holds `unilateral`, `kind`, `notes` (not declared) and none of `sides`, `restS`, `setupS`, `warmup`.

### formato (format)
- A package size of a prodotto, holds barcode, weight, price per kg (FD-03); level 3 of cibo › prodotto › formato.
- Attributes: size, unit, shape (data); registry declares no fields. Verbs: create, edit, archive, restore,
  delete, undo only.
- Data: 74 live (all with parent; `unit` 74, `size` 69, `shape` 64, `barcode` 12); 76 total (2 deleted).
  `price_observations` 65 (formatId 65, packageQty 65, shop 40, all import).
- Sources: FD-01, 03, 81; MOD-22; target.md §2 (nested, no shelf of its own); PAT-43.
- Conflicts: target.md B3 «No screen links to a marca's or a formato's own page».

### cibo (food)
- A food with ~40 nutrients per 100 g/ml; level 1 of the levels rule.
- Attributes: `kcal`, `protein`, `carbs`, `sugars`, `fat`, `saturatedFat`, `fibre`, `salt`, `nova` (LABEL_FIELDS,
  FD-04, FD-91); group, DIAAS band, fatty acids, free/intrinsic sugars, caffeine, creatine, water, micros.
- Actions: create (barcode, FoodForm), parti da, unisci, archivia; «Possibili doppioni»; «Etichetta» door.
- Relations: parent of prodotti; line of pasti and meals; «Usato in»; price from formato.
- Data: 144 live (23 archived; 5 deleted): kcal/protein/carbs/fat/saturatedFat/salt 144, sugars 143, fibre 135,
  nova 122, group 105, origin 112, micros 105 each (vitD, b12, vitC, folate, ca, fe, mg, k, i, se, na, water),
  fat kinds 94, protein kinds (low 56, medium 37, high 21), caffeine 2, creatine 1, barcode 4, aliases 5.
- Sources: FD-01…07; catalog.ts; model.md §3; target.md §1 (drawn 9 ways), §2. Value provenance:
  `source` column: v1 2567, estimate (agent, CREA/CIQUAL/USDA) 1958, typed 284 (catalog_values rows, all types).

### giornata tipo (— not a registry key)
- A ciclo's step with its lines (riga); the prototype of a day (product.md §3 row, delta MOD-30…32).
- Data: legacy `templates` scope day 7 (5 active overall, 5 deleted in total); `cycle_steps.stepTemplateId` 0.
- Sources: product.md §3; delta; proposal §29 (not read). Conflict: PL-71 «giornata tipo… never appear».

### intake_item — «assunzione» as a catalog object (intake_item)
- A food with the `intake` flag: coffee, creatine, a pill (`storage` catalog «food», flag `intake`).
- Proposed automatically at ≤ 4 kcal/100 or with caffeine/creatine (FD-64, `intakeOf`); dose = what one tap logs.
- Verbs: ALL; capture quick. Data: 0 flagged foods (no `intake`, `dose`, `doseName` values).
- Sources: catalog.ts; FD-60…64; MOD-02, MOD-14; ADR-0060 (not read).
- Conflicts: same word «assunzione» as the voce `intake` (see Words).

### pasto salvato — «pasto» (recipe)
- A saved meal, variants of a base; lines of food with quantity.
- Attributes (data): `role`, `dish`, `notes`; none declared. Verbs: ALL + variant + saveAs.
- Actions: Composer `/…/componi`; registra; variante; «Pasti adatti» ranked by voto (FD-53).
- Relations: lines → food (catalog_parts); `savedFrom` meal; used by `meal.itemId` and `intake.itemId`.
- Data: 24 live of 67 (43 deleted, 6 archived; parent 8, basedOn 2); `role` 19, `dish` 12; 200 parts (recipe → food,
  any state). Used by 22 distinct pasti in meals.
- Sources: model.md §3; FD-53; target.md §1–§2 (drawn 6 ways); PAT-62.

### progetto (project) — no CatalogType
- Ref target of `activity.project`; 0 rows. No spec home (not in model.md §3).

### prodotto, «marca» (product)
- A brand/variant of a cibo; level 2; values only where they differ from the cibo (FD-01).
- Attributes: same label fields; search by name, brand, barcode; data `shop`, `name`.
- Data: 72 live of 77 (5 deleted); parent 72/72; label fields 4–5 rows each. Lines with `productId`:
  1608 of 1938.
- Sources: FD-01, 02; target.md §2 («marca»); catalog.ts. Conflicts: spec «prodotto» · design.md/target.md
  «marca» / «Marche» (see Words). Verbs: registry ALL vs target.md «crea · unisci · archivia».

### ritmo (— not a registry key)
- What repeats, named, shown as a tag on its line; three shapes: a voce due · a time to hit · an amount to
  reach (target.md §6; product.md §3 row; his «yc» 15 Nov, 17 Nov).
- Today it is a blocco's `recurrence` (PL-20: every day, weekdays, every N days, N times a week, dates, nel ciclo).
- Sources: product.md §3; target.md §6; PL-20; PAT-61 «Ogni quanto»; PAT-97. Not a type in model.md.

### route — «tragitto» (route)
- A named route (mode, distance, duration, walking meters, maps URL); a shortcut (BD-43).
- Attributes: `mode` (required), `distanceKm`, `durationMin`, `walkingM`, `mapsUrl`. Verbs: ALL.
- Data: 5 live (mode/distance/duration/walkingM/mapsUrl all 5). Used by the 7 trips.
- Sources: model.md §3; BD-43; catalog.ts. Conflict: same word as voce `trip`.

### scheda (routine)
- The exercises of a session (a model); variants; lines without quantity (PAT-62).
- Attributes: data `position`, `notes`, `itemsSavedAt`; none declared. Verbs: ALL + variant + saveAs.
- Actions: Composer (Su/Giù), «Inizia», «Cambia gli esercizi», salva nella scheda.
- Data: 9 live of 14 (5 deleted); `position` 9, `notes` 6, `itemsSavedAt` 3; 60 parts (routine → exercise);
  `session.itemId` 38 → routine.
- Sources: product.md §3; model.md §3 («routine» word wrong, CONTRA-04); PL-71 (code still says routine, ~149);
  target.md §7.3. Conflict: registry key `routine` vs the word.

### tag (— not in the registry)
- Data only: catalog `tag` items (Esselunga, Lidl, Surgelato, Senza lattosio, Bulk, Senza glutine as names) with an
  `icon`; applied to foods as value fields `tag:<id>` (food rows with a tag: 36 + 6 + 3 + 3 + 2 + 1).
- 6 items. No registry key, no spec home; FD-94 mentions «free tags» of v1, kept as data.

### tracker — «tracker» (tracker)
- His own type: a registry row (name, family, instant/duration, ≤ 6 fields) in the `kinds` table (DT-52).
- Verbs: create, startFrom, edit, archive, restore, undo. Area Oggi. Form TrackerForm; Elenco has a «Tracker» section.
- Data: `kinds` 0 rows. Sources: MOD-01, model.md §3; DT-52; PL-03; product.md §3 (a tracker word).
- Conflict: model.md §3 area «any» · catalog.ts area «Oggi».

### categoria di spesa (money_category)
- A category of money (levels, parent = itself); a sub-category counts for its parent (DT-50).
- Data: 51 live (parent 30); values `position` 51, `kind` 51, `icon` 21, `key` 2. Sources: DT-50; catalog.ts.

### Signals (computed; none stored: DT-14)

### aderenza (adherence)
- Planned days done out of planned (PL-21); saltato counts, never as zero (DT-02). Sources: PL-21, PL-62, DT-02.

### caffeina rimasta (caffeine left)
- Σ dose × ½^(h/5 h); judged at bedtime (FD-61, 62); drawn today only as a pill; a lane is proposed
  (reframe §14, bars-study §22.4). Data: 2 foods carry `caffeine`.

### consiglio (advice)
- A sentence when a metric is out of its fascia or a goal is off pace, fix in one tap, at most one per box
  (MOD-52, PRD-25). Engines list: TR-34 «Cosa aggiungere», TR-35 «Fai dopo».

### contesto (context)
- Relations in time windows, one line beside a voce (MOD-53, PAT-33 `ContextLine`); labels pre/post-workout
  (MOD-60, FD-12); never inside the number (PRD-21).

### copertura e «non so» (coverage, unknown)
- Share of the window with data; below the threshold the judgement is «non so» (MOD-41, PRD-23, PAT-55
  `Unknown`, FD-41 80 %). Page «Qualità dei dati» per kind «21/30».

### costo (cost)
- «Costo ≈ € · n senza prezzo»: line cost = grams × snapshot `cents` (FD-80…84); never merged with «speso»
  (Soldi movements) or the voto. Data: 65 price observations.

### energia (dispendio)
- Expenditure learnt from intake and weight (Kalman), with the day's pieces Base · La giornata · Passi ·
  Allenamento · Digerire (MOD-54, BD-01, BD-20…24); «Energia del giorno ≈ kcal ±»; `consumo appreso`.
- Conflict: three names (energia, dispendio, consumo) (see Words).

### meteo (weather)
- Open-Meteo for his city, read live, context only, not saved as entries (BD-61, product.md §4);
  levels 0·1·2 (VIS-75). In reframe §14 a «signal»; in bars-study §18.1 the class «Contesto».

### prontezza (readiness)
- 1–2 typed at the start (or a night < 6 h): same load, one set fewer (TR-33). Data: `readiness` on 3 sessions
  (field not in the registry). Gym: «Come ti senti?» 1…5.

### progresso (progress)
- Compare a voce with past voci in the same context; «stesso carico, +2 ripetizioni», trend per object,
  never a % (MOD-50, TR-20…24). e1RM = load × (1 + reps/30) (TR-21); the exercise's trend (TR-24).

### proposta (proposal / prefill)
- Every new voce starts from what he usually does at that time (MOD-51); blocco proposals (MOD-34, PL-50…52);
  the gym's next-set proposal (TR-30…31, found wrong in target.md §7.5).

### record (TR-23) — also a reference
- Best ever per exercise from confirmed working sets, after the 3rd session (TR-23); a notch on a bar (bars-study §16.3).

### ritmo dell'obiettivo — «pace» (rate)
- kg/week, «servono −0,88 kg/sett. · vai a +0,08» (MOD-42, FD-21, Obiettivi). Name clash with plan `ritmo`.

### sedentarietà e finestre di movimento (movement windows)
- Windows of time moving / on one's feet / seated; sedentary time and its longest stretch (reframe §12;
  BODY-27/31; product.md §4 «not now» dropped 20 Nov). A lane parallel to the rail with typed «quanta».
  Today: only `steps` and `onFeetH`; no window data.

### scorte della creatina (creatine stores)
- S_t = min(1, S_{t−1}(1−k) + r·dose/E_max) (FD-63); «scorte ≈ 63 %», «in calo da 9 giorni»; the «tank»
  instrument (bars-study §21.3, §22.5).

### serie di giorni (streak)
- Consecutive windows meeting the target; a window with no data breaks it (DT-13); yes/no cells (bars-study §19.1).

### stima (estimate)
- A pill «calcolato da …» (product.md §3, VIS-23); confidence 0.6 (MOD-12); `estimated` field on meal/intake;
  «Stima» tab of the composer; a «stima object» for an unknown thing (FD-92, PAT-60); `estimate:` as a value source.

### trend
- The weight line without water (EMA, BD-01); trend per exercise (TR-24); the Chart (PAT-53); `trend +1 kg`.

### volume per muscolo (volume per muscle)
- Working sets per muscle per ISO week; 10–20 a week (TR-25), «Cosa aggiungere» under 10 (TR-34).

### voto (score)
- A 0–100 judgement from declared parts, each a metric vs its fascia with a weight (MOD-43); one scale ≥ 70 ·
  ≥ 40 · < 40; chip with skyline (VIS-43, PAT-52, PAT-98: number only, «–» when it cannot score).
- Scopes: meal (FD-50…54, per 100 kcal for a food), day, session (TR-50), weigh-in (BD-03), sleep (BD-53),
  water (FD-72), exercise/«Voto per 100 kcal». Weights fixed (FD-51, TR-50) · «adjustable weights» not now.
- Actions: why («Perché?», PAT-51); open to rulers; page «Come valutiamo».
- Conflicts: product.md §4 «adjustable score weights: not now» · design.md «Come valutiamo shows a slider per criterion».

### References (what a number is read against)

### decisione (decision)
- What formulas must not rewrite: a closed day, a frozen target, a skipped voce (MOD-44, PL-43).
- Data: `decisions` 61 (day_closed 44, week_targets 8, cycle_override 4, cycle_skip 3, day_targets 2).

### fascia (range)
- A range with a source; MOD-41 says «minimo / buono / massimo»; FD-30 says four levels «da evitare · pessimo ·
  ok · ottimo» (FD-31 edges, FD-33 limits, FD-40 micros, FD-35 per meal). Drawn as the zones ruler (VIS-52).
- Conflicts: three words (minimo/buono/massimo) vs four levels; product.md §3 «il minimo, il buono, il massimo».

### fonte e fiducia (source, confidence)
- On every value: typed 1 · weighed 1 · label 0.9 · estimate 0.6 · assumed 0.3 (MOD-12). Assumed never enters a
  trend or voto (PRD-22, DT-20). Data: entries `source` import/typed/derived; catalog_values `source` strings.

### impostazioni (settings, «Profilo»)
- timezone, locale, theme, density, dayBoundaryMin, sex, birthYear, heightCm, prefs (place, listPer, listSort,
  notTwins, lunchFrom, snackFrom, dinnerFrom, autoTargets, trendsRange). Data: 1 row, all fields filled.
- Reframe §11 adds settings: the slack (20 min), what a past previsto becomes (saltato/da confermare/confermato).

### limite (limit)
- «Less is better» numbers: free sugars, saturated fat, salt (also trans, caffeine ≤ 400 mg, inulin); judged on the
  day and the 7-day mean (FD-33, FD-36); a tick for the week's mean. Sources: FD-33, FD-62; bars-study §22.2.

### media della finestra (window mean) — a reference (bars-study §16.2, FD-33).

### obiettivo (goal)
- Metric + window + at least | at most | range | reach-by-date, dated history; progress, pace, ETA derived
  (MOD-42). The day's food targets are goals (FD-20…22). «n obiettivi · n senza dati»; a goal with no data is
  offered for removal (DT-53, not built). A goal may read as yes/no (bars-study §19.1).
- Actions: «+ Nuovo obiettivo» (GoalForm); where an amount lives = the ritmo, Obiettivi reads it (target.md §6 Q2).
- Data: `goals` 9 (target, value, sinceDay 9/9; `byDate` 2; `low`, `high`, `untilDay` 0). Metric is JSON with keys
  such as split, source, protein, goalKind, kcalFloor, ratePctWeek, weeklyCheckIn, checkInWeekday.
- Sources: MOD-42; FD-20…23; DT-53; PL-61; bars-study §22.11.

### sé stesso di prima (past self / ghost)
- The same exercise/position/load, or same meal at the same hour (MOD-50, TR-20); a ghost mark on the same scale
  (bars-study §16.3). Frame rule: which past self is chosen by the frame (§17.1).

### target del giorno (the day's target)
- kcal, protein g/kg, fat g/kg, decided once per week (BD-30, FD-20…24, MOD-44); the moving tick on a bar.
- Data: decisions `day_targets` 2, `week_targets` 8. Conflict: «target» vs «obiettivo» (see Words).

### Places (pages and presets; no data rows)

### Aggiungi / ⊕ / Capture
- The sheet over the page: one `Find`, ranked rows first (previsti, what he logs at this hour, schede, water,
  last meals), one tap logs (PAT-10, PAT-60). Route `/aggiungi` (+ `/aggiungi/[kind]`, `pasto`, `assunzione`,
  `attivita`, `spesa`, `tragitto`). Dock/«Al volo» (PAT-99).
- Conflicts: reframe §15 + delta: ⊕ and the Aggiungi page go (everything in place); PAT-01 (delta) still has ⊕
  floating; PAT-10/PAT-60 unchanged in patterns.md.

### Andamento
- «Come sta andando?» (PAT-03 delta): period 7/30/90/mese, the period's voto, energy, areas, peso, allenamento,
  «I giorni»; doors Obiettivi · Soldi · Legami · Qualità · Come valutiamo (design.md). Routes `/oggi/andamento`,
  `/{area}/andamento`, `/{area}/andamento/[tracker]`.
- Reframe §3: a week or more of Il tempo. Product.md §3 lists it as a tab; delta: «the four tabs are gone».

### Area (Corpo · Cibo · Oggi · Mente · Soldi)
- `AREAS` in catalog.ts (5); an object's area; the route's first segment; PAT-95: «Tutto · Cibo · Corpo · Mente ·
  Soldi» chips (no Oggi chip). Reframe: the area is a filter on both spaces. Conflict: Oggi is an AREA in the
  registry and a PLACE in the nav (nav.ts `placeOf`).

### Come valutiamo
- What the voto measures; chips per type (Pasto · Peso · Sonno · Acqua · Sessione · Giorno); criteria with weights
  and sources. Route `/oggi/andamento/come-valutiamo`. Reframe: the voto's instrument opened all the way.
  Marked «current» (his 20 Nov, design.md).

### Cestino (trash) — `/profilo/cestino`; 30-day trash (DT-31). Data: 537 trashed entries.

### Composer («componi»)
- The one editor of lines: pasto, scheda, blocco, ciclo (PAT-62); `/[area]/[type]/[id]/componi`, `/aggiungi/pasto`.
  Tabs Ingredienti · Pasti · Stima; «Cena, come sarà»; «La giornata con questo pasto» (design.md).

### Dispensa
- A shelf of the Elenco (with Cibi, Pasti salvati): the formati and their stock (`scorte`) «In casa · Comprato».
  Product.md §4: «a pantry that plans: not now». Sources: target.md §1 row 2; design.md.

### Elenco
- «Cosa ho?» — the catalog, rows of Box per type, chips Cibi · Pasti salvati · Dispensa, `Find`, `SortChips`,
  «Archiviati», «Possibili doppioni»; row opens in place, «Apri» goes to the page (PAT-30, PAT-43 delta).
  Marked «current» (his 20 Nov). Routes `/oggi/elenco`, `/{area}/elenco`. Reframe: = Le cose.

### Il tempo / Le cose (reframe §3 — the two spaces)
- Il tempo: one timeline (window day/week/month and position past/now/future are actions). Le cose: the catalog at
  frame own. Not in product.md §3 yet (delta amends PRD-16). Presets: Elenco = Le cose; Piano = Il tempo, future,
  day; Oggi = Il tempo, now, day; Andamento = a week or more; Obiettivi = Il tempo with the goals.

### Kit gallery — `/kit`, `/kit/oggetto`; photographed by PAT-94.

### Legami — `/[area]/andamento/legami`; the correlations (MOD-55, BD-80, six default pairs after ≥ 3 months).
- proposal §317 (grep only): shown on Andamento only with data.

### Obiettivi — «Dove vado?» (ADR-0063); today `/oggi/andamento/obiettivi` (+ `/nuovo`); goals as Boxes with pace.
- Conflict: a place in the bar (delta PAT-01) · a door inside Andamento (map.md §5 routes, design.md).

### Oggi (Diario) — «Cosa sto facendo?»
- Date title, week strip (levels 0·1·2, VIS-63), Acqua box, «Al volo» chips, weather (0·1·2), «Il giorno», the time
  rail under the sky bands, «Fine giornata», «Senza orario», «Giornata chiusa». Routes `/oggi/[[...day]]`,
  `/{area}/[[...day]]`. Holds every day (PAT-97). Marked «current».
- Actions: swipe days; level taps; «Chiudi la giornata» (decision `day_closed`, 44 rows).

### Palestra / gym session
- Full-screen running session (PAT-01 exception; PAT-63 Timer): dot per exercise, «Pronto per la serie»,
  «Tempi», «Da fare», «Aggiungi esercizio», Esci · Finisci. Route `/[area]/sessione/[id]`, `/palestra`.
  Not in the five places.

### Pagina di un oggetto (ObjectPage)
- The same page for every catalog type (PAT-30): values as editable rows, parts, Andamento, Usato in, «Altro».
  Target: row = box = page at three levels (target.md §2).

### Pagina di una misura — Peso · Sonno · Passi under Corpo · Andamento (design.md); `/{area}/andamento/[tracker]`.

### Perché? (Why)
- Not a place: the deepest level of any verdict; one sheet generated from the metric's declaration (PAT-51,
  reframe §3). Formula, inputs with sources, coverage, fascia source, version.

### Piano — «Cosa farò?»
- Today: only what repeats — ciclo and blocchi (outside cicli) as the kit `Elenco` (PAT-97); «+ Nuovo ciclo»;
  `/oggi/piano`, `/{area}/piano`. Reframe §3/§14: Piano = Il tempo in the future (the rail's right side).
- Conflicts: PAT-97 «Piano holds no days» · reframe «Piano = a day of Oggi in the future» · PAT-03 (old) «Piano of an
  area = its blocchi».

### Possibili doppioni — `/{area}/elenco/doppioni`; one pair per box: Uniscili · È una marca di · Variante di ·
  Sono diversi (PAT-43, `core/catalog/twins.ts`).

### Profilo — `/profilo`: settings, Cestino, FromV1, theme, sign out.

### Qualità dei dati — `/oggi/andamento/qualita`; per kind «21/30», what is missing. Proposal (grep): merged into
  «Come valutiamo» («Con quali dati»).

### Soldi — the money page `/[area]/andamento/money-page`: month spent/earned, by category, by day (DT-50);
  area Soldi has little data (movement 2, purchase 0).

### Voce (`/voce/<id>`)
- A voce as a page: the composer with the meal loaded; sheet with two levels (PAT-31, PAT-32); EntryHeader.

### Parts

### Box
- The card of a thing: icon · title · value or score chip · at most one short action; one line closed, details
  open; silhouette by type; corner drawing; doors (VIS-40…43; `Box`, `MealBox`). reframe §10: the card of a thing
  in layer 3, the same in Il tempo and Le cose.

### criterio (a part of the voto)
- Each a metric vs its fascia with a weight and a source (MOD-43); a ruler per criterion on open; e.g. meal parts
  (FD-51), session «progressione 40» (TR-50), sleep «duration 35» (BD-53).

### giorno (day)
- The logical day, boundary 04:00 (settings `dayBoundaryMin`, DT-01); «Il giorno» card with levels 0·1; closed by
  `day_closed` (44 decisions). Frame «day». Data: live entries on 59 distinct days.

### nutriente / macro / tipo (nutrient, macro, kind)
- ~40 nutrients; four macros (protein, carbs, fat, fibre), each split by **kind** (FD-05: protein by DIAAS band;
  carbs whole/refined/intrinsic/free; fat MUFA/PUFA n-6/omega-3/SFA/trans; fibre by type); micros judged by EFSA
  AR·PRI·UL (FD-40); `Nutrients` L0 → L1 → L2 (VIS-50). Data: `entry_line_values` 20054 rows over 12 fields.

### parte del giorno (part of the day)
- Sky bands mattina · pomeriggio · sera · notte (lunch and snack share pomeriggio); fold to «6 voci · 976 kcal» with
  icons; dashed icons for previsti (VIS-61, delta, reframe §11). Bounds from his meal-role times (`lunchFrom`,
  `snackFrom`, `dinnerFrom`, MOD-60).

### periodo / finestra (window)
- day, ISO week, month, rolling N days, a session, custom (DT-03); week strip; range 7/30/90/mese (PAT-54 `RangeNav`).

### prezzo (price observation)
- formato, shop, day, cents, package quantity, source (MOD-22). Data: 65 (all import; shop 40, receipt 0).

### riga (line)
- A line of a meal / assunzione / batch / saved pasto / giornata tipo: a cibo (+ product, format) with a quantity
  and unit, with a snapshot of the values used (MOD-11, FD-07). Also «riga» = a giornata tipo's line (product.md §3).
- Data: `entry_lines` 1938 (itemId 1862, productId 1608, formatId 1076, name/quantity/unit 1938); meal 1111,
  intake 78, batch 18 (live entries); `entry_line_values` 20054.

### senza orario / tempo vuoto (Senza orario · empty time)
- «Senza orario» holds voci with no time (steps, planned things) at the day's end; empty time ≥ 2 h is a dashed bar
  that can be filled (VIS-62). Data: live entries with no start time 396 (session_exercise 318, steps 40, checkin 18,
  meal 9, session 5, journal 2, movement 2, intake 1, weigh_in 1).

### serie (set)
- reps, load, RIR, warm-up, side, start, end, confirmed (TR-01); warm-up sets never count (TR-04); one-side
  exercises per side (TR-13); auto-mode sets are «presunte» (TR-17).
- Data: `training_sets` 1564 (1013 on live session_exercise): reps 1544, loadKg 1378, rir 86, loadText 82,
  warmup true 110, done true 1055, startedAt 624, endedAt 675, durationS 20, distanceM 12, speedKmh 8,
  inclinePct 8, `side` 0.

### passo del ciclo (cycle step) and riga del passo (step item)
- A step = a day of the ciclo (zero or more blocchi, none = rest) (PL-30); `cycle_steps` 34 (label 14),
  `cycle_step_items` 20. Words: «passo» (UI, product.md), «step» (code), «giornata tipo» (delta).

### valore (a value, a field)
- Registry fields with types number · integer · duration · boolean · choice · scale · text · ref · time (MOD-01) +
  date, recurrence in code; each a reading for the engine (MOD-57); source and confidence (MOD-12).
  Data: `entry_values` 3509, `catalog_values` 4885.

## Words with two names
(same thing, two names; or one name, two things)
- **voce / entry / record / log**: product.md §3 «voce» (Not: record, log); code `entries`; reframe «a thing in time».
- **pasto**: the voce `meal` (words.ts «Pasto») and the catalog `recipe` («pasto», product.md §3; UI «Pasti salvati»);
  target.md distinguishes «pasto (saved)» and «meal on the day»; MOD-14 «meal → pasto».
- **assunzione**: the voce `intake` (words.ts) and the catalog `intake_item` (a food with a flag); water «shows as
  an assunzione» (FD-73); bars-study class «Assunzione» (a third meaning: a class).
- **tragitto**: the voce `trip` (words.ts «Tragitto») and the catalog `route` («tragitto», product.md §3).
- **prodotto / marca**: registry/product.md «prodotto»; target.md, design.md «marca», «Marche» (code «+ Marca»).
- **scheda / routine / modello / workout**: product.md §3 scheda (Not: routine, modello, workout); registry key and
  ~149 code occurrences `routine` (PL-71, CONTRA-04).
- **sessione / allenamento / session**: spec «sessione» (Not allenamento); UI NAMES `session: "Allenamento"`;
  «session» also the frame (the span of any activity, bars-study §17) and the time-relation bands (`MEAL_SESSION`).
- **attività**: the voce `activity` (work/study…) · TR-40 (a cardio sessione) · the class «Attività».
- **peso / pesata / weigh-in / Pesate**: weigh_in; UI «Peso»; spec «pesata»; the page «Peso»; the list «Pesate».
- **sonno / sveglia / riposo**: sleep (UI «Sveglia»), the page «Sonno», `nap` (UI «Riposo»), BD-52 «Sveglia» = the time.
- **movimento / movement**: the money voce `movement` (UI «Movimento») and the body-movement model of reframe §12
  («monitoraggio del movimento», BODY-27 «vertical movement layer»).
- **blocco / abitudine / ritmo / ricorrenza / riga / giornata tipo / passo**: blocco = what+when+how often
  (product.md); abitudine = blocco of a tracker; ritmo = what repeats, shown as a tag (product.md; Not: ricorrenza,
  periodizzazione); code `recurrence`; giornata tipo = a ciclo's step; riga = its line; passo = the step; delta says
  «blocco» leaves the screens; PL-71 forbids «giornata tipo»; product.md §3 now lists it.
- **ritmo**: plan «ritmo» (what repeats) · the pace of a goal («ritmo», «vai a +0,08 kg/sett.», Obiettivi, FD-21) ·
  Rhythm = an instrument (bars-study §21.3, «Rhythm: when, and how long»).
- **fascia / range / soglia / zona / ruler**: product.md fascia (Not: range, soglia); VIS-52 «zones ruler»;
  FD-30 levels; MOD-41 minimo/buono/massimo.
- **voto / punteggio / score / giudizio / verdict**: product.md voto (Not: punteggio, score); instrument «Verdict»
  (bars-study §21.3); `Judge`, `F.judge`.
- **obiettivo / goal / target**: MOD-42 obiettivo = goal; «target» is the day's number or the tick (FD-20, bars-study);
  `Recommended` (Rec) in model.md §5 «Rec».
- **energia / dispendio / consumo / Speso**: MOD-54 «Energia»; UI «dispendio ≈ …», «consumo appreso», «Speso finora»
  (BD-32); also «speso» = money spent (FD-80).
- **stima**: a pill (VIS-23); the `estimated` field; a catalog «stima» object (FD-92, MOD-14); a tab of the composer;
  `source: estimate`; energy «±».
- **kind / tipo / type**: code `kind` (a voce type key; the `kinds` table is trackers), MOD-01 «Type»; macro «kind»
  (FD-05); exercise `kind` (carico/corpo libero/tempo/cardio); money_category `kind`; blocco `kind`.
- **Elenco / Libreria / Le cose / catalogo / Dispensa / scorte / In casa**: product.md §3 «Libreria» is Not;
  reframe «Le cose»; code folder `features/library`; Dispensa is a shelf; `stock_count` UI «Scorta».
- **Oggi / Diario / Il tempo**: Oggi · Diario (tab); the journal voce «Diario»; reframe «Il tempo».
- **giorno / giornata / day**: «Il giorno» (card), «giornata» (Fine giornata, Chiudi la giornata), frame «day».
- **previsto · fatto · saltato**: DB `planned`/`done`/`skipped`; reframe adds acts «da confermare» and «confermato».
- **Perché? / why / Come valutiamo / Qualità dei dati**: reframe: Perché? is the deepest verdict level; Qualità merged
  into Come valutiamo (proposal, grep).
- **porzione / servings / portions / quantity / dose**: `servings` (meal, intake), `portions` (batch), `quantity`
  (line, purchase, stock_count), dose (FD-60, intake).
- **Aggiungi / ⊕ / Capture / Al volo / dock**: PAT-10, PAT-60 (Capture), «Al volo» chips, PAT-99 «dock».

## Registry keys with no spec home / spec objects with no registry key
Registry keys with a weak or missing spec home:
- `batch` («Cucinato»): in no ID of model/product/domains; only bars-study §18.1 (class).
- `chore`, `purchase`, `stock_count`, `reading`, `activity` (as a work/study span), `journal`, `nap`: in
  builtins.ts and bars-study §18.1; none has a product.md §3 word; zero or near-zero data (chore 0, purchase 0,
  stock_count 0, reading 0, activity 0, nap 0 live, journal 2).
- `book`, `project`: in `type-keys.json` `catalog` but no `CatalogType` in catalog.ts (12 declared, 14 keys), no
  model.md §3 row, no rows. They exist only as `ref` targets of `reading.book` and `activity.project`.
- `session_exercise`: a child of session (TR-01); no word, no registry row in model.md.
- `measurements`: BD-70; the data keeps the measures on weigh_in rows (0 standalone).
- `intake_item`: in model.md §3 («assunzione») but 0 flagged foods; intake voci point to recipes.
- `tracker`: 0 rows; `kinds` table empty.
- model.md §1 «Today: 20 voce types, … the 10 catalog types of §3» vs catalog.ts (12 declared) and type-keys.json (14).
Spec objects with no registry key:
- Signals (reframe §14): caffeine left, creatine stores, daylight, weather, movement density, sedentary time — «a
  signal is a registry entry like a type (PRD-03)» but no key exists; MOD-57 class «context» has no builtin.
- `goal` / obiettivo (table `goals`, 9 rows), `decision` (table `decisions`, 61 rows), `settings`: tables, not
  registry types.
- `ritmo`, `giornata tipo`, `abitudine`: words in product.md §3 / PL-03 stored as blocco/cycle values.
- `tag` (catalog `tag`, 6 items; food `tag:<id>` values): in the data and FD-94 only.
- `price_observation` (MOD-22), `trash`, legacy tables `templates` 14, `template_blocks` 5, `week_layouts` 7,
  `cycles_state` 7 (read only by export, merge and old loading, MOD-36).
- Places and presets (Il tempo, Le cose, Obiettivi as a place, Dock) are not registry objects.
- Money: `money_movements` 2 rows, `receipts`, `money_lines`, `receipt_aliases` 0: tables of a type the spec marks
  «not now» (receipts, product.md §4).

## Conflicts, in one list (refs)
1. **Places.** PRD-16 / PAT-03 / product.md §3 «four tabs Diario · Piano · Elenco · Andamento» · ADR-0063/delta
   five places by action · reframe §3 two spaces; Piano = «no days» (PAT-97) vs «a day of Oggi in the future»
   (reframe §3, §14); Obiettivi a place (nav.ts) vs a door of Andamento (map.md §5, design.md).
2. **Fascia.** MOD-41 / product.md §3 «minimo, buono, massimo» · FD-30 «da evitare · pessimo · ok · ottimo» ·
   voto scale ≥ 70 · ≥ 40 · < 40 (MOD-43, VIS-21).
3. **Plan words.** blocco / giornata tipo / riga / ritmo / abitudine: PL-71 forbids «giornata tipo», product.md §3 and
   delta add it, delta removes «blocco» from screens, MOD-30 defines blocco.
4. **Registry vs his data.** intake_item flag 0 rows (intake voci → recipes); exercise values `unilateral`/`kind`/
   `notes` undeclared and declared `sides`/`restS`/`setupS`/`warmup` empty; meal `plannedStart` 12, session
   `readiness` 3 undeclared; catalog `tag` has no key; `book`/`project` have no CatalogType.
5. **Classes.** builtins `batch` class exchange vs bars-study §18.1 Assunzione; MOD-57 «context» class has no
   builtin; reframe §14 two kinds (voce, signal) vs MOD-01 «family voce | catalog».
6. **State control.** PAT-60 «Adesso · Previsto · Prima» and composer «Mangiato · Previsto» (patterns.md) vs
   reframe §11 / delta MOD-15 (time decides); model.md MOD-15 text not yet merged.
7. **⊕.** PAT-10/60/01 vs reframe §15 (no ⊕, no Aggiungi page); PAT-99 dock added at the same time.
8. **Score weights.** product.md §4 / FD-51 «adjustable weights: not now» vs «Come valutiamo» with a slider per
   criterion (design.md «Open against ADR-0063»).
9. **Pantry.** product.md §4 «a pantry that plans: not now» vs Dispensa shelf, `purchase`, `stock_count`, `core/pantry`.
10. **Words in UI vs spec.** «Allenamento» (session), «Sveglia» (sleep), «Peso» (weigh_in), «Movimento» (money) vs
    product.md §3 / spec words.
11. **Verbs of a marca.** target.md §2 «crea · unisci · archivia» vs registry `product` ALL (adds parti da, delete).
12. **Area of a tracker.** model.md §3 «any» vs catalog.ts «Oggi»; `AREAS` includes Oggi but PAT-95 chips do not.
13. **Product.md §4 «step windows»** dropped (reframe §13) vs product.md text unchanged until the delta merges.

---
# Define — the four tables and the conflicts (Claude, 20 Nov) — stop A passed: his «yc», q1–q9 all (a) (proposal §120)

The tables are `docs/spec/orca/` (78 objects, 62 relationships, 48 actions, 60 attributes);
`check.py` passes on them (all 34 registry keys have an OBJ row).

## Scope, decided by Claude (each with its undo)
- **Actions and attributes only for the objects with his data** (PRD-02: a domain without data
  gets no new structure). The ◐/○ objects with 0 rows (misure, riposo, attività, lettura, faccenda,
  spesa, scorta, tracker, libro, progetto) have an OBJ row and no cells (undo: add their rows).
- **Not objects** (views or verbs, they live in patterns/visual): Box, Composer, Perché? (= the
  voto's deepest level, ACT-43), the object page, the voce page, Qualità dei dati (→ Come
  valutiamo), Possibili doppioni (= the action merge, ACT-26), Dispensa (= a filter of Elenco, see
  q7), Cestino (= restore), Profilo, Legami, the Soldi page, the kit gallery, stima (= the source of
  a value, ATT-09), limite (= a fascia read «less is better»), area (= a filter, ACT-48).
- **Two forms added** to the schema: `part` (riga, serie, criterio, nutriente, prezzo, giornata
  tipo) and `frame` (giorno, parte del giorno, periodo) (undo: drop them in `orca/README.md` and
  `check.py`).
- **Names**: the saved route is «percorso», the flagged cibo «assunzione salvata», the money voce
  «movimento di soldi» — so no name means two things (W-01). Each is asked in q3–q5 below.
- Where an action is done follows reframe §15 (everything in place, no ⊕): already his (§113).

## Conflicts settled by his newer words (no question; folded in Deliver)
- Places: two spaces, the five as presets (his §108); the Piano is the rail's future (reframe §14)
  → PAT-97's «no days» and PRD-16's four tabs are rewritten. Obiettivi is a place, not a door.
- State: the time decides (§108–§109) → PAT-60's «Adesso · Previsto · Prima» and the composer's
  «Mangiato · Previsto» go. ⊕ and Aggiungi go (§113) → OBJ-78 is ✗.
- Fascia: four levels (FD-30) → MOD-41's «minimo / buono / massimo» is rewritten.
- Step windows leave «not now» (§109).
- Giornata tipo = a ciclo's step, blocco off the screens (§29–§31) → PL-71 is rewritten.

## For his word (Claude's pick first)
1. **The tables as written** — objects, forms, what is and is not an object, the scope above.
   (a) take them as they are (recommended); (b) say what is missing or wrong.
2. **Assunzione salvata.** ADR-0060: a cibo with a flag; his data: 0 flagged, his 52 assunzioni
   point to pasti salvati. (a) an assunzione refers to a pasto salvato (one cibo, a dose), the flag
   goes — matches what he does (recommended); (b) keep the flag and move his 52 to flagged cibi.
3. **Prodotto or marca?** He says «marca» (Marche, «+ Marca»); the spec says prodotto. (a)
   «marca» everywhere (recommended); (b) prodotto.
4. **The route he saves:** (a) «percorso», «tragitto» stays the trip (recommended); (b)
   «tragitto» for both.
5. **«Movimento»** names the money voce and the body's movement (reframe §12). (a) the body keeps
   «movimento»; the money voce reads «uscita» or «entrata» by its sign (recommended); (b) keep both.
6. **Words on screen against the spec**: «Allenamento», «Sveglia», «Peso» shown for sessione,
   sonno, pesata. (a) the spec's words on screen (recommended); (b) the screen's words into the spec.
7. **Come valutiamo's sliders** vs product.md §4 «adjustable weights: not now». He called the page
   «va bene» (20 Nov). (a) the sliders stay, the line leaves «not now» (recommended); (b) weights
   read only.
8. **Dispensa** vs «a pantry that plans: not now». (a) a filter of Elenco (formati in casa), no
   planning (recommended); (b) dropped until the pantry change.
9. **«Ritmo»** is also the goal's pace (FD-21). (a) the goal's pace has no noun on screen («vai a
   −0,3 kg/sett.»), «ritmo» is only what repeats (recommended); (b) «andatura» for the pace.

Details left to Deliver (Z5, no question): the exercise fields (`unilateral`, `kind`, `notes` in
the data, `sides`, `restS`, `setupS`, `warmup` declared and empty) and `plannedStart`,
`readiness` undeclared; `tag` as a catalog type; cucinato keeps class exchange (it moves cibo to
later portions); a marca's verbs are target.md's (crea · unisci · archivia); a tracker's area is
any, and «Oggi» is a place, not an area (PAT-95).

After stop A: **Develop** — what the objects share (one card per form, one instrument per
question, one action grammar), up to Z3 (patterns.md, visual.md) and Z2 (product.md, model.md).

---
# Develop — what the objects share (Claude, 20 Nov, after stop A)

Counted from the tables, not drawn: forms voce 19 · object 16 · signal 16 · place 10 · part 7 ·
reference 7 · frame 3; attributes at level 0: 30, 1: 27, 2: 3; actions on the thing's own card
23 of 48, at a time on the rail 9, at the end of a list 5, in Palestra 5, the rest 6.

## D1. One look per form (Z3) — derived from settled rules, no new pattern
| Form | Drawn as | Rule it follows |
|---|---|---|
| voce, object | **the Box** — one card, frame day in il tempo, frame own in le cose; its level-0 attributes in the closed line, level 1 and 2 on open | VIS-40…43, reframe §10, target.md B1 |
| part | **a row inside its parent's card** (riga, serie, criterio, nutriente, prezzo, giornata tipo's line) | PAT-13 rows, VIS-50 |
| signal | **a lane beside the rail** at frame day; its own instrument elsewhere (tank, line) | reframe §14 |
| reference | **never a card: a channel** on the instrument it judges — tick (target), ruler (fascia), ghost (l'ultima volta, mean), notch (record), line or fan (obiettivo) | bars-study §21.1, §21.3 |
| frame | **the container**: giorno = «Il giorno» + the rail; parte del giorno = a sky band; periodo = the same instruments rolled up | VIS-60…63, reframe §3 |
| place | **a preset**, draws nothing of its own | reframe §3, ADR-0063 |
The obiettivo is the one reference with a card too: in Obiettivi it is a Box (ACT-41, ACT-42);
everywhere else it is a channel. Decided by Claude (undo: OBJ-58 only a channel).

## D2. One instrument per question (Z3)
The attributes use 11 instruments for 12 questions; «name» is a word, no instrument. **Cells**
answer three questions (yes/no, ritmo's «ogni quanto», micros «n su m»): they are the form any
instrument takes **when it has many members** (VIS-50's strip). Decided by Claude, from §21.3
and §22.3 (undo: a separate instrument per question).
**New, his word (q10):** each registry field declares its **question**, defaulting from its
reading (amount → reach, time → rhythm, score → verdict, composition → composition, rating ·
category · presence → name); the engine (MOD-56) picks the instrument from the question, and a
test keeps the registry equal to `orca/attributes`. Today the engine has rules per type.

## D3. One grammar for acting (Z3) — reframe §15 in three spots
1. **On the thing's card**: change, skip, start from, merge, archive, drill, compare, why.
2. **Where it will show**: at a time on the rail (a voce; the time makes it previsto or fatto),
   at the end of a list or of a card's parts (an object, a riga, a marca).
3. **Two named shortcuts**: «Al volo» (the dock, PAT-99) and Palestra (a sessione live, PAT-63).
No ⊕, no page for an action. Already his (§112–§113); `check.py` already refuses ⊕ in `actions`.

## D4. Up a zoom (Z2) — follows from D1–D3, settled before
- MOD-01's family «voce | catalog» → voce · object · part · signal (reframe §14, his §110); the
  frame and place are not registry types.
- The signals with no key (caffeina rimasta, scorte, movimento, meteo, luce del giorno) become
  registry entries (reframe §14: «a signal is a registry entry like a type»).
- `model.md` §3's catalog table moves to `orca/objects` (method §7).

## For his word (Claude's pick first)
10. **The question in the registry** (D2): (a) each field declares its question, the engine picks
    the instrument, a test keeps registry = `orca/attributes` (recommended: one home, no rules per
    type); (b) the engine keeps rules per type, the table is only documentation.
11. **The order of Deliver** — each slice reaches every place at once:
    (a) recommended: ① the docs fold, no UI (product.md, model.md, patterns.md, visual.md take
    reframe, bars-study §21–§23, target.md and these tables; `round-1.md` archived) → ② the
    registry: families, questions, signals (core, tests) → ③ **the Box from the registry** for every
    voce, object and obiettivo (kit; photos, **stop B**) → ④ the three spots for adding, ⊕ and
    Aggiungi removed (photos, stop B) → ⑤ the lanes: caffeine, the creatine tank, movement
    (photos, stop B).
    (b) the Box first (③ before ①–②), so he sees something sooner, with the docs after.
