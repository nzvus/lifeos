# Reframe — lifeos rethought from the ground (draft by Claude, 20 Nov, proposal §107)

His words: «ok, facciamo un passo indietro, un re framing. ripensando veramente a tutto». Read for
it: product.md (the constitution), model.md and patterns.md by headline, ADR-0063, target.md,
proposal §32 · §64–§106, bars-study §16–§23, inbox W-04, `.claude/rules/design.md`. Nothing here
is decided: §9 lists what he settles. No code until he has.

## 0. Why the work keeps going wrong
1. **The unit of design is the page.** Each round redraws one place (the bar in Oggi, the Piano
   widget, Andamento's doors), so the same thing is drawn many ways (target.md §1: a cibo 9 ways)
   and every fix is local, against W-04 («ogni problema specifico è sistemico»).
2. **Decisions are scattered**: 106 proposal items, 23 study sections, the constitution and five
   rules files. A new session reads a part and contradicts the rest (§106).
3. **The constitution contradicts what he has said since**: PRD-16 (four tabs) vs ADR-0063 (five
   places); PRD-19 («two levels at most») vs §99 («non necessariamente solo due»); PRD-20 («fewer
   numbers») vs §100 («condensare il più possibile»).
So the reframe changes the unit: **one model in four layers; a page is never designed, it is a
setting of the layers.**

## 1. What lifeos is (PRD-01, unchanged)
One person's app to **log** his life and **understand** it against his goals. Every screen answers
one of four questions about his life in time: **how did it go** (the past), **how is it going**
(now), **what is coming** (the plan), **why** (the reasons and the sources). The core is what he
uses (PRD-02); a new kind of thing is a registry entry (PRD-03).

## 2. The four layers (each built once; every place derives from them)
| Layer | What it is | Where it lives today |
|---|---|---|
| **1. Things** | every thing is a **voce** in time (previsto · fatto · saltato) of a **type** with a **class** (intake · activity · state · measurement · exchange · note · context); reusable things are **objects** (cibo, pasto, esercizio, scheda…), made of **parts**; a **ritmo** repeats voci (§32) | registry, MOD-01…36, MOD-57 |
| **2. Measures** | every number is a measure of things **over a frame** (own · day · session · period), with its **references** (target, fascia, goal, past self, mean, record), its **certainty**, its **judgement** (voto) | engines MOD-40…54 |
| **3. Views** | the engine: **question × frame × level → an instrument** (§21: reach, prediction, trend, yes / no, rhythm, stock, comparison, composition, source, spread, verdict), every channel the data has, and the **actions** that move between views | `core/engines/view`, kit pieces (MOD-56) |
| **4. Places** | a place is a **preset** of the layers: a frame, a time window, a filter, a starting view | today: hand-made pages |
A change is made in the lowest layer it belongs to and reaches every place at once. A place never
owns a drawing, a form or a list (target.md §3).

## 3. Places reframed: two spaces and their presets
Everything he looks at is either **his life in time** or **his things**. So the app has two spaces:
- **Il tempo** — one timeline. The **window** (day · week · month · year) and the **position**
  (past · now · future) are actions on it, not pages. At day size it is today's Oggi (the rail,
  the voci, «Il giorno»); moved into the future it is the Piano (§32: «una giornata in Oggi ma nel
  futuro»), the same rail with previsto voci and their ritmo tags; widened to a week or a month it
  is Andamento — the same instruments rolled up (the macro bar becomes a column a day, the rail a
  span chart, yes / no a calendar); with the **references** shown it is Obiettivi (each goal a line
  or a fan on the same instruments). Four of today's places are four settings of one place.
- **Le cose** — the catalog: every object at frame *own*, as the same Box the timeline draws
  (W-04: «riusare le schede che si usano in oggi»), its parts nested (marche, formati, righe), its
  use over time one drill away (into Il tempo, filtered to it).
- **⊕** captures a voce, or creates an object, from either space (PAT-60).
- **Perché?** is not a place: it is the deepest level of any verdict. «Come valutiamo» is the
  voto's instrument opened all the way (its criteria, weights, sources).
**ADR-0063's bar can stay as five presets**: Elenco = Le cose; Piano = Il tempo, future, day;
Oggi = Il tempo, now, day; Andamento = Il tempo, a week or more; Obiettivi = Il tempo with the
goals. He keeps the five buttons he picked; behind them there are two spaces and one engine, so
nothing is built twice. The area (Cibo · Corpo · Mente · Soldi) stays a filter on both (PAT-95).

## 4. The interaction grammar (the same everywhere)
- **Moving through views** (§21.7) — time: swipe to move, the window to widen (day → week →
  month); what: tap a part to drill, the path to roll up; filter by area, kind or state; pivot the
  same total (by macro ↔ by meal ↔ by part of the day); compare (last time, the record); why.
- **Acting on things** — log (⊕, or a tap on a previsto), plan (the same in the future), edit in
  place (PAT-13), start from / variant / merge / archive (MOD-20). One verb, one form (PRD-14).
- **The instrument is the control**; the few controls left are one kit piece on the measured
  scale (§23).

## 5. The visual rules (already agreed; cited, not repeated)
His first rule (§100) and its tests (bars-study §21.0); the instruments and their channels (§21.1
–§21.4); every type on his data (§22); the foundations as tokens (§23).

## 6. What this removes
Pages as units of design · the Piano widget and its own day (§32, already his) · Andamento as a
separate page with its own doors and charts · Obiettivi's own page template · a second renderer
for any type (target.md B8's guard extended to views) · per-page CSS. Kept: every feature he
uses (PRD-19: one tap away, never cut), the weather, the week strip as the window's control,
silhouettes, glyphs, the voto chip.

## 7. Amendments to the constitution it needs (his to approve)
- **PRD-03** + «a new kind of view is an engine entry, never a page drawing» (MOD-56).
- **PRD-16** → two spaces (Il tempo, Le cose), the bar as presets of them (ADR-0063's five).
- **PRD-19** → levels: as many as the data has (drill), at most two in view at once (§99).
- **PRD-20** → fewer **written** numbers, more information in channels (§100); every number still
  has its «Perché?».
- **PRD-13** stays: the first view of each preset answers today's decision in one screen.

## 8. How we work from here (the process, reframed)
1. The spec in four layers: model.md (things), the engines (measures), a new `views.md` that
   absorbs bars-study §21–§23 (views), the presets table (places) — one home each (PRD-40).
2. Each piece of work names its layer and every place it reaches; a page-only change is refused
   (W-04's «regole ferree», as a check in `check.py`).
3. Shown on the gallery of the engine with his data, then in one preset; his word, then the next.
4. Order: the instruments whose data exists (§22: reach, rhythm, yes / no, trend) → Il tempo at
   day size (today's Oggi and the Piano) → widened (Andamento, Obiettivi) → Le cose.

## 9. His to settle
1. The two spaces with five presets (§3) — or the five places as separate pages (ADR-0063 as is).
2. The amendments of §7.
3. The process of §8, the new `views.md` included.
4. Anything missing from §1's four questions, or from §6 that he wants kept.
