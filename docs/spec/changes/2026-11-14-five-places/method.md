# Method — how lifeos is designed and changed (draft by Claude, 20 Nov, proposal §115)

His words (§114): «pensare e ragionare in dettaglio a tutte le cose che servono per ogni cosa, poi
fare un passo indietro… poi ancora un passo indietro su un livello gerarchico superiore… e poi
tornare nel dettaglio… non esistono modus operandi… standardizzati?»; then «inizia a pensare a come
vada preimpostato tutto questo framework, anche per cambiamenti futuri a tutto il progetto» (§115).
A process decision, expensive to reverse: once he settles §9 it becomes ADR-0064.

## 0. What goes wrong today, in one line
Each answer starts from one thing (a page, a card, a bar) and the decisions are scattered (114
proposal items, 23 study sections, five rules files). The method fixes the order: **every thing
first, then what they share, then the level above, then back down** — and gives each result one home.

## 1. The method in one paragraph
**OOUX** (Object-Oriented UX, Sophia Prater) gives *what* is decided: the **ORCA** tables — every
**O**bject, its **R**elationships, its **C**alls to action, its **A**ttributes. **Double Diamond**
(Design Council) gives *how* it is decided: rounds that open up to every detail (diverge) and close
down to what is shared (converge), at a stated **zoom level**. The cards, the places, the engine and
the actions in place are not designed one by one: they are **derived** from the ORCA tables.
Inside the rounds: the **interface inventory** (Brad Frost) for what exists, **Munzner's what · why
· how** for each attribute's view, **DDD's one vocabulary** (product.md §3) for the words.

## 2. The ORCA tables (one home each: `docs/spec/orca/`)
| Table | One row is | Columns | Gives |
|---|---|---|---|
| **objects** | a thing he knows by name (OBJ-nn) | name (his word) · what it is · **form** (voce type · object · signal · reference · place) · class (MOD-57) · status (✓ ◐ ○ ✗) · source (his words, date) | the catalog of everything; the registry in code must match it |
| **relationships** (nested-object matrix) | a pair of objects | made of · contains · refers to · derived from · how many | the hierarchy, the drill paths, what nests inside a card |
| **actions** (CTA matrix) | object × action | log · plan · change · skip · start from · merge · archive · filter · drill · compare · why — and **where, in place** (which card, which row) | the grammar of §4 / §15, with no ⊕ |
| **attributes** | a fact an object carries | type → reading (MOD-57) · the **question** it answers · instrument (§21) · level (0 · 1 · 2) · references · data status (✓ ◐ ○ ✗) | each card's levels and the engine's input |
**Derived, never drawn by hand:** a **card** per object (its attributes by level, its actions in
place); the **places** (presets of the two spaces, reframe §3); the **engine** (attribute → instrument);
**navigation** (relationships → drill and roll up).

## 3. The zoom levels (where a decision lives)
| Zoom | Decides | Home |
|---|---|---|
| **Z1 purpose** | what lifeos is, the principles | `product.md` |
| **Z2 system** | the layers, the two spaces, the grammar, the engine | `system.md` (from `reframe.md`) |
| **Z3 patterns** | cards, instruments, interactions, look | `patterns.md`, `views.md` (from bars-study §21–§23), `visual.md` |
| **Z4 objects** | the ORCA tables | `orca/` (the catalog part of `model.md` moves here; its rules stay) |
| **Z5 details** | formulas, ranges, sources | `domains/` |
**Rule:** a decision is written at the highest zoom it changes. When a detail contradicts a level
above, the round goes up — it is never patched below.

## 4. A round (Double Diamond), for the first pass and every change after
| Step | Diverge / converge | Does | Output | Stop for him |
|---|---|---|---|---|
| **1 Discover** | open | the inventory at the round's zoom: his words (inbox, proposal, ledger), the app as it is (screens, `map.md`), his data (exports) | a raw list, nothing decided | — |
| **2 Define** | close | the ORCA tables updated; every conflict between his older and newer words named | tables + conflicts | **A**: his word on the tables and the conflicts |
| **3 Develop** | open | unify: what objects share (one card, one instrument, one action); options; go up a zoom if a unification changes a pattern or the system | options with a recommendation, at their zoom | — |
| **4 Deliver** | close | delta with IDs → slices by layer, each reaching every place → tests, photos | PR | **B**: his word on the photos |
Each round says its **zoom** and covers **every object in its scope** — never one first. A round may
send the work back to step 1 or 2 at another zoom (his «poi di nuovo indietro dove e quando
necessario»).

## 5. Every future request, through the same door
1. His words → `inbox.md`, or the open change's `proposal.md` (as today, PRD-43).
2. **Triage**: which zoom it touches and which ORCA cells. A detail (Z5) → steps 2 and 4; a new
   attribute or action (Z4) → steps 2–4; a new kind of thing → a full round at Z4; a new pattern or
   a change of grammar → a round at Z3 or Z2, then down.
3. The `change` skill runs those steps; `proposal.md` gains two headers: **Zoom** and **ORCA cells**.

## 6. Checks that hold it (`check.py` and tests; each fails a PR)
- every type in the registry has its OBJ row, and every ✓ object exists in the registry;
- every attribute has a reading, a question, an instrument and a level;
- every action has its place; no ⊕, no page of its own for an action;
- a delta row cites the ORCA cell or zoom it changes;
- one card per object (target.md B8's guard, extended to views); a page draws nothing of its own.

## 7. What it folds (one truth, PRD-40)
`reframe.md` → `system.md` (Z2) · bars-study §21–§23 → `views.md` (Z3) · target.md's tables and
§22's channels → `orca/` (Z4) · `model.md` keeps its rules, gives its catalog to `orca/`. The
proposal items stay as history. Nothing is lost: every row keeps its source.

## 8. The first pass (once §9 is settled)
Round 1 at Z4 over **every** object: Discover (inventory of the spec, his words, the 3 current pages
and the obsolete ones as history, his export) → Define (the four tables, all objects, A) → Develop
(what they share → up to Z3: cards, instruments, actions; up to Z2 if needed) → Deliver (the system
and pattern docs, then the first slices — by layer, every place at once, B). Mechanical sweeps (the
inventory) by one Sonnet reader; tables, unification and design by Claude with him.

## 9. His to settle
1. **OOUX/ORCA in Double Diamond rounds** as the project's method (recommended), recorded as
   ADR-0064.
2. The ORCA tables as **markdown tables** with a fixed schema that `check.py` reads (recommended:
   he can read them, git diffs them) — or YAML with a generated page.
3. The **zoom levels and their homes** (§3), including `system.md` and `views.md`.
4. The two stops, **A** (tables) and **B** (photos), per round.
5. The `change` skill and `check.py` updated as in §5–§6 before the first pass.
