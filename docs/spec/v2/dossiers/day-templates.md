# Dossier — day templates, cycles and routines (Piano)

Status: **approved as recommended** (2026-10-24, §9 as recommended);
slice (a) read side built: `core/plans` (a day's model and its cycles'
steps, a step without a label named by its routine), Oggi's plan line and
the week strip's tags, Piano's day lines. Slice (b) built (2026-10-24):
`core/plans/models*` (rows ↔ E3 models, targets inherited key by key, the
person's meal split and usual times over 4 weeks), Piano · Modelli (week
type, models, «Nuovo modello») and «Giornata tipo» (name, base, targets with
«torna alla base», blocks added / changed / hidden here and back, «Quote
dalle ultime 4 settimane», weekdays, Duplica · Estendi · Archivia); on Oggi
each meal's bars against its block and the score's «adatto al blocco»
(acceptance 5). Not yet: relative times in the editor («60 min dopo»),
changing the base with its preview (rebase), cycles (c), habits (d). Method:
`../method.md`. Boards: Plan (V-08 calendar), Models, ModelEditor
(«Giornata tipo»), CycleEditor («Ciclo PLPRR»). Spec: concepts.md §5,
flows.md, schema.md (tables `templates`, `template_blocks`, `cycle_steps`,
`cycle_step_items`, `cycles_state`, `week_layouts`), engines.md E3/E5.

## 1. Question
"What is my day supposed to look like — meals, training, everything — and
how do I change it when the day changes?" The developer
(considerations.txt): «creare dei programmi per le giornate, pianificare
distribuzione macro, cibi, eccetera in base al programma della giornata»;
«giornate tipo… preimpostate, magari anche incrementali… intercambiabili
nel mentre»; «un sistema di programmazione delle routine per tutto quanto,
non solo per la palestra… più intelligente ma molto usabile»; and the bug
that a session added to the plan always lands at 17:30.

## 2. Today
- **Engines (done, tested):** `core/engines/planning` — `resolve` (a model
  with its base: local, inherited and changed blocks), `apply` (a model on a
  day: entries at absolute times, «40 min after <block>», after waking,
  before bed), `swap` (change the day's model; what is done stays),
  `cyclePlan` (a cycle's steps on days, by occurrence or by date, a skip
  shifts or is lost; v1's cases run as parity), `rebase` (replace or merge a
  base, nothing local lost without saying so). E5 `slotTargets`: a meal
  block's shares × the day's targets.
- **Schema (done):** the six tables above, owner-scoped.
- **Converter (done):** v1's day types → day models with their targets,
  v1's programs → cycles, v1's week → `week_layouts`.
- **Missing:** repositories, every screen except the week of planned
  entries (Piano, first part), the link from a day's model to its targets,
  and the planned entries a model gives a day.
- **The developer's data (23 Oct):** 5 day types (Rec, Rest, Run, Gym and a
  test one, «dwqadaqw»); 6 programs, PLPRR active since 8 Oct (the others
  inactive); 9 routines (Push, Pull, Legs, Upper, Lower, Full body A/B, Core
  10 minuti, Cardio facile 30 minuti); 26 v1 day plans, 3 overrides.

## 3. Evidence
Mostly product design (the boards are the target); the nutrition parts:
- Meal distribution: total daily protein matters most; ~0.25–0.4 g/kg per
  meal spread over 3–5 meals, protein around training (ISSN 2017,
  Jäger et al., doi:10.1186/s12970-017-0177-8); pre-sleep protein ~30–40 g
  (Snijders 2019). These become **hints** on a block, never forced shares.
- Day-to-day energy: training days vs rest days (v1 ADR-0014 dynamic days):
  the week's energy target holds; a day type shifts it (E5 «the day's
  shift»), the week stays the reference (ADR-0047).

## 4. Data
| Datum | Where | Note |
|---|---|---|
| Day model: name, base (`extends`), targets (fixed, or follow the goal: deficit, protein and fat g/kg) | `templates` scope day | converted from v1 day types |
| Blocks: kind, item (a routine, a saved meal), when (absolute / after a block / after wake / before bed), duration, meal shares | `template_blocks` | the 17:30 bug ends here: a training block has its own time or «after breakfast» |
| Week: weekday → day model or cycle | `week_layouts` | |
| Cycle: steps (any model, a rest), advance (occurrence/date), skip (shift/lose) | `cycle_steps`, `cycles_state` | PLPRR |
| Habit: a block with a recurrence | `templates.recurrence` | |
| A day's own changes (one day only) | planned entries with `source: template` + `from-template` link | see question 1 |

