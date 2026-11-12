# Change 2026-11-07-piano — the Piano as blocchi and cicli (phase 4, step 5)

**Why.** Phase 4 (approved 6 Nov): after esercizio and scheda comes the Piano (ROADMAP «Now»).
The spec already decides its model and its data change: MOD-30…35, PL-01…72 (a blocco = what +
when + how often + area; a ciclo = steps of blocchi; an abitudine = a blocco of a tracker; day
models and week layouts become blocchi with the weekdays they had; «Rec» targets become
Obiettivi; `extends`, shares and `plan_rules` are **not** carried, PL-72 — so ROADMAP's «plan_rules
returns here» is superseded by PL-72). His words: «decidi tu» (7 Nov, on Q-13, after the
report that named the Piano as the next change).

**What.**
1. **Storage** of blocchi and cicli — Q-14 below, his call (a data model and a migration).
2. **Data change** (PL-72): one idempotent repair, run by his «migrate v2» job after a dump
   (ADR-0003/0004): day models and week layouts → blocchi; «Rec» → Obiettivi; the empty «Nuovo
   ciclo» and the inactive v1 programs archived; PLPRR and the schede kept.
3. **Screens** on the generic pieces: a blocco's page (what, when, how often, area; Archivia,
   Parti da), a ciclo's page (its steps, what is due, Salta / Sposta), «Blocchi» and «Cicli» in
   each area's Elenco, the Piano tab of each area and of Oggi built from them (PL-40).
4. **Engine**: the Piano of a day from blocchi (PL-40…43) on the existing engines
   (`engines/planning`, recurrence, cycle advance with v1's 14 parity cases).

**Questions for him (Claude stops here: a new data model and a migration, rule 1).**
- **Q-14** How a blocco is stored.
  - (a) **A catalog object** (`catalog_items` «block», its when/how-often/area as
    `catalog_values`, its object or rotation as `catalog_parts`) — PL-70 «blocchi and cicli are
    catalog objects with the common life»: page, verbs, Elenco, archive, undo come from the
    registry with no new code; a ciclo is a catalog «cycle» whose steps keep today's
    `cycle_steps` / `cycle_step_items` (the advance engine and its 14 parity tests stay).
    Cost: the planning engine reads blocchi through a new repository; old plan tables stay
    read-only until a later cleanup.
  - (b) **A table of its own** (`blocks`, `block_items`): typed columns, clear SQL, the
    engine's queries simple; but verbs, page and Elenco need a new storage branch in
    `core/verbs` (the registry knows `catalog_items` and `kinds` only).
  - (c) **Reuse `template_blocks`** with a nullable template, recurrence and area added:
    the smallest migration; but it keeps the «modello» structure the spec removed (x04,
    MOD-32) and the derived-model columns nobody will use.
  - Agent's pick: **(a)** — it is what PRD-03 and PL-70 ask («a new kind of thing is a
    registry entry»), and every horizontal piece already works on it.

**Answered.** Q-14, his words 7 Nov: «decidi tu» → Claude's pick (a), recorded as ADR-0062
(blocchi and cicli are catalog objects).

His words, 7 Nov, after slice 1: «senti decidi tu, vai avanti senza di me» (PROD-39: go on
inside the approved spec; anything new is written as a question, asked at the end).

**Questions for him before slice 3 (new patterns: Claude does not pick them alone, PROD-39).**
Slice 2 (the migration, #341) needed neither.
- **Q-15** How «ogni quanto» is entered on a blocco's form (PL-20). PAT-61 has no field for it;
  today only the habit editor has one, bespoke (`HabitForm`: a choice + weekday chips).
  - (a) **A kit field «Ogni quanto»** (`Field type="recurrence"`): one choice (ogni giorno ·
    certi giorni · ogni N giorni · N volte a settimana · in certe date) that opens its own
    second control (weekday chips, a stepper, date pickers); `ObjectForm` uses it for any
    field of that type, so the blocco's form stays generic (PAT-61) and the habit editor goes.
  - (b) **The blocco's own form section** (a specialisation, like the scheda's): faster now,
    but a second «ogni quanto» the day any other type needs one.
  - Agent's pick: **(a)**.
- **Q-16** How a ciclo's steps are edited, rests included (PL-30). A step holds zero or more
  blocchi; zero = «Riposo», which is not an object, so the Composer (PAT-62) has nothing to search.
  - (a) **The Composer with ordered lines** (as the scheda, `counted={false}`), plus a fixed
    «+ Riposo» row under the search that adds an empty step; a step is one line, its label
    the blocco's name or «Riposo».
  - (b) **A list of steps on the ObjectPage** (PAT-30 parts), each step a row with «Su / Giù /
    Togli» and «+ Passo» / «+ Riposo» at the end; no Composer.
  - Agent's pick: **(a)** — one way to edit ordered lines, already built for the scheda.

