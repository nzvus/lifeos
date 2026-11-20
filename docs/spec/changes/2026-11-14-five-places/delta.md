# Delta — five places by action (ADR-0063)

## MODIFIED
- **PRD-16** (product.md §2) One map: two spaces — Il tempo (one timeline: window and position
  are actions) and Le cose (the catalog) — and the bar's five places by action (ADR-0063) as their
  presets; the area is a filter | P7, ADR-0063, reframe §3 (his «yc per ora», 20 Nov)
- **PRD-03** (product.md §1) … a new kind of thing is a registry entry, and a new kind of view an
  engine entry (MOD-56), never a new page or a page's drawing | reframe §7
- **PRD-19** (product.md §2) Everything one tap away, never everything in view; as many levels as
  the data has (drill), at most two in view at once | his §99, reframe §7
- **PRD-20** (product.md §2) Fewer written numbers, more information in channels (condense as much
  as possible without losing comprehensibility or beauty, his §100); each number with its
  «Perché?» | reframe §7
- **MOD-15** (model.md §2) The time decides the state: after now (beyond the slack) a voce is
  previsto, at now or before it is fatto, whatever was tapped; no control asks it (PAT-60's
  «Adesso · Previsto · Prima» and the composer's «Mangiato · Previsto» go); a voce with no time is
  previsto until done (no exceptions for now). The slack is a setting, 20 minutes by default; a
  past previsto never done follows a setting: saltato (default) · da confermare · confermato. In a
  folded part of the day a previsto's icon is drawn dashed | his 15 and 20 Nov, reframe §11 —
  Today: built (`core/entries/timing.ts`, `core/account/timing.ts`, `readDays`; proposal §111)
- **product.md §4** «Not now» loses «step windows and a vertical movement layer» (movement
  refactored, reframe §12) | his «yc», 20 Nov
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
  it is a plain chip. `card` (L3) or `row` (L4). The icon is centred on the head and its meta line
  while the box is shut, and sits on the title's line when open (his 16 Nov «centrare le icone
  ogni volta invece di metterle in alto»; proposal §53–§54, waiting for his word on the
  photos). Kit: `Box` (`doors`) ✓.
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
  day is a ciclo of one step. `core/plans/day-type.ts` `saveDayToStep`. Words (product.md §3,
  edited with this change): «giornata tipo» and «riga» get their row; «blocco» leaves the
  screens (Elenco, Piano's header, the ciclo's editor, the scores' «adatto al piano») and is
  forbidden once the last form of a loose blocco goes. WHEN he taps
  «Salva come giornata tipo» on a day THEN its voci become the lines of a new one. The word
  «blocco» leaves the screens; a line is a «riga» of its giornata tipo. Kit: ✗.
- **PAT-30** (patterns.md §3) One piece per catalog type at three levels (his «ap yc», 15 Nov, on
  `target.md`; his «riusare le schede che si usano in oggi»): 0 the row = `Box` closed (icon ·
  name · one value · score chip), in every list, search, ⊕, «Usato in», a pasto's cibi, Marche,
  Dispensa; 1 the same Box open in place, its doors one at a time, a value edited by a tap
  (PAT-13); 2 the page = the same open box alone, plus «Altro» (PAT-23). A pasto in the Elenco and
  a meal on the day are one box: the day adds quanto, quando and status (PAT-31, VIS-22). A type
  has one renderer and one editor; a second one fails the guard (PAT-90). A cibo's label values
  sit behind the door «Etichetta», closed at first. Kit: `ObjectPage` ✓, the shared box ✗.
- **PAT-43** (patterns.md §4) In an Elenco, WHEN he taps a row THEN it opens in place (PAT-30
  level 1) and «Apri» goes to its page. Children are nested under their parent (MOD-21): a cibo's
  marche, each with its formati; a pasto's varianti. Marche and formati have no shelf of their own.

## ADDED
- **MOD-56** (model.md §6) **Motore di visualizzazione**: every number drawn in the app is a
  *measure* (registry) × a *frame* (own · day · session · period, chosen by the page; «session» =
  the span of any activity) × a *level* (0 · 1 · 2); the engine reads the data, its references
  (target, fascia, goal, past self, mean, record) and the page's request (frame, grouping, level,
  drill · roll up · slice · pivot · compare), applies one set of rules (bars-study §16–§18) and gives
  a view that only kit pieces draw. WHEN a page draws a number outside it THEN the lint fails (once
  the guard is built). One hierarchy: class › type › object › part. [his 20 Nov, proposal
  §88–§94]
- **MOD-57** (model.md §1) Every type and tracker has a **class** — intake · activity · state ·
  measurement · exchange · note · context — and every field a **reading** the engine knows
  (number → amount; duration → time; scale → rating; boolean → done; choice → category; text →
  presence; lines → composition; a voto → score), each with its aggregates over a frame; a measure
  may read as **yes / no** whatever its field (a fixed-dose intake, a habit, a goal «n volte»;
  bars-study §19.1, his «yc» 20 Nov). WHEN a
  built-in type has no class THEN a test fails; a tracker takes its class from its family. [his
  20 Nov «cosa altro?», proposal §93–§94]
- **PAT-95** (patterns.md §1) The area filter: one row of chips, «Tutto» · Cibo · Corpo · Mente ·
  Soldi, under the header of every place but Oggi, which filters by kind with its own chips
  (his «yc», 14 Nov). WHEN he taps a chip THEN the place shows only that area's
  types and ⊕ offers them first; WHEN he changes place THEN the chip stays. An area is never a
  page. Kit: `AreaFilter` ✗.
- **PAT-97** (patterns.md §1) Oggi holds every day, and what it shows follows the time: a past day
  what happened, today done before now and planned after it, a day to come only what is planned —
  each line saying where it comes from (its ritmo as a tag, else «solo questo giorno»), every part
  shown, an empty one as a gap that offers what is missing («+ Pranzo»). Piano holds only what
  repeats — the ritmi as the kit `Elenco` (`PianoList`, the same page for Oggi and each area) —
  and no days. [his 15 Nov «la pagina piano non ha senso nei giorni passati, mentre quella oggi
  non ha senso per quelli futuri, quindi tanto vale unirle», «in piano a questo punto è inutile
  avere le giornate o cose simili»; proposal §38, §42–§43] Kit: `DateNav` ✓, `Elenco` ✓;
  `futureBase` no longer used.
- **PAT-98** (patterns.md §3) A voto is shown as its number in the judgement's colour, with no
  word beside it; WHEN the app cannot score (PRD-23) THEN «–», the reason in its «Perché?». Kit: ✗.
- **PAT-99** (patterns.md §6) The dock: one strip stuck above the bar on Oggi, at every scroll
  position: the water drunk with +250 and +500, then what he pinned, in his order, then the
  app's guesses up to four chips, sideways. WHEN he taps «Modifica» THEN a sheet lists the pins («Su»,
  «Togli») and the other «assunzioni» («Fissa»); each tap saves. Pins live in his settings. Kit: ✗.