## 5. Model
- A day's model: its fixed copy if it has one, else the week layout's
  model (or the cycle's step for that day), else the default model; the
  model resolved with its base (`resolve`).
- A day's planned items: `apply(model, day context)` — the wake time from
  the night before (E4), relative blocks placed from their anchor; a block
  bound to a cycle takes the step due (`cyclePlan`).
- A day's targets: the model's (fixed or following the goal) with the
  week's context (E5, ADR-0047); a meal block's slot targets = its shares ×
  the day's targets → the L0 bars and the score's «fit to its block» use
  them.
- Changing the day («Cambia la giornata», «Sposta l'allenamento», «Copia
  ieri», «Salta», «Riposo»): `swap` — what is done stays, only what is still
  to come changes, undoable.

## 6. Experience (the boards)
- **Piano · Calendario:** the week, each day with its model and its planned
  items; tapping a day: Copia ieri · Salta · Riposo · Apri il modello; «Oggi
  è cambiato qualcosa?»: Cambia la giornata · Sposta l'allenamento.
- **Piano · Modelli («Le regole»):** day types, the week layout, cycles,
  habits; a model is made from scratch, from a real day («Salva come
  modello» on Oggi), from an entry («Ripeti come abitudine»), by duplicating
  or extending one.
- **Giornata tipo:** targets (inherited until changed: «torna alla base»),
  blocks (+ a block of any kind), changing the base with the preview of
  what changes, «Dove si applica», Duplica · Estendi · Archivia.
- **Ciclo:** its steps (a session, a rest, a recipe, a day type), how it
  advances, the last days, what a skip does.
- **Oggi:** the day's model in the header («Giornata «Rec» · ciclo PLPRR:
  oggi Push, poi Riposo»), planned items hatched, «Salva come modello».

## 7. Edge cases
A model edited after days were planned from it (future days follow, past
ones keep what happened); a day opened before its wake time is known
(relative blocks use the model's default wake); a cycle step skipped twice;
two cycles bound to blocks of the same day; a model archived while a week
layout points to it (the day falls back to the default and says so).

## 8. Acceptance tests
1. PLPRR from 8 Oct with the sessions logged 18–22 Oct: the step due on a
   given day equals v1's program view for that day (the parity cases of
   `cycle.v1.test.ts`, extended with the 23 Oct export).
2. A training block «60 min after breakfast»: breakfast logged at 07:20 →
   the session is planned at 08:20, not 17:30.
3. «Rec» extending «Rest»: changing Rest's kcal changes Rec's unless Rec has
   its own; «torna alla base» restores it.
4. «Cambia la giornata» at 13:00 from Gym to Rest: the morning's done
   entries stay; the afternoon's session disappears; Annulla brings it back.
5. Lunch block with shares 35 % kcal / 30 % protein on a 2 778 kcal, 154 g
   day → slot targets 972 kcal, 46 g protein; the lunch's L0 bars measure
   against them.

## 9. Questions for the developer
1. **Planned items: computed on the fly, stored only when you touch them?**
   (tick, move, edit). Recommended: yes — a model change then reaches every
   future day without stale copies, and nothing is written (or read back)
   for days you never open. The alternative, writing each day's entries in
   advance, is simpler to query but every model edit must rewrite them.
2. **Your converted models:** keep Rec, Rest, Run, Gym; drop the test
   «dwqadaqw»; keep PLPRR active and archive the five inactive programs?
   Recommended: yes.
3. **Meal shares to start from:** your own average split per meal over the
   last 28 days (derived from your data, then you adjust), rather than
   textbook percentages? Recommended: yes (memory: ask inputs, derive
   numbers).
4. **Order of slices:** (a) the day's model and targets on Oggi + the week in
   Piano (read), (b) Giornata tipo editor, (c) cycles and the day's changes,
   (d) habits. Recommended as listed.
