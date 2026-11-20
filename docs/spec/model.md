# lifeos — model (every type of thing, declared once)

Status: **approved 2026-11-06** (PROD-44, ADR-0061). Replaces `docs/archive/spec-v2/concepts.md`,
`kinds.md`, the model parts of `dossiers/objects.md`, `day-templates.md`, `plan.md`, and
ADR-0054's model section. IDs: `MOD-nn`. Column «Today» = what the code has (audit 6 Nov).

## 1. The registry (the heart: PRD-03)
- **MOD-01** Every type of thing is declared once in a **registry** in code, with one shape:
  ```
  Type
    key, name (his word), area (Corpo|Cibo|Oggi|Mente|Soldi), icon, colour
    family        voce (logged in time) | object (reused) | part (inside one) | signal (a level over time)
    class         intake | activity | state | measurement | exchange | note | context   (MOD-57)
    shape         instant | interval                       (voce only)
    fields[]      key, label, type, unit, range, required, default, help
                  type ∈ number|integer|duration|boolean|choice|scale|text|ref(type)|time
                  reading, question (MOD-57, MOD-58)
    lines?        ref(catalog type) + quantity              (meal → foods, session → exercises)
    family rules  levels (food › product › format) | variants (base + differences)   (catalog)
    capture       quick (one tap) | form | composer | timer
    verbs         which of patterns.md §2 apply (default: all that make sense for the family)
    list          row: title, meta, value, sort keys, search keys
    metrics[]     declared derivations (§5)
    comparable    what makes two voci comparable for progress (§6)
    relations[]   time windows that matter (§7)
    ranges[]      fasce with sources (§5)
  ```
  A user's own tracker is a row with the same shape; a **signal** (caffeina rimasta, scorte, movimento,
  meteo, luce del giorno) is a row too, typed, measured or derived from voci, drawn as a lane beside
  the rail (VIS-64). The list of every type, with its relationships, actions and attributes, is
  `orca/` (ADR-0064); the registry in code must match `orca/objects` (`check.py`). [PROD-03, PROD-08,
  PROD-36, reframe §14]
- **MOD-02** Pages, forms, lists, search, verbs, charts and engines read the registry; no
  code compares a type key outside its own specialisation folder (today ~114 comparisons).
  [n12, n13] — Today: `core/kinds` (zod `Kind`, `kindRegistry`, 20 voce types) drives
  `EntrySheet` for 13; the 10 catalog types of §3 are declared in `core/kinds/catalog.ts`
  (`CatalogType`: area, hue, storage, family rule, fields, lines, capture, verbs, list,
  «Salva come» source; the assunzione is `intake_item`, a food with the `intake` flag) and
  `core/verbs` reads them; cibo and prodotto declare their label values per 100 as fields
  (`LABEL_FIELDS`, edited in place), and the cibo and pasto screens read the registry (change
  2026-11-07-food-meal); the other screens move onto it in phase 4. The lint rule of PAT-90 fails a
  new type-key comparison; the 148 of 6 Nov are in `lint-baseline.json`.