**Answered.** Q-15 and Q-16, his words 10 Nov (after running «migrate v2» for #341): «per il
resto segui i tuoi consigli e continua» → Claude's picks: Q-15 (a) a kit field «Ogni
quanto», Q-16 (a) the Composer with ordered lines and «+ Riposo».

**Asked (10 Nov, slice 4).**
- **Q-17** How a previsto voce written from a blocco keeps its link (PL-40 «written as previsto
  voci linked `from_block`, never twice», MOD-33; PL-70 «Elimina only when no voce links to
  it», «past voci keep their link»). The schema's `entry_links` relation `from_block` points at
  an *entry* on both sides, so it cannot point at a blocco (a catalog row).
  - (a) **A `block_id` on the voce** (nullable, FK to his catalog row; schema migration 0009,
    run by «migrate v2»): today's first read writes each uncovered blocco as a previsto with
    it; «never twice» = a voce of that blocco that day exists, even trashed; Elimina of a
    blocco checks it; Andamento can count a blocco's fatti (PL-21).
  - (b) **No link on the voce**: the previsti stay computed on read (as now) and a decision
    `block_written` (day, blocco) only stops a second write; PL-70's «Elimina only if no voce
    links to it» cannot be checked.
  - (c) **`entry_links.to_id` without its FK** so it may name a blocco: no migration of data,
    but a link the database no longer checks.
  - Agent's pick: **(a)**: one column, checked by the database, and it serves PL-21 and PL-70
    too. Expensive to reverse (a schema change), so his to decide.

- **Q-18** What a ciclo's step holds (PL-30: «each step holds zero or more blocchi … «Push» +
  caffè 30 min prima»; acceptance 3: on Rest, no caffè). Today a step holds schede only (Q-16's
  Composer searches schede), and a blocco must have an «ogni quanto».
  - (a) **A step's lines are blocchi with «ogni quanto» = «nel ciclo»** (a sixth choice of
    the kit's «Ogni quanto»: planned only when its step is due). The step's Composer searches
    his blocchi and schede (a scheda picked becomes a blocco «nel ciclo» holding it); his
    current steps' schede become such blocchi by a data migration (same names). The caffè is a
    blocco «nel ciclo», «30 min prima di» the Push blocco.
  - (b) **Steps stay schede**; the caffè is a normal blocco «30 min prima di» a blocco that
    holds the gym, every day: on Rest it would still be planned (acceptance 3 fails).
  - Agent's pick: **(a)**: it is what PL-30 and Q-16 («a step's line says its blocco») say,
    with one new «Ogni quanto» choice (a pattern change: his to decide).

**Asked (12 Nov, autopilot, slice 4 «nel ciclo»).**
- **Q-24** How a step gets its second blocco (PL-30 «Push» + caffè 30 min prima; acceptance 3).
  Built (Q-18 (a)): a step's line is one blocco «nel ciclo», and the engine plans every blocco a
  step holds, each with its own when (tested: caffè 07:30 before the Push at 08:00, nothing on
  Rest). But the Composer has one line per *step*, so there is no way to put a second blocco in
  the same step.
  - (a) **A blocco «nel ciclo» anchored to another follows it**: the caffè is a blocco «Nel
    ciclo», «30 min prima di» the Push blocco, and it is planned on the days its anchor is
    planned. No new screen; the step keeps one line. A blocco «nel ciclo» with no anchor in
    any step plans nothing (said under «Ogni quanto»).
  - (b) **A step's line opens its own list** (tap «Push» → «Passo Push»: its blocchi on the
    kit Composer, «+ blocco»): several blocchi per step, a new screen and a new route.
  - (c) **A line «con il passo sopra»**: a Composer line may join the step above it (one more
    control per line, steps no longer one line each).
  - Agent's pick: **(a)**: the anchor already says what the caffè goes with, no new screen,
    and acceptance 3 holds. It changes what «nel ciclo» means (a pattern: his to decide).

**Answered (12 Nov, «ap yc»: every recommendation taken).** Q-24 → **(a)**: a blocco «nel
ciclo» anchored («N min prima/dopo di») to a blocco a step holds is planned with it. *Undo:* a
change that picks (b) or (c); the code is `dayBlocks`' step expansion. From the inbox, Q-23 →
**(a)**: retire the reads of `templates`, `template_blocks`, `week_layouts`, `cycles_state`
now; **dropping the tables is a delete, outside «yc»: asked again** once Q-18's step
migration has run and an export is verified. *Undo of the reads:* git revert of that slice.

**Answered.** Q-17 and Q-18, his picks 10 Nov (late, after «procedi»): Q-17 «block_id sulla
voce (Recommended)» → (a); Q-18 «Blocchi «nel ciclo» (Recommended)» → (a).

**Not in this change.** PL-50…52 proposals and their checks (the proposal engine, a change of
its own after this one); PL-62 week aggregation; plan layers (x04).

**Stop.** Before the migration runs: it runs only through his «migrate v2» (he triggers it).
