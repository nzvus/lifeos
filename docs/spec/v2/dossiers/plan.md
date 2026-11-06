# Dossier — Piano: real meals, layers, rules, one word per thing

Status: **decided 2026-11-03** — the developer: «ok alle raccomandazioni, procedi»: every
§9 answer is (a), **except 9.6, changed by the agent**: «Rec» carries his day targets
(dynamic, deficit 200 kcal, protein 2,2 g/kg, fat 0,8 g/kg), so archiving it would change his
numbers; it stays as the source of the day's targets and only leaves the Piano. Only the
empty «Nuovo ciclo» is archived. It replaces the model part of
`day-templates.md`; that dossier's engines (E3 `resolve`, `apply`, `swap`,
`cyclePlan`) stay.

Ledger: PLAN-01, PLAN-33, PLAN-34, PLAN-35, PLAN-29, PLAN-04, PLAN-05, PLAN-11, PLAN-12,
CONTRA-04, UI-45, UI-38, FOOD-46, BODY-02 · ADR-0059, ADR-0060

## 1. Question
«What will my day look like, and how do I change it?» In his words (3 Nov):
- «I tragitti, piani, modello, routine, abitudini, non si capisce nulla… non dovrebbero
  comparire negli elenchi? anche poter essere eliminate? e le aggregazioni?»;
- «dovrei poter pianificare in una giornata i pasti veri e propri, piuttosto che le
  percentuali… al massimo le percentuali le usiamo per valutarne i consigli»;
- «i piani e i modelli devono poter essere sovrapponibili e filtrabili dipendentemente
  dalle categorie trackate. Ci potrebbero essere cross dipendenze, tipo che mangio quel
  piatto in più quel giorno che cammino di più, oppure mangio a quell'ora quella cosa, o
  integratore quel giorno che mi alleno a una determinata ora con una determinata
  sessione»;
- earlier (considerations.txt): «un sistema di programmazione delle routine per tutto
  quanto, non solo per la palestra… più intelligente ma molto usabile».

## 2. Today
**Code:**
- A day model's block can be only a meal role with kcal and protein **shares**, or a
  session (`core/plans/models-repo.ts:227`). `itemId` and `cycleId` exist in the schema
  but are never written.
- Models only inherit from one base; one model per weekday.
- Models, cycles and habits cannot be deleted. Routines are in no list.
- Habits exclude meals, money and movement.
- **Five words** for overlapping ideas: modello, giornata tipo, settimana tipo, ciclo,
  routine (plus abitudine).

**His data (local copy of the 29 Oct export, preview account):**
- **Day models:** «Rec» is the only live one, with **0 blocks** (`template_blocks` is
  empty). Every weekday is «Rec».
- **Cycles:** 6. «PLPRR» is active: Pull · Push · Legs · Corsa · Rest. One empty one is
  called «Nuovo ciclo».
- **Routines:** 9. **Habits:** 0. **Planned entries:** none.
- **What he really eats (since 1 Oct, by role):**

  | Role | Meals | Most eaten |
  |---|---|---|
  | breakfast | 44 | «AVENA, Marmellata» 15, «AVENA, Lamponi…» 11 |
  | lunch | 54 | «Gnocchi alla sorrentina» 24 |
  | dinner | 42 | «MERLUZZO al sugo» 11, «… con ceci e carote» 6 |
  | snack | 58 | avena 13, gallette 11, gelato proteico 13 (three versions) |

- **Sessions:** 32 since 1 Oct, mostly in the morning (07:20–10:50), Wednesday and
  Friday around 13. **18 of the 32 had a coffee within 2 h before.**

**Reading:** the Piano went unused because it plans what he does not think in
(percentages of a role). What he repeats is real meals, a cycle of workouts, and pairs
across categories (a coffee before training).

