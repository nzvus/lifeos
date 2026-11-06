# lifeos — domain: Piano (blocchi, cicli, abitudini)

Status: **draft 2026-11-06** (phase 2b fold; the shape is approved in `model.md` §4, PROD-44).
Rules, formulas, defaults and edge cases of the Piano only. The shape of a blocco and a ciclo is
MOD-30…35; the tabs are PAT-03; the verbs are PAT-10…24; words are product.md §3. IDs: `PL-nn`.
Sources in brackets: ledger IDs, his answers (`n09`, `c04`, `x04`: `audit-2026-11/needs.md`),
`v2/engines.md` E1/E3, `v2/dossiers/plan.md` (decided 3 Nov, §9 all (a) except 9.6),
`day-templates.md` (engines part). «Today» = `apps/v2` (6 Nov). Fold: `audit-2026-11/fold-plan-data.md`.

**What is gone** (his answers 6 Nov, x04, n09, c04): day models, «giornata tipo», «settimana
tipo», week layouts, `extends`/rebase/«Scollega», merges of models, rules across areas
(`plan_rules`), layers, shares stored on blocks, targets on a model: back only as a `changes/`
proposal after a month of the simple Piano in use (PRD §4).

## 1. What a blocco holds
- **PL-01** A blocco's *what* is one real object (a pasto or one of its variants, a scheda, an
  assunzione, a tragitto, a tracker) or a type with default values (a walk of 30 min), with a
  quantity (servings). Never a percentage of the day. [PLAN-34, c04, MOD-30, MOD-35, plan.md §4]
  — Today: not built (blocks are a meal role with shares or a session: `models-repo.ts`,
  `ModelEditor.tsx`; real items parked on `archive/s247-v2-plan`).
