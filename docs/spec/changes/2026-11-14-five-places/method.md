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
| **Z2 system** | the layers, the two spaces, the grammar, the engine | `product.md` (the map, PRD-16) + `model.md` (the layers, MOD-56) — from `reframe.md` |
| **Z3 patterns** | cards, instruments, interactions, look | `patterns.md` (interactions, cards) + `visual.md` (instruments and their channels, from bars-study §21–§23) |
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
`reframe.md` → `product.md` and `model.md` (Z2) · bars-study §21–§23 → `visual.md` (Z3) · target.md's tables and
§22's channels → `orca/` (Z4) · `model.md` keeps its rules, gives its catalog to `orca/`. The
proposal items stay as history. Nothing is lost: every row keeps its source.

## 8. The first pass (once §9 is settled)
Round 1 at Z4 over **every** object: Discover (inventory of the spec, his words, the 3 current pages
and the obsolete ones as history, his export) → Define (the four tables, all objects, A) → Develop
(what they share → up to Z3: cards, instruments, actions; up to Z2 if needed) → Deliver (the system
and pattern docs, then the first slices — by layer, every place at once, B). Mechanical sweeps (the
inventory) by one Sonnet reader; tables, unification and design by Claude with him.

## 9. Settled by his «yc», 20 Nov (proposal §117) — all five as recommended; `PROJECT.md` archived
(with step 5)
1. **OOUX/ORCA in Double Diamond rounds** as the project's method (recommended), recorded as
   ADR-0064.
2. The ORCA tables as **markdown tables** with a fixed schema that `check.py` reads (recommended:
   he can read them, git diffs them) — or YAML with a generated page.
3. The **zoom levels and their homes** (§3): no new file but `orca/` (§10).
4. The two stops, **A** (tables) and **B** (photos), per round.
5. The `change` skill and `check.py` updated as in §5–§6 before the first pass.

## 10. How it sits on what already exists (his «come si configura con i framework che già ci
sono?», 20 Nov, proposal §116)
Nothing is replaced; each piece gets one job in the method. **New: only `docs/spec/orca/`** (the four
tables), two headers in `proposal.md`, a triage step, and the checks of §6.
| What exists | Its job in the method | Changes |
|---|---|---|
| `product.md` (PRD) | Z1 purpose; Z2's map (PRD-16) | the reframe's amendments land here at archive |
| `model.md` (MOD) | Z2's layers and the engine (MOD-56); Z4's **rules** | its catalog of types moves to `orca/objects` |
| `patterns.md` (PAT), `visual.md` (VIS) | Z3: interactions and cards; instruments and their channels | bars-study §21–§23 land in `visual.md` |
| `domains/` | Z5: formulas, ranges, sources | none |
| `orca/` (new) | Z4: objects, relationships, actions, attributes | the four tables |
| ADRs (`docs/decisions/`) | any decision expensive to reverse, at any zoom | ADR-0064 records the method |
| `changes/` + the `change` skill | **a change = one or more rounds**: proposal's «Why» = Discover; delta = Define (ORCA rows and IDs); «options» = Develop; tasks + apply = Deliver; its «Stop» = stops A and B | proposal gains **Zoom** and **ORCA cells**; the skill gains the triage |
| `inbox.md` (INBOX) | the one door for his words | + triage (zoom, cells) when an item becomes a change |
| `ROADMAP.md` «Now» | which round or change is next | none |
| `map.md` (generated: routes, components, kit pieces) | Discover's **interface inventory** of the app as it is | none |
| `check.py`, lint (PAT-90), kit photos (PAT-94), `e2e/layout`, `untested.txt` | the guards | + §6's ORCA checks in `check.py` |
| skills `audit` · `verify` · `retro` · `tune-rules` · `adr` | audit = spec vs code (+ ORCA vs registry); verify = stop B's photos; retro = what a round taught; tune-rules = when the method itself fails (`RULES_LOG.md`); adr = ADR-0064 | `audit` reads `orca/` too |
| `.claude/rules/design.md` | the session's reading guide: it **cites**, never decides | points to `orca/` and `visual.md` once they hold it |
| the handoff, memory | where we are; working lessons | none |
| «yc», «ap» (fleet GLOSSARY) | yc at stops A and B takes every recommendation; under ap a round runs, and a new object, pattern or level is parked as a question (CLAUDE.md rule 1) | none |
| `PROJECT.md` (kickoff brief, 2026-09) | overlaps Z1 (`product.md`) | his call: archive it, or keep it as the kit's brief |
| `docs/archive/` (ledger, v1/v2 specs) | Discover's sources (his older words) | none |
| the drafts in this change: `reframe.md`, `bars-study.md`, `target.md`, `method.md` | inputs of the first round | folded into their homes when the change archives |
