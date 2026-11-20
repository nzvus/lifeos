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

## 9. Settled for now: his «yc per ora», 20 Nov (proposal §108)
1. Two spaces with ADR-0063's five as presets (§3) (undo: ADR-0063 as is, five pages).
2. The amendments of §7, written in `delta.md` (undo: drop those delta rows).
3. The process by layer and a `views.md` (§8) (undo: bars-study stays the home).
4. Nothing added to §1 or §6.

## 10. The card of a thing (checked 20 Nov against the rules the Oggi and Elenco rebuilds used)
The Oggi and Elenco cards were built on VIS-40…43 (one Box: icon · title · value or voto chip ·
one action; silhouettes; the drawing in the corner; the chip), PAT-30…33 (one object page, one
voce header, a voce in two levels, the context line) and target.md §2–§4 (one type drawn one
way; B1–B8). In the four layers the **Box is the card of a thing in layer 3**: the same in Il
tempo (frame day) and in Le cose (frame own), its instruments inside it from the engine, its
levels the engine's levels. Not a place's drawing: the convergence target.md started, finished.

## 11. Time decides the state (his 20 Nov, proposal §108)
His words: «ogni cosa che si mette in un orario successivo a tot minuti è obbligatoriamente
pianificato, qualcosa che si mette prima o adesso è sempre già fatto… quindi in teoria possiamo
togliere i bottoni… e se si mette qualcosa fuori orario? … sempre pianificata finché non viene
eseguita… cosa debba poter rimanere fuori orario come eccezioni?»
- **After now** (beyond the slack): **previsto**, always. Built: MOD-15 (his 15 Nov), one minute
  of slack (`statusAt`).
- **Now or before**: **fatto**, always — new; today a form can still save a past time as previsto.
- **No buttons**: «Adesso · Previsto · Prima» (PAT-60) and «Mangiato · Previsto» (the composer's
  «Quando») go; the time alone says it. «Saltato» stays a verb on a previsto (MOD-13's «Fatto»
  becomes: setting its time to now, or tapping it).
- **No time**: **previsto until done** — doing it gives it the time it was done.
- **Exceptions that stay without a time**: the «amount to reach» shape (target.md §6, settled 17
  Nov): passi, acqua, an assunzione «al giorno» — a day's sum, not an instant.
- **Settled, his 20 Nov (proposal §109):** the **slack** is a setting, **20 minutes** by default; a
  **past previsto never done** follows a setting — **saltato** (default) · **da confermare** ·
  **confermato** (counted as fatto at its planned time); **no exceptions** for now: everything
  without a time is previsto until done (the «amount to reach» is the target, its voci have times).
- **Previsti in a folded part of the day**: a folded sky band shows its voci's icons (today only the
  fatti); a previsto's icon is the same **drawn dashed** (VIS-22's outline for previsto), so a
  folded part says what is still to come.

## 12. Activities and movement, refactored (his 20 Nov; found in his earlier words)
His words today: a refactoring «delle attività in generale, esercizi, percorsi, monitoraggio del
movimento (tutti dati funzione dei momenti che vengono usati nel calcolo dell'effettiva
sedentarietà della giornata, settimana, mese…)». Found before: **29 Oct** (energy dossier, his
«dovrebbe essere tutto dinamico, anche passi… 2, 5, 8+ ore di movimento o sedentarietà mi sembra
incomprensibile, dovrebbero esserci più fasce»); **3 Nov, BODY-31** («i tragitti come si
collegano ai passi giornalieri? … una cosa in range orario… i passi dovrebbero essere considerati
al netto di quelle comprese nelle fasce orarie coperte»); **BODY-27** (routes and trips, «a
vertical movement layer by time bands considered»); engines.md «sedentary time and time on one's
feet» from the day's blocks.
**One model, in the four layers:**
- **Things**: movement is **windows of time** on the day. A window is covered by a measured source
  (the watch or phone's steps in that span, a trip, a session, a walk) or estimated (incidental).
  An activity (session, trip, run, chore) is a voce with a span that **details** the window it
  sits in, never adds to it (BODY-31). Steps are readings of a window, or a day's total when no
  window is known.
- **Measures**: per window, **moving · on one's feet · seated**; per day, week, month the
  **sedentary time** and its longest stretch, hours on one's feet (the everyday factor, continuous
  — his «più fasce»), steps, the energy each piece burned (E4a).
