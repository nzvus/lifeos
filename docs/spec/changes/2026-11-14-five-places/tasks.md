# Tasks — five places by action

Design first, in the real app on a branch (no separate drawings); nothing merged before his OK on each screen.

1. [x] The five places at rest on one grid — https://claude.ai/artifact/NZ96SciMLkM1pWy9V4AzgQ
   (rows and edges measured at 390/360/320).
2. [ ] One screen at a time in the real app, from the kit pieces, photographed at 390/360/320
   (`.claude/rules/design.md`). First: Oggi with «Il giorno» opened. The two artifact pages of 13–14 Nov
   are rejected (own flat rows; his words in the proposal).
   - [x] Oggi built on branch `five-places-oggi`, photos in `LIFEOS/review/2026-11-14/oggi-proposal/`
     (14 Nov). Waiting for his word; then the next screen.
   - [x] The dock he edits (PAT-99, O5) on the same branch, tried in the app (14 Nov).
   - [x] The dock as a strip above the bar; every place under the new bar with the area chips
     (tasks 6 and 7 without the redirects), 14 Nov.
   - [x] From «Oggi a livelli» (1) and (2): closed voce one line + energy strip; detail behind
     doors, one open at a time (proposal §14, branch `oggi-levels`).
   - [x] (3) «Il giorno» takes in the lines under it (proposal §15).
   - [x] (4) Parts of the day that close, with their count and kcal (proposal §16).
3. [ ] The composer on the grid (C1…C7: the amount is the control, «Pasto» automatic, planned time
   and «tieni le 12:30», variants).
4. [ ] The gym on the grid (G1…G6: timer always in view, order follows what he does, warm-up
   proposed with its reason, sides).
5. [ ] His OK on each drawing; open questions from the pages into this proposal.
6. [ ] Kit: `NavBar` with the five places, `AreaFilter`, the place header with ⊕ (PAT-01, PAT-95,
   PAT-96) — tests citing the IDs, kit photos.
7. [ ] Routes: five place routes, redirects from `[area]` tabs; `AreaTabs` removed (PAT-03).
8. [x] Piano plans a future day; Oggi's week strip opens it (PAT-97) — draft, proposal §17,
   waiting for his word.
9. [ ] Obiettivi: the goals together, the voto's weights; voto as a number (PAT-98).
10. [x] Giornata tipo = the ciclo's step; «blocco» off the screens; one place per idea (§29–§31).
10b. [ ] Ritmo (his «periodizzazione», §32): [x] slice 1 — Piano is a day, the tag on the line;
    [~] slice 2 — 2a built: «Questa volta» (cambia passo, salta); 2b built: «sposta» one line
    this time (§36); to do: the tag's sheet (always: rule, name,
    the things in it) and «Ripeti…» on a voce with no ritmo; [ ] forbid «blocco» in product.md
    §3; [ ] times at planning «fissa · quando capita» (§27 second half); [ ] the ciclo's page
    redone (steps first, rules folded, reorder by dragging, §31).
10c. [ ] The visual system (bars-study §16, proposal §88): [x] the study — ingredients, channels,
    context; [x] taken by «yc» (§89); the ridge rejected (§90), the meal-in-day bars reverted
    (§92); [x] a meal carries its limits; [x] the abstraction drafted (§17); [x] the visualization
    engine drafted (§18), taken by «yc» (§94); [x] slice 1: every type has a class, every field
    a reading (`core/engines/view`, MOD-56/57); [x] slice 2: views from a request (frame, level)
    drawn by kit pieces, shown on three classes (`MeasureView`, `/kit#motore`, §95); [x] slice 3a: yes / no
    for any class, no dots on bars (`Done`, §97); [ ] slice 3b: category · presence, words in the
    bar (§19.3), the past-self ghost and the record; [ ] the guard (§18.5); [ ] the foundations measured
    (spacing, sizes, padding, colour lightness/saturation);
    tests citing VIS-50/52/22; [ ] the delta (VIS-, PAT- rows) for what he approves.
11. [ ] Delta merged into the spec, ARCHITECTURE, change archived, retro.
11. [ ] The method (ADR-0064): [x] ADR, `change` skill, `check.py`, `orca/` schema (§118);
    round 1: [x] Discover, [x] Define → **stop A** (`round-1.md`, §119); [x] stop A passed (§120); [x] Develop (§121) → q10–q11; [~] Deliver: [x] ① docs fold (§123); [x] ② registry (§124); [~] ③ the Box → stop B ([x] ③a the plan, §125; [~] ③b the kit Box draws it: [x] Elenco · Cibi (§126, his word pending), [x] Oggi, esercizi, schede through `PlanBox` (§132–§138, layout rejected §139); [ ] ③c the
    anatomy (§139–§141): [x] spec PAT-102, VIS-106, VIS-107, MOD-61; [ ] engine: each righe's
    share of each criterion's input (MOD-61, `core/food/score.ts`); [ ] kit: the one bar with
    parts/kinds modes and light (VIS-106), the voto bar split by part (VIS-107), `PlanBox` zones
    (PAT-102); [ ] one meal box on Oggi, photos, **stop**; [ ] the other types on the anatomy, the
    in-place edits (ACT-03, ACT-25) on it; [ ] an esercizio's own voto, the sessione from them
    (MOD-61); [ ] obiettivi); [ ] ④ where adding happens → stop B; [ ] ⑤ lanes → stop B.

