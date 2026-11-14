# ADR-0063: Five places by action, Oggi in the middle, the area is a filter

**Status:** accepted (by «yc», 13 Nov 2026: Claude's recommendation taken on the names, the order
and where a future day is planned; undo: set this ADR to «superseded» and ADR-0059 back to
«accepted» — no code follows this ADR until the drawings are approved)
**Date:** 2026-11-14

## Context
ADR-0059 (30 Oct) gave the bar to four areas (Corpo · Cibo · Oggi · Mente · Soldi), each with the
same four tabs. The user asked for that symmetry, then used it: 13 Nov, on the four tabs, «sono
ridondanti per ogni pagina no? lo avevo chiesto io per avere simmetria ma capisco sia eccessivo, le
pagine adesso funzionano o da filtro di Oggi o da archivio o altre funzioni ed è molto
confusionario». The map of places counted it: of 20 pages (5 places × 4 tabs) 8 are a place of
their own, 4 are Oggi filtered, 8 are nearly empty. Shown three bars, he picked the one by action
(W-05): «preferisco 1 per azione, ma magari fatto meglio… è più espandibile, inoltre il + centrale
si può togliere, oggi va al centro, e magari mettiamo 2 pagine per lato». The bar fixes every URL
and what he meets first, so it is decided before the screens are redrawn (W-04: «ricostruire tutto»).

ADR-0054 already tried places by action and ADR-0059 replaced it, because one object lived in three
or four places and sub-pages hid behind text links. This ADR goes back to actions only with the
answer to that: an object still has one page (PRD-10, PAT-04); a place is a question about objects,
never a second home for one.

## Options considered
### A. Keep the areas, drop the empty tabs
- Pros: least change; the routes exist.
- Cons: the bar differs per area (Soldi has one tab, Cibo four); a goal or a plan that crosses
  areas has no home; he rejected it on the map.
### B. Five places by action: Elenco · Piano · **Oggi** · Andamento · Obiettivi; the area is a filter
- Pros: every place answers one question (Cosa ho? · Cosa farò? · Cosa sto facendo? · Come sta
  andando? · Dove vado?); no empty page; a new area or type is a filter chip and a shelf, the bar
  never changes; goals, 8 in his data and on no screen together today, get a place; Oggi is in the
  middle and ⊕ leaves the bar, as he asked.
- Cons: every route under `[area]` moves; «everything about food» is a filter over four places, not
  one page; the ADR-0054 risk if a place starts keeping its own copy of an object.
### C. Four places, goals inside Andamento
- Pros: one place less to learn.
- Cons: Oggi cannot sit in the middle with two a side, which he asked for; a goal is both a target
  and a rule («come vengo giudicato»: the weights of the voto), which is not a chart.

## Decision
**B.** He picked the bar by action; B is that pick with the fifth place he said was missing
(«oltretutto ce ne vorrebbe un'altra»), and the only option where no page is empty.

Rules:
- **The bar**, left to right: Elenco · Piano · **Oggi** · Andamento · Obiettivi. Left of Oggi is
  what he prepares, right is what he learns. Oggi is the middle item and the start page.
- **The area** (Cibo · Corpo · Mente · Soldi) is a row of filter chips, «Tutto» first, the same in
  every place. It filters; it is not a page.
- **⊕ belongs to the place**, in its header, with the place's verb: Elenco «Nuovo» (an object),
  Piano «Prevedi» (a planned voce or blocco), Oggi «Aggiungi» (a voce now), Andamento «Tracker»,
  Obiettivi «Obiettivo». No central ⊕ on the bar.
- **A future day is planned in Piano.** Oggi shows today and the past; tapping a future date in
  Oggi's week strip opens that day in Piano. One planner, so a day's plan and the long-term plan
  (blocchi, cicli) are edited in the same place.
- **One object, one page** stays (PRD-10): the places list and open objects, they never copy them.
  Object addresses (PAT-04) are not changed by this ADR.
- Settings stay behind the profile icon. Desktop: the bar is a side rail, same five, same order.

Tripwire: if he keeps opening one area's filter in every place, or a place grows a second page
template, revisit with A's per-area view as a saved filter.

## Consequences
- Supersedes ADR-0059's bar and its four tabs; ADR-0059's areas stay, as a property of a type and
  a filter. PRD-16, PAT-01 and PAT-03 are rewritten by change `2026-11-14-five-places`.
- The kit loses `AreaTabs` and gains the area filter; `NavBar` gets the five places; ⊕ moves from
  the layout into each place's header.
- Routes under `(app)/[area]` for Diario · Piano · Elenco · Andamento move to five place routes,
  with redirects from the old URLs.
- Obiettivi is a new screen over data that exists (targets, the voto's weights).
- Nothing is built before the user approves each place drawn in depth on the one grid
  (https://claude.ai/artifact/NZ96SciMLkM1pWy9V4AzgQ is the five at rest).

## What I learned