- **PL-02** A *rotation* is a blocco whose what is an ordered list of objects; the day takes the
  item after the last one **done** (by that blocco's history), or the item named for that
  weekday when he set one. An archived item is skipped and said once. [plan.md §5.3, §7, §9.3]
  — Today: not built.
- **PL-03** An **abitudine** is a blocco whose object is a tracker (water, steps, stretching,
  his own types). Any type may be planned as a blocco; only the tracker kind is called
  «abitudine». A due abitudine is *covered* by a voce of its type (and category, when it has
  one) on that day, any status. [PROD-45, product §3, `core/plans/habits.ts`] — Today: partial
  (habits are block templates; meals, sessions, money and pantry kinds excluded by
  `NOT_HABIT_KINDS`, which goes once any type can be a blocco).

## 2. When
- **PL-10** A blocco's time is one of: a clock time · «N min dopo/prima di <blocco>» · after
  waking + N · before bed − N · none. Minutes are counted from the local midnight of the logical
  day up to boundary + 1440 (`DayMin`), so «60 min after 23:30» is plain arithmetic past
  midnight. [E3, `engines/planning/time.ts`] — Today: built (engine).
- **PL-11** A relative blocco resolves against its anchor's **fatto** time first, then its
  **previsto** time; a **saltato** anchor is not a time. Anchors that point at each other in a
  loop give no time. Wake and bed come from the night before (sleep), else his usual. [E3,
  PLAN-09, day-templates §8.2] — Today: built (`apply.ts`).
- **PL-12** **Default time** of a blocco with no time, or whose anchor cannot be placed: the
  earliest time on the most recent same weekday he did *that blocco*; else *that type* on that
  weekday; else the type's default; else none — the voce sits untimed at the end of the day.
  Never a fixed hour (the 17:30 bug). [PLAN-09, TRAIN-34, E3] — Today: built (`defaultTime`).
- **PL-13** Moving a blocco (or the voce it planned) moves the previsto voci anchored to it the
  same amount: the coffee 30 min before the session follows the session. A fatto voce never
  moves. [MOD-33, PLAN-12, plan.md §8.3] — Today: partial (relative times resolve live; no
  move command for anchored voci).

## 3. How often
- **PL-20** Frequency is one of: every day · weekdays (ISO, Monday 1) · every N days from a
  start (N ≥ 1) · N times a week · on dates · a ciclo step. «N times a week» places nothing on
  fixed days: it is due until the ISO week holds N covered days (today not counted). [E1,
  DATA-04, RFC 5545 via plan.md §3, `engines/time/recurrence.ts`] — Today: built (engine;
  used by habits only).
- **PL-21** Adherence over a window: a fixed frequency counts the planned days done out of the
  planned days; «N times a week» counts covered days in one ISO week out of N. A saltato with a
  reason (sick, travel) can be set not to break a streak (DT-13). [E1, DATA-05] — Today: built
  (`progress`), not shown for blocchi.

## 4. Cicli
- **PL-30** A ciclo is ordered steps; each step holds zero or more blocchi (no blocco = rest).
  A step may hold the scheda *and* what goes with it («Push» + caffè 30 min prima), which is how
  a pair across areas is planned now that rules across areas are deferred. [MOD-31, x04,
  plan.md §2 (18 of 32 sessions had a coffee within 2 h before), schema `cycle_step_items`]
  — Today: partial (steps hold one routine or rest; `cycle_step_items` allows several).
  *Decided by the agent* (replaces the if-then rule of plan.md §8.3 inside MOD-31).
- **PL-31** **Advance by occurrence** (the gym): a day with nothing that counts takes a rest due,
  else the step stays due and shows *late*; a voce of the due step advances it; a voce of a later
  step of the round marks it done ahead (passed when reached); a voce that fits no step is extra.
  **Advance by date** (a dinner rotation): day k from the start holds step k mod n. A voce counts
  for a step when it carries any of the step's objects. [E3, PLAN-13, `engines/planning/cycle.ts`]
  — Today: built; v1's 14 program cases run as parity (`cycle.v1.test.ts`).
- **PL-32** A skipped day **loses** the step due (the ciclo moves on) or **shifts** it to the next
  day, per ciclo. A one-day override puts another step, or rest, on a coming day; overrides take
  their days first and the ciclo fills the rest. Skips and overrides are decisions (MOD-44).
  [PLAN-13, KEEP-15, v1 ADR-0024/0029/0035] — Today: built (`cycle_skip`, `cycle_override`).
- **PL-33** A coming step shows with the next one («oggi Push, poi Riposo»). Past days show
  what happened, never a computed step. [`core/plans/plan.ts`, PLAN-04] — Today: built.

## 5. From blocchi to voci
- **PL-40** **The Piano of a day** = the active blocchi whose frequency falls on it, plus each
  active ciclo's step; coming days computed on read, never stored. On the first read of a day as
  *today*, its blocchi are written as previsto voci linked `from_block` (MOD-33), never twice; a
  day never opened stays without previsti (no data: «non so», DT-03). [MOD-32/33, day-templates
  §9.1, plan.md §7] — Today: partial (`apply` built; voci computed on the fly, matched by role).
  *Decided by the agent*: reconciles MOD-33 («applying writes») with §9.1 («stored when touched»).
- **PL-41** Past days never change when a blocco or ciclo changes: what was written stays; the
  change applies from today on. [plan.md §7, day-templates §7] — Today: built (nothing stored).
- **PL-42** A previsto voce on a past day is never turned into fatto or saltato by the app
  (PRD-22). It counts as not done in adherence, is out of the eaten totals, and the day offers
  «Fatto · Salta · Togli» on it; «Togli i previsti» removes all with one Annulla (≥ 2).
  [KEEP-05, KEEP-07, PLAN-07, needs n09 (34 meals left previsti)] — Today: partial («Togli i
  previsti» built: `entries/write.ts`; past-day hint not built).
- **PL-43** Day-only changes, each undoable (PAT-21) and stored as a decision: **Salta la
  giornata** (every blocco of the day saltato, cicli by their skip rule) · **Sposta** one blocco
  for this day · **Copia ieri** (yesterday's voci as today's previsti, same time, current catalog
  values; a type the day already has is left). Fatto and saltato voci never change; only
  previsti ahead of now are replaced, and never ones he typed by hand. [E3 `swap`, PLAN-04,
  PLAN-07, KEEP-07, plan.md §7] — Today: partial (swap engine, «Copia ieri», cycle skip built;
  «Cambia la giornata» changes a day model, which goes).
- **PL-44** **Ripeti** on any logged voce opens a new blocco with its object, time and weekday
  prefilled (PAT-22). «Salva come modello» for a whole day goes with day models. [plan.md §6,
  PLAN-07, MOD-14] — Today: not built («Salva come modello» built: `features/plan/from-day.ts`).

## 6. Proposals from history (the «intelligente» part)
- **PL-50** The proposal engine (MOD-34, MOD-51) proposes a blocco when the same object (or
  pair: an object at a gap from another) appears on ≥ 50 % of the relevant days over the last
  28 days and ≥ 8 times, with its usual time (PL-12) and frequency (the weekdays it falls on).
  Shown once, in his words: «lo fai già 18 volte su 32: lo metto nel piano?»; refused = never
  asked again for that object. [n09, PLAN-36, plan.md §5.5, §9.4] — Today: not built.
- **PL-51** A proposal is checked before it is shown: against his **presets** (an existing
  blocco on the same type and slot is not proposed again; an archived object is never proposed)
  and against his **goal** (the day's planned kcal and protein with the blocco vs the day's
  targets from Obiettivi; a proposal that pushes a metric out of its fascia says so with the
  fix, MOD-52). [PLAN-36, MOD-41/42] — Today: not built.
- **PL-52** After 4 weeks, a blocco saltato or not done on ≥ 75 % of its days is offered for
  removal as one Consiglio («la merenda delle 16 saltata 9 volte su 12: la tolgo?»). [plan.md
  §5.6, MOD-52] — Today: not built. *Threshold decided by the agent* (the dossier's example).

## 7. Numbers the Piano shows (it judges, it sets nothing)
- **PL-60** A food blocco shows its real kcal and protein and the share of the day it makes;
  the share is derived from the day's targets (Obiettivi) and only judges and advises (pranzo
  45 % delle kcal; post-workout protein vs 0.25–0.4 g/kg, FD). [c04, MOD-35, PLAN-34, plan.md
  §5.4] — Today: partial (shares are still stored on blocks and used as slot targets,
  `models.ts historyShares`, E5 `slotTargets`: to remove in phase 4).
- **PL-61** The day's targets come from Obiettivi only (MOD-42): a planned session does not
  raise them; the Piano shows the day's planned gap to them. «Rec»'s deficit 200 kcal, protein
  2.2 g/kg, fat 0.8 g/kg are copied unchanged into Obiettivi, then «Rec» is archived. [PROD-45,
  plan.md §9.5/9.6, BODY-02] — Today: not built (targets live on the «Rec» model).
- **PL-62** Aggregation: per day, planned / fatto / saltato per area; per week, adherence per
  area, the ciclo's progress, kcal planned vs target; filtering Oggi · Piano by area changes the
  counts (only that area's blocchi). [plan.md §5.6, §8.6, PLAN-33] — Today: not built.

## 8. Objects, words, migration
- **PL-70** Blocchi and cicli are catalog objects with the common life (MOD-20): listed in the
  area's Piano and Elenco, «Parti da», Archivia (out of the Piano from today, past voci keep
  their link), Elimina only when no voce links to it (an empty, unused «Nuovo ciclo» can be
  deleted; «Push» used in N sessions offers Archivia). No «Duplica». [PLAN-33, PLAN-14, plan.md
  §8.7] — Today: partial (models and cycles archive; none deletes; «Duplica» still in
  `ModelEditor.tsx`).
- **PL-71** Words in the UI: blocco, ciclo, scheda, abitudine, Piano. «Modello», «giornata
  tipo», «settimana tipo», «routine», «regola» never appear (the glossary test). [CONTRA-04,
  product §3, plan.md §8.8] — Today: not built («routine» ~149 code occurrences).
- **PL-72** Phase 4 data change: week layouts and day models → their blocchi (with the weekdays
  they had) or nothing; «Rec» targets → Obiettivi (PL-61); PLPRR and the schede kept; the empty
  «Nuovo ciclo» and the inactive v1 programs archived; `extends`, shares and `plan_rules` not
  carried; one idempotent repair run by his job (DT-33). [model.md §4 «Today», plan.md §4,
  §9.6, day-templates §9.2] — Today: not built.

## Acceptance (his data; the IDs a test must cite)
1. PL-01/40: «AVENA, Marmellata · ogni giorno 07:30» is previsto every day with its real kcal and
   protein; no share is asked; the day box shows «colazione 18 % del giorno».
2. PL-02: dinner «MERLUZZO al sugo» ⇄ «… con ceci e carote»: one fatto, the next day the other.
3. PL-30/11: PLPRR step «Push» holds the scheda at 08:00 and caffè «30 min prima»: caffè at
   07:30; on Rest, no caffè; the session fatto at 08:40 moves a still-previsto caffè to 08:10.
4. PL-12/31: a session blocco with no time takes last same-weekday's time, never 17:30; the step
   due each day from 8 Oct equals v1's program view.
5. PL-50: «caffè entro 2 h prima dell'allenamento: 18 volte su 32» is offered once.
6. PL-70/61: «Nuovo ciclo» can be deleted, «Push» offers Archivia; after phase 4 his day targets equal «Rec»'s.
