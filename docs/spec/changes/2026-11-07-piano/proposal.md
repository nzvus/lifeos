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

**Not in this change.** PL-50…52 proposals and their checks (the proposal engine, a change of
its own after this one); PL-62 week aggregation; plan layers (x04).

**Stop.** Before the migration runs: it runs only through his «migrate v2» (he triggers it).
