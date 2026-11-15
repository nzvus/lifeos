# Delta — five places by action (ADR-0063)

## MODIFIED
- **PRD-16** (product.md §2) One map: five places by action around Oggi; the area is a filter |
  P7, ADR-0063
- **PAT-01** (patterns.md §1) One `(app)/layout.tsx` holds NavBar (Elenco · Piano · Oggi ·
  Andamento · Obiettivi, Oggi the middle item and the start page) on every page; pages never mount
  it. ⊕ floats above the bar's corner on every page and opens the one Capture (PAT-10, PAT-60;
  his «yc», 14 Nov). WHEN a sticky «Salva» is on the page (PAT-14, PAT-61) THEN it sits just above the bar.
  One exception: a running gym session is full screen, left with «Finisci» or «‹ Oggi». On desktop
  the bar is a side rail, same five, same order. Kit: `NavBar` ✗ (today: the five areas, ⊕ in the
  layout). [ADR-0063]
- **PAT-03** (patterns.md §1) A place = one page that answers one question over every type:
  Elenco «Cosa ho?», Piano «Cosa farò?», Oggi «Cosa sto facendo?», Andamento «Come sta andando?»,
  Obiettivi «Dove vado?». Each is a registry-driven view; WHEN a type has nothing in a place THEN it
  has no line there (no empty page, no empty tab). The four tabs are gone. Kit: `AreaTabs` removed
  ✗. [ADR-0063]
- **VIS-40** (visual.md §5) One Box for every item. Head = icon · title · value or score chip ·
  at most one short action; more, or a long one, on their own line bottom right. A Box that opens
  has levels («Oggi a livelli», his «ap yc», 14 Nov): closed = the head and one thin strip (a
  meal: where its energy comes from, each macro in its colour, as long as its share of the day's
  kcal) and the line's actions; open = what it says (the costliest part, the sub line, the pills,
  the four thin bars) and a row of doors, «Voto» first, then «Nutrienti», «Cibi n», «Costo» —
  WHEN he taps a door THEN its panel opens below and any other closes; a door with nothing behind
  it is a plain chip. `card` (L3) or `row` (L4). Kit: `Box` (`doors`) ✓.
- **VIS-61** (visual.md §7) Parts of the day as sky bands, as today, and a band that holds
  something closes («Oggi a livelli» step 4, his «ap yc», 14 Nov): WHEN he taps it THEN its voci
  hide behind it and it says how many and their kcal, with their icons («6 voci · 976 kcal»; at
  ≤ 380 px the kcal only); a second tap opens it. At first only the part where now is (a day
  gone: the last one holding something) is open. Kit: `DayPart` (`onToggle`) ✓.
- **VIS-43** (visual.md §5) Score chip: closed = unframed skyline coloured by band + the number in
  its band's colour, **no word and no line under the head** (his 15 Nov: «"è costata di piu" non
  mi serve, lo posso vedere dai voti»; F1 of 13 Nov). Open: one ruler per criterion. The word
  stays in the chip's label for screen readers. Kit: `Box` ✓.
- **VIS-52** (visual.md §6) The zones ruler under every judged bar — macros, limits, kinds and now
  **kcal** — with no word beside the number: «le parole "ok", "pessimo" eccetera non le voglio…
  ci sono gia le barre grafiche e i numeri e i colori e le forme» (his 15 Nov). Kit: `Nutrients` ✓.
- **FD-31** (domains/food.md) A row for the day's kcal, the app's edges (FD-30 «*»), against the
  day's target T: pessimo < 0.9 T · ok 0.9–0.95 T · **ottimo 0.95–1.05 T** · ok 1.05–1.1 T ·
  pessimo > 1.1 T · da evitare > 1.25 T* (his 15 Nov: «la barra delle calorie dovrebbe colorarsi
  anche lei in base ai range»). `kcalRange` in `core/engines/targets/ranges.ts`.
- **PAT-51/§3** Where the day's targets come from («dispendio ≈ … per il ritmo dell'obiettivo»)
  is said once, in Obiettivi, not under «Il giorno» (his 15 Nov).
- **PAT-74** (patterns.md §7) The toast: one at a time above the bar, 5 s, «Annulla» and at most
  **one other choice** when the act had two sensible outcomes: after «Fatto» on a previsto that
  took the tick's time, «tieni le 20:00» puts the planned time back (still fatto); «Annulla»
  after it swaps again (proposal §23 Q2, his «yc» 15 Nov). Choices never wrap. Kit: DayView's
  toast ✓ (`swapPlannedStart`, `core/entries/write.ts`).
- **MOD-30…32, MOD-36** (model.md §3) Planning by **giornata tipo** (his «yc» on Q1 (a), 15 Nov;
  his 14 Nov «creare magari dei prototipi di giornata magari da mettere in ciclo… pianificare
  qualsiasi cosa»). A **giornata tipo** is a ciclo's step: its lines are its blocchi «nel ciclo»
  (Q-18 (a)), each any voce type or object (a pasto, a scheda, creatina, a pesata, a tracker)
  with its time (and, to build, its time mode «fissa» · «quando capita»); no new type, no new
  table, no migration. A **ciclo** says which giornata tipo falls on which day; one used every
  day is a ciclo of one step. `core/plans/day-type.ts` `saveDayToStep`. WHEN he taps
  «Salva come giornata tipo» on a day THEN its voci become the lines of a new one. The word
  «blocco» leaves the screens; a line is a «riga» of its giornata tipo. Kit: ✗.

## ADDED
- **PAT-95** (patterns.md §1) The area filter: one row of chips, «Tutto» · Cibo · Corpo · Mente ·
  Soldi, under the header of every place but Oggi, which filters by kind with its own chips
  (his «yc», 14 Nov). WHEN he taps a chip THEN the place shows only that area's
  types and ⊕ offers them first; WHEN he changes place THEN the chip stays. An area is never a
  page. Kit: `AreaFilter` ✗.
- **PAT-97** (patterns.md §1) A future day is planned in Piano, with the same lines as a real day,
  each saying where it comes from (blocco, ciclo, «solo questo giorno»). WHEN he taps a future date
  in Oggi's week strip THEN that day opens in Piano; WHEN the day comes THEN its lines are Oggi's
  «previsto» voci. WHEN the day is to come THEN every part of it shows, an empty one as a gap
  that offers what is missing («+ Pranzo»), and every part starts open. Kit: `DateNav`
  (`futureBase`) ✓; the day is Oggi's `DayPage` in Piano's frame.
- **PAT-98** (patterns.md §3) A voto is shown as its number in the judgement's colour, with no
  word beside it; WHEN the app cannot score (PRD-23) THEN «–», the reason in its «Perché?». Kit: ✗.
- **PAT-99** (patterns.md §6) The dock: one strip stuck above the bar on Oggi, at every scroll
  position: the water drunk with +250 and +500, then what he pinned, in his order, then the
  app's guesses up to four chips, sideways. WHEN he taps «Modifica» THEN a sheet lists the pins («Su»,
  «Togli») and the other «assunzioni» («Fissa»); each tap saves. Pins live in his settings. Kit: ✗.
