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

**Questions for him (the agent stops here: a new data model and a migration, rule 1).**
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

**Answered.** Q-14, his words 7 Nov: «decidi tu» → the agent's pick (a), recorded as ADR-0062
(blocchi and cicli are catalog objects).

His words, 7 Nov, after slice 1: «senti decidi tu, vai avanti senza di me» (PROD-39: go on
inside the approved spec; anything new is written as a question, asked at the end).

**Questions for him before slice 3 (new patterns: the agent does not pick them alone, PROD-39).**
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
resto segui i tuoi consigli e continua» → the agent's picks: Q-15 (a) a kit field «Ogni
quanto», Q-16 (a) the Composer with ordered lines and «+ Riposo».

**Not in this change.** PL-50…52 proposals and their checks (the proposal engine, a change of
its own after this one); PL-62 week aggregation; plan layers (x04).

**Stop.** Before the migration runs: it runs only through his «migrate v2» (he triggers it).
