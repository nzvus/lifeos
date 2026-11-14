# Delta — five places by action (ADR-0063)

## MODIFIED
- **PRD-16** (product.md §2) One map: five places by action around Oggi; the area is a filter |
  P7, ADR-0063
- **PAT-01** (patterns.md §1) One `(app)/layout.tsx` holds NavBar (Elenco · Piano · Oggi ·
  Andamento · Obiettivi, Oggi the middle item and the start page) on every page; pages never mount
  it. The bar has no ⊕: WHEN a place is open THEN its header carries ⊕ with the place's verb
  (PAT-96). WHEN a sticky «Salva» is on the page (PAT-14, PAT-61) THEN it sits just above the bar.
  One exception: a running gym session is full screen, left with «Finisci» or «‹ Oggi». On desktop
  the bar is a side rail, same five, same order. Kit: `NavBar` ✗ (today: the five areas, ⊕ in the
  layout). [ADR-0063]
- **PAT-03** (patterns.md §1) A place = one page that answers one question over every type:
  Elenco «Cosa ho?», Piano «Cosa farò?», Oggi «Cosa sto facendo?», Andamento «Come sta andando?»,
  Obiettivi «Dove vado?». Each is a registry-driven view; WHEN a type has nothing in a place THEN it
  has no line there (no empty page, no empty tab). The four tabs are gone. Kit: `AreaTabs` removed
  ✗. [ADR-0063]

## ADDED
- **PAT-95** (patterns.md §1) The area filter: one row of chips, «Tutto» · Cibo · Corpo · Mente ·
  Soldi, under the header of every place. WHEN he taps a chip THEN the place shows only that area's
  types and ⊕ offers them first; WHEN he changes place THEN the chip stays. An area is never a
  page. Kit: `AreaFilter` ✗.
- **PAT-96** (patterns.md §1) ⊕ belongs to the place and says its verb: Elenco «Nuovo» (an object),
  Piano «Prevedi» (a voce previsto or a blocco), Oggi «Aggiungi» (a voce now, PAT-10), Andamento
  «Tracker», Obiettivi «Obiettivo». Same corner of the header in all five. Kit: ✗.
- **PAT-97** (patterns.md §1) A future day is planned in Piano, with the same lines as a real day,
  each saying where it comes from (blocco, ciclo, «solo questo giorno»). WHEN he taps a future date
  in Oggi's week strip THEN that day opens in Piano; WHEN the day comes THEN its lines are Oggi's
  «previsto» voci. Kit: ✗.
- **PAT-98** (patterns.md §3) A voto is shown as its number in the judgement's colour, with no
  word beside it; WHEN the app cannot score (PRD-23) THEN «–», the reason in its «Perché?». Kit: ✗.