- **Views**: the **rhythm rail** carries the windows as a band beside the voci (moving, standing,
  seated by shade; the activity's own colour where one details it); **reach** for steps and time
  on one's feet; **trend** and **spread** of sedentary time over the period.
- **Places**: none of its own — Il tempo at any window.
Product.md §4's «not now: step windows and a vertical movement layer» (x05, 6 Nov) is dropped by
his «yc» of 20 Nov (§109). **Order**: after the instruments, «sempre in mente e pensando a come le
due cose si influenzano» — the rail's design leaves room for the movement band.
**Typed by hand, until lifeos is a real app (his draft, «magari fallimentare, ci ripensiamo dopo
con calma»):** a **lane parallel to the time rail**; a tap on it at an hour adds a **quantum** of
measured movement (a number of steps, or minutes of walking) at that time — no page, no sheet, no
room taken; the quanta enter the timeline as movement windows, aggregated where they are near;
the lane grows **denser** where more quanta sit. A web app cannot read the phone's steps in the
background (BODY-32), so this is the source until then.

## 13. Settled (his 20 Nov, proposal §109)
1. §11: slack 20 min, a setting; a past previsto: saltato · da confermare · confermato, a setting,
   saltato by default; no exceptions for now; dashed icons for previsti in a folded part.
2. §12: the movement model after the instruments, designed with them in mind; the lane of quanta
   as a draft to rethink.
3. Product.md §4: «step windows and a vertical movement layer» leave «not now».

## 14. What his answers change in the frame (his «sicuro che non dobbiamo fare un reframing di nuovo
in luce di queste cose?», 20 Nov, proposal §110)
Not a new frame; two changes at its base:
1. **The state is derived from time, not chosen** (§11). Previsto · fatto is a function of the
   voce's time against now (+ the slack); only **saltato** and **confermato** are acts. So Il tempo
   is one rail split by **now**: the past is what happened, the future what is planned — the Piano is
   not a mode of the rail, it is its right side (§32 made literal). Layer 1 stores a time and the
   two acts; the state is a measure (layer 2).
2. **The timeline holds two kinds of thing**, where §2 said one:
   | Kind | What | Today, each drawn its own way | Drawn as |
   |---|---|---|---|
   | **voce** | an event or a span: a meal, a session, a night, a trip | Boxes on the rail | the Box on the rail (§10) |
   | **signal** | a level that changes over time, measured or derived | caffeine left (FD-61, a pill), creatine stores (FD-63, words), daylight (the sky bands, VIS-61), the weather (VIS-75), sleep as a state, **movement density** (his quanta, §12) | a **lane beside the rail**: one look for every signal (a band whose density or height is the level), on the same time axis |
   Layer 1 gains **signals**: typed (his movement quanta), measured (a watch, later), or derived
   from voci (caffeine from coffees, stores from doses, sedentary time from windows). A signal is
   a registry entry like a type (PRD-03): a new one gets its lane with no new drawing.
**What follows:** the rhythm instrument (§21.3) is the **rail with its lanes**; the movement model
(§12) is the first signal built by hand, and it is why the instruments and movement «si
influenzano» (§109.4): the rail is designed with lanes from the start. The four layers, the two
spaces and the presets stand.

## 15. Everything in place: no ⊕, no Aggiungi page (his 20 Nov, proposal §112)
His words: «molte modifiche e aggiunte… on place negli stessi posti in cui si visualizza… togliessimo
quell'orribile bottone + e quella pagina aggiungi… cose a comparsa e barre di ricerca a comparsa…
ma non che coprono… a scorrimento verticale e orizzontale se serve».
**Is it a new frame?** No: §4 already says «the instrument is the control» and PRD-11 says «edit
where you read». This adds the missing half — **you add where the thing will show** — and makes
the grammar one sentence: **read, change and add in the same spot.** What it removes is large:
⊕ on every page (PAT-01, PAT-10), the Capture sheet (PAT-60), the Aggiungi page and its sheets,
ADR-0063's «⊕ belongs to the place».
**Each case, in place (nothing covers the page; what appears pushes the rest down or slides
sideways):**
| He wants to | Where it happens | What appears there |
|---|---|---|
| change an amount (an ingredient, a drink, a set) | on the number itself | the number becomes a stepper in its row (PAT-13's InPlace, already built) |
| add an ingredient to a meal | at the end of the meal's lines, inside its card | a search row opens there; results as rows under it, a tap adds |
| add a voce at a time | on the rail, at that time (a gap, or «adesso») | a search row opens in the gap; ranked suggestions for that hour first (today's «Per te», PAT-60's ranking kept) |
| add something with no time yet | «Senza orario» at the day's end | the same search row |
| add a kind of thing to the timeline (a new tracker, a category) | at the end of the search's results, «Nuovo tipo» | the type's fields open in the row (MOD-01: a registry entry) |
| see more options than fit | the row scrolls **sideways** (chips, ranked rows); a long list scrolls **down** inside its card | — |
**Kept:** the ranking of what he logs at this hour (the best of today's ⊕), one `Find` (PAT-41),
«Al volo» as the shortest path for the few he takes daily (creatina, caffè, acqua), the time
deciding the state (§11). **Le cose** (the catalog) follows the same rule: a new cibo is added at
the end of its list, in place.
**His to settle:** (1) this direction, and that ⊕ and the Aggiungi page go; (2) whether «Al volo»
stays as the one shortcut; (3) when: before the instruments (it changes every card's edit state)
or after them. Recommendation: (1) yes; (2) yes; (3) **with** the instruments, card by card — the
card's levels and its edit state are one design, so each card is built once.