## Next, from his words (his §166: «rivedi tutte le discussioni… di modo che possiamo andare avanti
## tenendo tutto a mente») — decided, not built; each with its source

**A. The voto** (§139–§141, VIS-107, MOD-61; its look today is temporary, his §163)
- [ ] A1 The voto bar under the macro bar, drawn unlike it: one column per criterion (width = its
  weight, height = its score, its band's colour), each column split by ingredient — a piece = that
  ingredient's share of the criterion's input (MOD-61 `lineShares`/`split`: built). A criterion not
  from the parts («momento», a missing price) drawn whole.
- [ ] A2 Live: while an amount is edited the voto and its pieces are recomputed; «senza questo: 64 →
  71» lives in the «Perché?» (PAT-51), not on the bar.
- [ ] A3 Each ingredient carries its own voto (a cibo's voto per 100 kcal; §142 (4): a pasto's
  ingredients show none yet).
- [ ] A4 A touched or edited ingredient lights its pieces in both bars at once, the rest dims.
- [ ] A5 The same pattern up the scale (§141): an esercizio gets its own voto, a sessione is their
  aggregate; a day ← its voci; a period ← its days (Andamento). Open (§144): the day's voto by voce.
- [x] Open, the voto always in full, no «Voto» door; the mini voto only shut (§161–§162).
- [x] Five chevrons (⇊ ↓ – ↑ ⇈), their colours shared by the voto (§146–§148, §155).

**B. Editing in place** (§112–§113, reframe §15, PAT-13, §137, §139)
- [ ] B1 An ingredient's grams on its number: tap → a small stepper (drawn small, touched at 44,
  §137) in its row; bars and voto follow live (A2).
- [ ] B2 «+ ingrediente» at the end of the meal's lines, inside the box: a search row opens there,
  results under it (no pop-up; the kin search's small window, §163, is the same piece).
- [ ] B3 Porzioni: one stepper, once (PAT-101; built on the day).
- [ ] B4 Editing puts the bars in the ingredient view (VIS-106) and lights the edited one (A4).
- [ ] B5 On the day an edit changes only that voce (ADR-0007); in the Elenco the pasto, and its
  children follow (MOD-23); «↺» on a voce whose pasto changed after it (PAT-31).
- [ ] B6 The name and nota on the box — **asked** (§165): (1) tap the open title, it becomes a field
  (recommended); (2) «Nome» and «Nota» rows.
- [ ] B7 Adding everywhere in place (reframe §15): on the rail at a time or a gap, «Senza orario»,
  «Nuovo tipo» at the end of the results; ⊕, the Capture sheet and the Aggiungi page go; «Al volo»
  stays; the ranking for this hour kept.
- [ ] B8 PAT-104: a voce's dish name is the door to its pasto in the Elenco.

**C. The bars, by ingredient or by nutrient** (§139, §143–§146, §150–§151, VIS-106, VIS-50, §101)
- [x] A meal's four macros on one row, each bar full = its parts' proportions, a chevron by each
  number (§146–§149); «Il giorno» expanded with chevrons; the band at the top once scrolled past,
  the meal in view lit (§150–§151).
- [ ] C1 The two views of the same bars: **by ingredient** (each ingredient a block) · **by
  nutrient kind** (the origins «Il giorno» draws: qualità alta…, amidi integrali…, omega-3…) —
  how he switches is **open**: a tap on the bars (his §143 «se tocchi sulle barre scorri tra queste
  visualizzazioni», recommended) or a chip (VIS-106 as written).
- [ ] C2 A tapped ingredient (or kind) lights its blocks in every bar, the rest dims (VIS-50 level
  2, now everywhere).
- [ ] C3 The same one-bar-by-parts for a sessione (its esercizi) and a day (its voci) (VIS-106).
- [ ] C4 Drill down / roll up and filters as more views of the same instrument (§101, bars-study
  §21.7); the instrument is the control.

**D. One box for every type** (§154 steps 4–5, Stop B table §155)
- [ ] D1 Every type through `PlanBox` (today four builders); zone 2 a bar from its level-0 value
  (dose, passi, ore di sonno, ritmo dell'obiettivo); ciclo, blocco, obiettivo open like the rest.
- [ ] D2 One look for a field's value (the row he taps, PAT-13), never tiles and chips both.
- [ ] D3 The Stop B faults: the assunzione's two costs (0,10 vs 0,06 €), the tragitto's tiles in
  English, come stai and «a digiuno» shown twice, sonno titled «Sveglia».
- [ ] D4 «?» (come valutiamo) and the icon actions in the old boxes too, when they move to PlanBox.

**E. Waiting from before this change's Deliver** (handoff, audit 15 Nov)
- [ ] The gym (§59): the exercise box in the Elenco, a Muscoli picker (show first), «carico per
  lato», the gym on photos, Andamento per esercizio, the session's voto over time.
- [ ] Lost since #357: «Copia i pasti di ieri», «Salva come giornata tipo», «+ previsto».
- [ ] §64 the week strip redesign; inbox W-01…W-04, Q-25.

**Open, his:** B6 (name and nota), C1 (how the view switches), a lone icon button filling its
whole row (VIS-109 as written does).