- **MOD-57** Every type and tracker has a **class** — intake · activity · state · measurement ·
  exchange · note · context — and every field a **reading** the engine knows (number → amount;
  duration → time; scale → rating; boolean → done; choice → category; text → presence; lines →
  composition; a voto → score), each with its aggregates over a frame; a measure may read as **yes /
  no** whatever its field (a fixed-dose intake, a habit, a goal «n volte»). WHEN a built-in type has
  no class THEN a test fails; a tracker takes its class from its family. [his 20 Nov, proposal
  §93–§94, bars-study §19.1] — Today: built (`core/engines/view`, slice 1 of #371).
- **MOD-58** Every field declares the **question** it answers (reach · prediction · trend · yes/no ·
  rhythm · stock · comparison · composition · source · spread · verdict · name), defaulting from its
  reading (amount → reach, time → rhythm, score → verdict, composition → composition, rating ·
  category · presence → name); the engine (MOD-56) picks the instrument from the question
  (VIS-102). WHEN the registry and `orca/attributes` disagree on a field's question THEN a
  test fails. [his «yc» q10, 20 Nov, proposal §122] — Today: not built (Deliver ②).

## 2. Voce (an entry)
- **MOD-10** A voce: `type, start, end?, day (logical, boundary 04:00), status, values, lines[],
  parent?, links[], source, confidence, note`. Status: previsto · fatto · saltato.
  [concepts §3, PROD-07, PROD-09] — Today: `entries`, `entry_values`, `entry_lines`, `entry_links`.
- **MOD-11** A voce's values are what happened; only he edits them. A line keeps a snapshot of the
  catalog values it used; a later catalog change never rewrites it, it offers ↺. [ADR-0007,
  n02] — Today: snapshot yes; ↺ (update to current values) not built in v2.
- **MOD-12** **Source and confidence** on every value: typed 1 · weighed 1 · from a label 0.9 ·
  estimate 0.6 · assumed (auto mode, defaults) 0.3. Assumed values are marked, never enter a
  trend or a judgement until confirmed. [PRD-22, c09]
- **MOD-13** «Fatto» on a previsto voce sets its time to now unless he changes it. [n02, capture §2]
- **MOD-15** **The time decides the state**: after now (beyond the slack) a voce is previsto, at
  now or before it is fatto, whatever was tapped; no control asks it (PAT-60's «Adesso · Previsto ·
  Prima» and the composer's «Mangiato · Previsto» go); a voce with no time is previsto until done.
  The slack is a setting, 20 minutes by default; a past previsto never done follows a setting:
  saltato (default) · da confermare · confermato. In a folded part of the day a previsto's icon is
  drawn dashed. [his 15 Nov «essere sicuri che quando si pianifica qualcosa in un orario futuro…
  sia sempre pianificato», his 20 Nov; reframe §11, proposal §38–§39, §108–§111] — Today: built
  (`core/entries/timing.ts`, `core/account/timing.ts`, `readDays`); the forms' state controls still
  shown until Deliver ④.
- **MOD-14** Any voce can become a catalog object («Salva come …»): a pasto → pasto salvato, a
  sessione → scheda, a tragitto → percorso, an estimate → cibo (stima). [n01, FOOD-16, FOOD-32]

## 3. Catalog objects
Every object, with its form, class, registry key and status, is a row of `orca/objects` (OBJ-22…37;
ADR-0064): cibo › marca › formato (levels, ADR-0055/0060), pasto salvato and esercizio and scheda
(variants), percorso, tracker, categoria di spesa, ritmo (`block`, MOD-36), ciclo (`cycle`). An
assunzione is a pasto salvato logged with its dose (FD-64; the `intake_item` flag goes).
- **MOD-20** Every catalog object has the same life: crea · parti da (based_on) · variante di
  (parent) · modifica in place · unisci · archivia · ripristina · elimina (only if unused, else
  archive). Archived = out of pickers, kept in history. [n03, PLAN-33, P1] — Today: 11 archive
  paths, 6 «parti da» mechanisms, restore for 3 types.
- **MOD-21** `parentId` means one thing per type, declared in its family rules (levels or
  variants), never inferred from the parent's catalog. [needs n03]
- **MOD-22** Prices are observations (formato, shop, day, cents); price per kg is derived.
  Formats inside meals and the mean across brands wait for a real case. [x06, c08]

## 4. Piano: blocks and cycles (replaces «Model»)
- **MOD-30** A **ritmo** (stored as a `block`; the word «blocco» is off the screens) = what (a
  catalog object, a rotation of objects, or a type with defaults) + when (a time, «N min after
  <ritmo>», after wake / before bed) + how often (every day, weekdays, every N days, N times a
  week, dates, «nel ciclo») + area. An abitudine is a ritmo of a tracker. [n09, PLAN-34, PLAN-36;
  his «yc» 15 Nov, proposal §29–§34]
- **MOD-31** A **giornata tipo** is a ciclo's step: its righe are its ritmi «nel ciclo», each any
  voce type or object (a pasto, a scheda, creatina, a pesata, a tracker) with its time; a step with
  none is rest. A **ciclo** says which giornata tipo falls on which day, advancing one step per
  occurrence or per date; on skip: shift or lose; one used every day is a ciclo of one step. WHEN he
  taps «Salva come giornata tipo» on a day THEN its voci become the righe of a new one. No new type,
  no new table. [his 14–15 Nov, proposal §29] — Today: `core/plans/day-type.ts` `saveDayToStep`, no
  button (audit 15 Nov, 6).
- **MOD-32** What is planned for a day = the ritmi and the giornata tipo that fall on it, from every
  area, shown in il tempo after now (the Piano is the rail's right side, PRD-16). No week types,
  extends, merges or cross-layer rules now. [x04, reframe §14, PLAN-35 deferred]
- **MOD-33** Applying the Piano writes previsto voci linked to their blocco; moving a blocco
  moves the voci relative to it (the pre-workout meal follows the session). [concepts §5] — Today:
  the link is `entries.block_id` (FK, restrict: PL-70's «Elimina only when no voce links to it»),
  one voce per blocco per day; `entry_links.from_block` is not used (Q-17 (a)).
- **MOD-34** «Intelligente» = the proposal engine (§6) proposes blocchi from his history and
  checks them against his goal and his presets; he accepts with one tap. [n09, PLAN-36]
- **MOD-35** Blocks hold real objects; kcal and protein shares are derived from the goal and
  only judge and advise. [c04, PLAN-34]
- **MOD-36** Storage (ADR-0062): a blocco is a catalog «block» — its object (or a rotation's
  objects, in order, each with its quantity) as `catalog_parts`, or a type (`kind`: a voce kind
  or his tracker, with `defaults` as JSON — an abitudine, a walk of 30 min, PL-01, PL-03), its
  when (`when` ∈ time · after · before · wake · bed, `atMin`, `anchor` a blocco, `offsetMin`),
  how often (`recurrence`, the engine's `Recurrence` as JSON, «nel ciclo» included), `area` and
  `durationMin` as `catalog_values`; a ciclo is a catalog «cycle» (`advance` ∈ occurrence ·
  date, `onSkip` ∈ shift · lose, `start` an ISO day) whose steps stay in `cycle_steps` /
  `cycle_step_items` (a step's items are blocchi «nel ciclo»). WHEN the Piano of a day is read
  THEN `core/plans` turns these rows into the engine's input; no screen reads them directly.
  [his «decidi tu» on Q-14, 7 Nov; change 2026-11-07-piano] — Today: built (`core/plans/
  blocks.ts`, `cycles-repo.ts`, `drizzle/0006`…`0010`). The old `templates`, `template_blocks`,
  `week_layouts`, `cycles_state` are read only by the export, old files' loading and merge;
  dropping them is asked (Q-23). `plan_rules` parked on `archive/s247-v2-plan` (not carried).

## 5. Numbers: metric, fascia, goal, voto, decision
- **MOD-40** **Metrica**: declared once (source, filter, aggregate, window, transform, unit,
  formula version, sources); computed on read; every shown number is one. Its «Perché?» is
  generated from the declaration (patterns.md §5). [n05, concepts §6, PRD-20]
- **MOD-41** **Fascia**: four levels, da evitare · pessimo · ok · ottimo, each edge with its source
  (FD-30), the same for every measured thing; **coverage**: the share of the window that has data; below the declared threshold the
  judgement is «non so». [n11, PLAN-26, PRD-23]
- **MOD-42** **Obiettivo** (goal): metric + window + at least | at most | range | reach-by-date,
  dated history; progress, pace, ETA derived. The day's food targets are goals (dynamic from
  weight, deficit, protein g/kg, fat g/kg). [concepts §7, PLAN-31] — Today: the day's food
  targets read three goals (`metric.source` foodDeficit · proteinPerKg · fatPerKg,
  `core/goals/food.ts`), «Rec»'s values copied by `drizzle/0008` from its first day; «Rec»
  archived; Obiettivi shows them as goal rows «entra negli obiettivi di ogni giorno».
- **MOD-43** **Voto**: declared parts, each a metric against its fascia, with weight and source;
  versioned; a part without coverage is left out and said. One scale: ≥ 70 · ≥ 40 · < 40.
  [PROD-13, content §3] — Today: one engine (`core/engines/judgements`), parts per domain.
- **MOD-44** **Decision**: what formulas must not rewrite (a closed day, a frozen target, a
  skipped voce), stored as rows. [concepts §9]

## 6. Horizontal engines (PROD-41: «motori che agiscono pervasivamente dappertutto»)
- **MOD-50** **Progresso**: for any type with `comparable`, compare a voce with past voci in
  the same context (same exercise and position in the session, similar load; the same meal at
  the same time of day; the same route). Says «stesso carico, +2 ripetizioni», «record», one
  trend per object over weeks. No per-session percentages. [n06, c02, TRAIN-33]
- **MOD-51** **Proposta** (prefill): every new voce starts from what he usually does at this
  time for this type (values, quantity, time, next object of a ciclo); every blocco proposal
  comes from the same engine. [n01, n06, n09]
- **MOD-52** **Consiglio** (advice): a sentence when a metric is outside its fascia or a goal
  is off pace, with the fix as one tap (add, move, swap). Never more than one per box.
  [n06, PROD-41]
- **MOD-53** **Contesto**: for any voce, the relations of §7 in the declared windows, shown as
  one line beside it («5 h 30 di sonno · caffè 40 min fa»); never inside the number.
  [n08, PRD-21, PROD-42]
- **MOD-54** **Energia**: expenditure learnt from intake and weight (calibrated, automatic,
  reversible); steps and sessions are inputs with their confidence, not separate models.
  Steps: the phone's count typed once a day; a native shell reading Health Connect is a future
  change with its ADR, after phase 4 (BODY-32). [n10, c06, c07, BODY-30]
- **MOD-56** **Motore di visualizzazione**: every number drawn in the app is a *measure* (registry) ×
  a *frame* (own · day · session · period, chosen by the place; «session» = the span of any
  activity) × a *level* (0 · 1 · 2); the engine reads the data, its references (target, fascia,
  goal, past self, mean, record) and the request (frame, grouping, level, drill · roll up · slice ·
  pivot · compare), picks the instrument by the field's question (MOD-58, VIS-102) and gives
  a view that only kit pieces draw. WHEN a page draws a number outside it THEN the lint fails (once
  the guard is built). One hierarchy: class › type › object › part. [his 20 Nov, proposal §88–§94]
  — Today: built for views from a request (`core/engines/view`, slices 1–3a of #371); the lint
  guard not built.
- **MOD-55** Correlations: only the 6 default pairs, shown after ≥ 3 months of data. [n08, x08]

## 7. Time relations
- **MOD-60** Relations are declared on types and computed, never typed: before/after with a gap
  (pre-workout 0–3 h, post 0–2 h, pre-sleep 0–3 h, caffeine 6 h before bed), during, since last.
  They show as labels, feed metric filters and the context line. Meal roles come from the time;
  pre/post are labels, not roles. [n04, c03, FOOD-34, PROD-14] — Today: built
  (`core/engines/time/relations.ts`); FOOD-19 and ADR-0044's extra moments are superseded.

## 8. Specialisations (the only places a type gets its own code)
| Specialisation | Why | Folder |
|---|---|---|
| Food composition | per-100 vectors × quantity, ~40 nutrients, snapshots | `core/food` |
| Training sets + gym timer | session › exercise › set, rests, effort; the timer is a generic `timer` capture | `core/training` |
| Sleep from pieces | a night built from periods (also interrupted sessions, fasts) | `core/engines/sleep` |
| Money | signed cents, lines | `core/money` |
| Body weight | Kalman over scale + intake | `core/engines/energy` |
A specialisation computes; it never draws its own page, form, list or verb.