## 3. Evidence
- **Planning meals ahead goes with a better diet.** In 40,554 adults (NutriNet-Santé),
  meal planning was associated with higher diet quality and variety and lower odds of
  obesity (Ducrot et al. 2017,
  [doi:10.1186/s12966-017-0461-7](https://doi.org/10.1186/s12966-017-0461-7)).
  *Cross-sectional.* It plans meals, not shares.
- **If-then plans.** «Implementation intentions» («if X, then I do Y») have a medium-to-large
  effect on reaching goals, d ≈ 0.65 over 94 studies (Gollwitzer & Sheeran 2006,
  [doi:10.1016/S0065-2601(06)38002-1](https://doi.org/10.1016/S0065-2601(06)38002-1)).
  *Meta-analysis.* His cross-dependencies are exactly that form («se mi alleno alle 8,
  creatina alle 7:30»).
- **Habits form in context.** Automaticity grew over a median of 66 days (18–254) when one
  behaviour was repeated in the same context (Lally et al. 2010,
  [doi:10.1002/ejsp.674](https://doi.org/10.1002/ejsp.674)). *Single study.* Anchoring a
  block to another (after breakfast, before training) is the context.
- **Nutrients around training:** protein 0.25–0.4 g/kg within ~2 h after, carbohydrate
  1–3 h before long sessions (ISSN 2017, Kerksick,
  [doi:10.1186/s12970-017-0189-4](https://doi.org/10.1186/s12970-017-0189-4)). *Position
  stand.* These are the **advice** the shares become, never forced shares.
- **Recurrence** is a solved problem: RFC 5545 RRULE (daily, weekly by day, every N, a
  count per week). *Standard.* E1 already covers it (DATA-04).

## 4. Data
- **Block** (exists: `template_blocks`; it gets written for real):
  - *what*: a saved meal or one of its variants (ADR-0060), a **rotation** of several,
    a session (one or more schede, or the cycle's next), an intake (FOOD-44), an activity
    or a walk, a habit or tracker of any kind (his own too);
  - *how much*: servings;
  - *when*: a time, or relative to another block («30 min prima dell'allenamento»,
    «dopo colazione»), or untimed;
  - *days*: a recurrence (every day, some weekdays, N per week, a cycle's step).
- **Layer:** a block belongs to the area of its kind (ADR-0059: Cibo, Corpo, Mente,
  Soldi). A layer is not stored: it is the blocks of one area, switched on or off and
  filtered on the Piano.
- **Rule (if-then):** *if* a condition on the day (a session of this scheda, a session
  at this time, a walk or steps planned over N, a weekday, an area's block present)
  *then* an effect (add a block relative to the condition, change a block's servings,
  swap a block's meal). Stored as its own row, name, active, created by hand or from a
  suggestion. **A new table** (`plan_rules`, owner-scoped): §9.7, ADR.
- **Shares:** not stored on blocks any more. A meal block's share of the day is
  computed from its real meal and judged against the advice (§3).
- **Scheda** (was «routine», `catalog = routine`): unchanged data, one word (§9.2).
- **Kept:** cycles and their steps, `cycle_override`/`cycle_skip`; the goal sets the
  day's energy (PLAN-02); planned entries computed on the fly and stored only when
  touched (day-templates §9.1).
- **Dropped:** day models' targets and shares, week layouts. «Rec» (no blocks) and the
  empty «Nuovo ciclo» are archived by a data repair after his yes.

## 5. Model
1. **A day's plan** = every active block whose recurrence matches the day, plus the
   cycle's step for that day (`cyclePlan`). Then the active rules are applied in order
   (the conditions read the plan, not only what was logged), each effect tagged with its
   rule.
2. **Times:** absolute; or relative to the anchor's *actual* time when it has been logged,
   else its planned time (E3 `apply`). No time → untimed, never 17:30 (TRAIN-34).
3. **Rotation:** the next item after the last one done (by its own history), or by
   weekday when he sets one.
4. **Judgement, not targets:**
   - a meal block shows its kcal and protein and the share of the day it makes;
   - the advice says when the share is off what the evidence suggests («pranzo 45 % delle
     kcal; le proteine dopo l'allenamento sono 0,18 g/kg: sotto 0,25»);
   - the day's targets still come from the goal (PLAN-02); the plan shows the day's gap
     to them (BODY-02).
5. **Rule suggestions** from his own history: a pair seen in ≥ 50 % of the condition's
   days over 28 days and ≥ 8 times. Example: the coffee before training, 18 of 32. It is
   proposed once, in words, «lo fai già 18 volte su 32: lo metto nel piano?».
6. **Aggregation:**
   - block → day: planned / done / skipped per layer;
   - week: adherence per layer, the cycle's progress, kcal planned vs target;
   - 4 weeks: which blocks he keeps skipping («la merenda delle 16 saltata 9 volte su 12:
     la tolgo?»).

## 6. Experience
- **Piano in each area (ADR-0059).**
  - **Cibo · Piano:** meal blocks («Colazione · AVENA, Marmellata · ogni giorno 07:30»),
    intake blocks.
  - **Corpo · Piano:** the cycle (PLPRR) and its schede, activities.
  - **Mente · Piano:** habits and trackers.
  - Every row opens its object page (P1): change, «Parti da…», Archivia or Elimina
    (Elimina when unused, else Archivia with the reason).
- **Oggi · Piano:** the week, one column per day, blocks from every layer stacked by
  time, layer chips (Cibo · Corpo · Mente · Soldi) to filter, a dot per block planned /
  done / skipped. «Regole» below, each one sentence: «Nei giorni di Push alle 8: creatina
  3 g alle 7:30».
- **Adding a block** (⊕ in a Piano tab): what (search over meals, variants, schede,
  intakes, kinds), when (time or «dopo…/prima di…»), which days. **From Oggi:** «Ripeti»
  on any logged entry makes its block with its time and weekday prefilled.
- **A rule:** «+ Regola» → *Quando* (pick: un allenamento · una scheda · un orario · un
  giorno · un tragitto/passi) → *allora* (aggiungi · cambia porzioni · scambia). Each
  effect on Oggi carries «per la regola …», undoable for that day.
- **Words:** blocco, regola, ciclo, scheda, abitudine. «Modello», «giornata tipo»,
  «settimana tipo» and «routine» leave the app (§9.1–9.2).

## 7. Edge cases
- Two rules on the same block: the later one in the list wins, and the block says both.
- A rule whose anchor is skipped: its effect is withdrawn («saltato perché: niente Push
  oggi»).
- A relative block whose anchor has no time: it is shown untimed after it.
- A rotation item archived: it is skipped in the rotation and said once.
- Travel or illness: «Salta la giornata» skips every block, cycles shift by their rule.
- Past days never change when blocks or rules change: what was planned then is not
  stored unless touched.

## 8. Acceptance tests (his data)
1. **Breakfast:** a block «AVENA, Marmellata di arance · ogni giorno 07:30» puts it planned
   on every day with its real kcal and protein. No share is asked. The day box shows
   «colazione 18 % del giorno».
2. **Lunch rotation:** «Gnocchi alla sorrentina» Mon–Fri. **Dinner rotation:** «MERLUZZO
   al sugo» ⇄ «… con ceci e carote». After one is logged the next day shows the other.
3. **Rule:** «se c'è una sessione → creatina 3 g 30 min prima». With PLPRR Push planned at
   08:00 → creatina planned at 07:30; on Rest → none. When the session is logged at 08:40,
   the creatina moves to 08:10 if still planned.
4. **Suggestion:** from his history: «caffè entro 2 h prima dell'allenamento: 18 volte su
   32» is offered once as a rule.
5. **Cross-category rule:** «se c'è una camminata ≥ 45 min → merenda: porzioni ×1,5». On a
   day with the walk planned the snack shows ×1,5 «per la regola…».
6. **Filter:** Oggi · Piano with only «Cibo» on shows no session and no habit; the week's
   adherence counts only food blocks.
7. **Lists and deletion:** «Nuovo ciclo» (empty, unused) can be deleted; «Push» (a scheda
   used in many sessions) shows Archivia with «usata in N sessioni».
8. **Words:** ui-check finds no «routine», «modello» or «giornata tipo» on any page.

## 9. Questions for the developer — decided 3 Nov as recommended (a), 9.6 changed (see status)
1. **The concepts:** **(a) blocks + rules, the layer is the area, «giornata tipo»,
   «settimana tipo» and day models go**; (b) keep «giornata tipo» as a named bundle of
   blocks you switch per day.
2. **«Routine» (CONTRA-04):** **(a) «scheda»** (the gym's own word: «scheda di
   allenamento»); (b) «allenamento»; (c) keep «routine».
3. **Rotations:** **(a) a block can rotate among meals or schede: the next after the last
   done**, or by weekday; (b) only one item per block.
4. **Rule suggestions from your history:** **(a) proposed once each, you accept or
   refuse**; (b) rules only by hand.
5. **Energy on a planned training day:** **(a) the day's targets stay the goal's (as
   decided, BODY-02); the plan shows the gap**; (b) a planned session raises the day's
   target.
6. **Your current «Rec» (no blocks) and «Nuovo ciclo» (empty):** **(a) archived by a data
   repair**, PLPRR and the schede kept; (b) leave them.
7. **Storing rules:** **(a) a new table `plan_rules` (migration + ADR)**; (b) inside
   `templates` as jsonb (no migration, harder to query and check).

Slices after his answers:
- (a) blocks with real items and recurrences: the repository, the area Piano lists,
  object pages, Archivia/Elimina;
- (b) Oggi · Piano: the week, the layers and the filter;
- (c) rotations;
- (d) rules: table, engine (E3 extension, test-first), «+ Regola», effects on Oggi;
- (e) suggestions from history;
- (f) words: «scheda» everywhere, the old words removed, the data repair;
- (g) aggregations (adherence per layer, «la togli?»).
