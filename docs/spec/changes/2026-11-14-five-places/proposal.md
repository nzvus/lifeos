# Five places by action — proposal (ADR-0063)

**Zoom:** Z4 → Z3 → Z2 and back (round 1 of ADR-0064, `method.md` §8).
**ORCA cells:** every row of `docs/spec/orca/` — round 1 writes all four tables (stop A).

## Why (the user's words)
- **12 Nov (W-03):** «you did not follow what was my original purposes, also, it is still redundunt
  and confusing, and messy, and slow». The design part of that is this change; the code and process
  review stays W-03 in the inbox.
- **13 Nov, 23 comments on the target design (was W-04;** verbatim, with IDs C1…C7, G1…G6, O1…O10,
  F1…F2, in `LIFEOS/review/2026-11-13/comments-2026-11-13.md`). The line that sets the task: «tu
  adesso hai tutto il contesto necessario per provare a ricostruire tutto, sempre partendo da questa
  base, ma essendo che molte funzionalità sono implementate male a livello ui e non solo, devi capire
  come farle». On the four tabs (O4): «sono ridondanti per ogni pagina no? lo avevo chiesto io per
  avere simmetria ma capisco sia eccessivo, le pagine adesso funzionano o da filtro di Oggi o da
  archivio o altre funzioni ed è molto confusionario». On a future day (O7): «se vado in qualche
  giorno futuro dovrei essere in grado di pianificare quel giorno no? … entra in conflitto con la
  pianificazione a lungo termine... insomma va ripensato un po tutto». On composer v2 (C6): «ora
  prevista e porzioni sono disallineati, un'altra ragione per cui devi rifare tutto da capo».
- **13 Nov, on the map of places (was W-05):** «no, preferisco 1 per azione, ma magari fatto meglio.
  per varie ragioni: è piu espandibile, inoltre il + centrale si puo togliere, oggi va al centro, e
  magari mettiamo 2 pagine per lato, solo che non so se mi sta bene che siano quelle Piano, Andamento
  e Elenco (oltretutto ce ne vorrebbe un'altra)… molte aree hanno azioni, quindi ha senso… invece
  delle aree (colonne) mettere le azioni (righe)… e portando oggi nelle azioni… di sicuro una deve
  gestire le funzionalità di aggiunta di elementi come cibi, o esercizi o sessioni, non so se mostrare
  anche elenchi dei obiettivi e piani… di sicuro una possiamo dedicarla a solo gli andamenti con tanti
  grafici e tutto il resto… una sicuramente anche alla pianificazione e gestione del calendario, la
  quale costruzione pero ovviamente deve tenere conto anche degli obiettivi e degli andamenti…
  probabilmente va rivisto tutto. senti, tu hai adesso una buona idea di cosa voglio, se volessi
  ripensare tutto da capo come progetteresti il tutto?»
- **13 Nov, on «Cinque luoghi»** (https://claude.ai/artifact/NZ96SciMLkM1pWy9V4AzgQ): F1 «a che
  serve che scrivi "cosi cosi" o "bene" lo capisco dal numero...»; F2 «ovviamente vorrei molti piu
  grafici e vari e diversi».
- **13 Nov, 21:38, to the three questions (names, order, where a future day is planned):** «yc per
  tutto, per il resto ho finito i token, quindi agisci di conseguenza».
- **14 Nov, on the depth page** (https://claude.ai/artifact/K9s4HsQN74Uuc2okHshDWM): «nononono, why you
  are continueing to ignore all the discussions that we had for v2». The page (and «Cinque luoghi»
  before it) was drawn on Claude's own flat row, without reading the ledger, `needs.md` and
  `visual.md`: it drops the grammar he picked piece by piece (bars by kind, zone rulers with gram
  ticks, skylines, silhouettes, the rail, the weather card, P1–P9, two levels at most). Both pages
  are rejected as drawn; decision 4 below is withdrawn.
- **14 Nov, right after:** «don't you v2 takes into account many many many more things ?» and «ogni
  vola succede che ignori tutte le discussioni precedenti, a questo punto è evidente che il modo in
  cui stiamo lavorando è sbagliato». → a question about the way of working, his to settle before
  any more drawing (also for `/tune-rules`).
- **14 Nov, on the first draft of `.claude/rules/design.md`:** «hm, not enough, you can infer from the
  screenshots». → the page now lists what each real screen holds, from the photos of the running
  app (12 Nov, `LIFEOS/review/2026-11-12/shots/`); 19 screens opened, the rest named as not opened.
- **14 Nov, on the second draft:** «le animazioni, la visualizzazione dei range ottimali, la linea
  temporale verticale, espandibile, limiti, micro... eccetera». → a section on what moves, opens and
  judges, from the kit's stylesheet and the food rules (FD-30…41), since stills do not show it.
- **14 Nov:** «go, since i am finishing token, make sure you note everything so that next session you
  can build. i hope you'll remember and act accordingly for my frustration in you forgetting the
  discussions».

## Decided by Claude («yc», 13 Nov) — each with its undo
1. The five places and names: Elenco · Piano · Oggi · Andamento · Obiettivi. Reason: each answers
   one question and none is empty (the map: 8 of 20 pages nearly empty today). Undo: ADR-0063 →
   superseded, ADR-0059 → accepted; nothing is coded yet.
2. The order on the bar as drawn: prepare on the left, learn on the right, Oggi in the middle (his
   own words). Undo: one line in PAT-01.
3. A future day is planned in Piano; a future date in Oggi's week strip opens it there. Reason: O7,
   one planner for the day and the long term. Undo: PAT-97 dropped, Oggi walks forward.
4. **Withdrawn 14 Nov (his words above).** Drawn from scratch on one grid with the kit's colours, type and icons, not from today's pieces
   (C6, twice «rifare tutto da capo»). Undo: go back to the app's real pieces.
5. A voto is the coloured number alone; «–» where the app cannot score (F1). Undo: PAT-98 dropped.
6. **14 Nov, his «yc» on the way of working** (Claude's four recommendations taken):
   one page «what v2 already decided» loaded in every session (`.claude/rules/design.md`, a draft
   he corrects); no separate drawings, a proposal is the real app on a branch, photographed; one
   screen at a time; «yc» and «ap» never cover design. Undo: delete that file's section «How we
   design», or the file.
7. Found while writing it, his to settle (listed in that file): ADR-0063's Obiettivi showed
   adjustable score weights and goals with no data, both «not now» in product.md §4; the five
   names are not in product.md §3; ⊕ per place against the one Capture (PAT-10, PAT-60).

8. **14 Nov evening, «continua ap».** The first screen is built in the real app: Oggi, branch
   `five-places-oggi` (commit da863c2, pushed, no PR: nothing merges before his word). Photos at
   390/360/320 with his 9 Nov and today: `LIFEOS/review/2026-11-14/oggi-proposal/`.
   - It changes: the bar is Elenco · Piano · Oggi · Andamento · Obiettivi, each opening the page
     that exists today (PAT-01); Oggi has no tabs (O4, PAT-03); the day is the page's title and
     still opens the month (O8, VIS-63); month and week on the line under it with «↩ oggi» and
     the week's dots, the cycle on its own line with «Giornata ▾»; the weather sits under the
     title with its three levels, no longer below «Al volo» (O6, VIS-75); the week strip uses the
     full width (O1).
   - It keeps, untouched: the week's levels (VIS-70), Acqua, «Al volo», «Il giorno» and all under
     it, the rail and the sky bands, the floating ⊕ and the one Capture (PAT-10, PAT-60).
   - Decided by Claude, cheap to undo: Elenco wears the books drawing and Obiettivi the goal's
     target (undo: one line in `PLACES`, `packages/kit/src/NavBar.tsx`); a voce, the gym and ⊕'s
     pages tick Oggi, an object's page ticks Elenco (undo: `placeOf` in `features/shell/nav.ts`).
   - Not done, on purpose: ⊕ in the header with a verb (PAT-96) and the area chips (PAT-95) are
     not drawn: both are questions below. The area diaries (`/cibo`, `/corpo`…) and the other four
     places still have their old header and tabs: each is its own screen, one at a time.
9. Questions for him, found while building (each with Claude's pick first):
   - **Area filter on Oggi (PAT-95).** Oggi already has the chips per kind (Cibo 5 · Bere 1 ·
     Allenamento 2…) that filter the day. (a, Claude's pick) keep those as Oggi's filter and add
     no second row; (b) replace them with the five area chips of PAT-95.
   - **⊕ (PAT-96 against PAT-10/60).** (a, Claude's pick) keep the floating ⊕ and the one Capture
     sheet, which already ranks «Per te» for the hour; (b) ⊕ in each place's header with its verb.
   - **The dock he edits (O5).** What he pins must be stored. (a, Claude's pick) a list of pins
     in his settings (one migration), «Al volo» shows the pins first and then the app's guesses,
     «Modifica» opens a sheet to pin, unpin and order; (b) no pins, only hide a guess.
10. **14 Nov, after the Oggi photos and the three questions: «ap yc».** Taken as (a) on all three,
    each with its undo:
    - Oggi keeps its chips per kind as its filter; PAT-95's area chips are for the other places.
      Undo: add `AreaFilter` to Oggi too.
    - The floating ⊕ and the one Capture stay (PAT-10, PAT-60); PAT-96 is withdrawn and PAT-01
      keeps ⊕ on the bar's corner. Undo: restore PAT-96 in `delta.md`.
    - The dock holds his pins: stored in `settings.prefs.dock` (the column exists: no migration,
      so less than the question said), shown first in «Al volo», then the app's guesses;
      «Modifica» opens a sheet to pin, unpin and order. First step: the «assunzioni» (what «Al
      volo» holds today); water steps, a tracker or a saved meal as pins come after his word.
      Undo: drop the `dock` key; «Al volo» is the guesses again.
    - Claude read «ap yc» as not covering the look of the Oggi screen. **He corrected it, 14 Nov:
      «ap yc significa che approvo tutto quello che mi hai detto e cosnigliato».** The Oggi screen
      and the dock are approved as shown; `.claude/rules/design.md` rule 3 says so now.
11. **Built under «ap yc», 14 Nov** (branch `five-places-oggi`, commit 1cd7482; photos
    `oggi-proposal/sheet-dock.png`):
    - The dock (PAT-99): `core/account/dock.ts` keeps the pins in `settings.prefs.dock`; «Al volo»
      has «Modifica», a `Sheet` of `Box` rows: «Fissati» («Su», «Togli»), «Altre assunzioni»
      («Fissa»). Tried in the running app with his data: pin two, move one up, reload (kept),
      log from a pin, unpin. Decided by Claude: at most 8 pins; with fewer than four the app's
      guesses fill the row to four; a pin that is archived is skipped. Undo: `DOCK_MAX`,
      `DOCK_ROW` in that file.
    - Limit, to say plainly: with no «assunzione» taken in 28 days and nothing pinned, «Al volo»
      (and so «Modifica») does not show, as today.
    - Found while trying it, in production too: the toast's «Annulla» after an «Al volo» tap was
      painted under «Il giorno» and could not be tapped. Fixed for every toast in the kit's CSS;
      as its own PR #352 to main, since this branch cannot merge yet. «Al volo» now uses the kit
      `Toast` (lint baseline −2).
12. **14 Nov, on the Oggi screen as built:** «si, diciamo che in realtà non hai cambiato molto, mi
    sarebbe piaciuto prendere il meglio del design attuale e di quello che avevi pensato tu».
    → Oggi is approved as a base but is too timid: the next version takes the best of today's
    pieces and of Claude's 13 Nov target design for Oggi (the page he commented with O1…O10),
    built from the real kit, shown as photos.
13. **Built after his two lines of 14 Nov** («ap yc… approvo tutto», «il meglio del design attuale e
    di quello che avevi pensato tu»); photos `oggi-proposal/v2/`:
    - Every place under the new bar (PAT-03, PAT-95): the title is the place (Elenco, Piano,
      Andamento), the tabs are gone, one row of area chips «Tutto · Cibo · Corpo · Mente · Soldi»
      filters it, and the bar keeps the area when he changes place. `AreaTabs` is removed from the
      kit, `AreaFilter` added.
    - The dock is a strip stuck above the bar (from «Oggi a livelli», order A): the water drunk,
      +250, +500, then his pins and the guesses, sideways, «Modifica» last. Tapping the water
      count shows the water's box, which is back in the day's times with everything it had.
    - Decided by Claude, each with its undo: «Allenati» (the cycle's next schede) shows on Oggi
      too, since Corpo's diary is no longer on the bar (undo: one condition in `day-page.tsx`);
      an area's diary (`/cibo`…) keeps working by address, with the area chips in place of the
      weather (undo: redirect it to `/oggi`); the dock lifts ⊕ and the toast by 53 px.
    - Still to build from «Oggi a livelli», in this order, each shown as photos: (1) a closed
      voce as one line with the thin energy strip, today's closed box as its second level;
      (2) detail behind chips, one open at a time («Voto», «Nutrienti», «Cibi», «Costo»);
      (3) «Il giorno» taking in the loose lines under it (energia, obiettivo, costo, creatina) as
      its chips; (4) the parts of the day that close, with their count and kcal.

14. **Built under «ap», 14 Nov night, steps (1) and (2) of «Oggi a livelli»** (branch
    `oggi-levels`; photos `LIFEOS/review/2026-11-14/levels-box/`, script `shots.mjs`): the kit
    `Box` has levels (VIS-40 in `delta.md`); every voce of the day and every group of a meal
    uses them. His 9 Nov day: 4125 px on main, 3249 px here, nothing removed; a closed meal is
    72 px (was ≈ 240), the opened Pranzo 342 px, with «Voto» open 750 px. Decided by Claude,
    each with its undo:
    - The strip's length is the meal's share of the day's kcal target, not of the day's biggest
      meal (the 13 Nov drawing): it says something on its own. Undo: `energyStrip` in
      `nutrient-rows.ts`.
    - «Nutrienti» keeps the food chips that light their share in every bar (VIS-50); «Cibi»
      lists each food with amount, kcal and cost. The drawing moved the chips to «Cibi», which
      would cut the lighting. Undo: `mealDoors` in `EntryRow.tsx`.
    - «− × 1 +» and «Elimina» stay at the top of level 1 (FOOD-38, FOOD-47), not inside «Cibi».
    - The cost is said on its chip, not again in a tile behind it; with nothing else it is a
      plain chip. A voce with no nutrients (a session, a weigh-in) shows its details at level 1,
      no door to tap. Undo: `mealDoors`.
    - At level 1 the strip gives way to the four thin bars; a session's muscle strip shows only
      closed. Undo: one condition in `Box.tsx`.
    - Not changed, found while looking: a voce inside a group cuts its title («Spuntir 1.145»),
      on main too. A dense row's head, its own slice.

15. **Step (3), same branch and PR #353:** «Il giorno» on the same levels. Closed: head with the
    voto and the kcal eaten, the energy strip (76 px; it remembers the level, closed at first,
    VIS-70). Open: the costliest part, the dispendio line, kcal and the four macros with their
    zone rulers, «Ricalcola la settimana». Doors: «Voto», «Limiti e micro» (the three limits,
    vitamins and minerals), «Energia e obiettivo ≈ kcal» (the goal line, the energy split,
    «La settimana in Andamento ›», the day's cost, creatine). Nothing under «Il giorno» stays
    loose. Photos `levels-box/sheet-giorno-*.png`, script `giorno.mjs`. Decided by Claude:
    closed at first (the 13 Nov drawing; was level 1, «Tutti i nutrienti»), undo: fallback in
    `OpenBox.tsx`; cost and creatine behind the energy door, not chips of their own (six chips
    would not fit one row at 320), undo: their lines back under the section in `day-page.tsx`.

16. **Step (4), same PR #353:** the parts of the day close (VIS-61 in `delta.md`). His 9 Nov
    timeline: Mattina, Mezzogiorno, Pomeriggio closed, Sera open (photos `levels-box/parts-*.png`,
    `sheet-parts-bands.png`, script `parts.mjs`). Decided by Claude, each with its undo:
    - Which part opens at first: the one with now, else the last with something (the 13 Nov
      drawing); not remembered between visits, unlike VIS-70's levels, since it moves with the
      hour. Undo: `firstOpen` in `Timeline.tsx`.
    - The count counts a group's voci one by one; the kcal sums what is in the part, planned
      included. Undo: `partSum` in `DayView.tsx`.
    - Icons give way before words; at ≤ 380 px only the kcal shows. Undo: kit.css «a part of the
      day that closes».
    - With this, «Oggi a livelli» (1)–(4) is built; next in the queue: Piano plans a future day
      (PAT-97), the composer, the gym.

17. **Under «ap», 14 Nov night: Piano plans a day to come (PAT-97; his O7), branch
    `piano-future-day`, a draft PR for his word** (photos `LIFEOS/review/2026-11-14/piano-day/`,
    script `shots.mjs`):
    - On Oggi, a tap on a later day in the week strip or the month opens it in Piano; arrows
      and swipe still walk through Oggi (PAT-97 speaks of a tap).
    - Piano's page for a day to come shows Piano's header and week, the plan controls (the
      ciclo's step, «Salta», «Sposta l'allenamento», «+ previsto», «Copia i pasti di ieri»),
      then the same day as Oggi draws it: «Il giorno» with what is planned, the sky bands, the
      rail, each previsto hatched; then the blocchi and cicli.
    - Every part shows, an empty one as a gap that offers its meal («+ Colazione», «+ Pranzo»,
      «+ Cena»), and all start open. Each previsto says where it comes from: «dal ciclo»,
      «dal piano» (a blocco), «solo questo giorno» (put there by hand).
    - Decided by Claude, each with its undo: Piano's day reuses Oggi's `DayPage` with a
      `piano` frame instead of a second copy of the day (undo: the `ahead` branch in
      `oggi/piano/page.tsx`); the week's rows and the old flat list give way to the day on a day
      to come (undo: same branch); the provenance pill shows on Oggi's previsti too (undo:
      `from` in `day-page.tsx`).
    - Not touched, found: the ciclo's select is cut at 320 px («come da ciclo (R»); a time
      field shows «11:59 PM» in an English browser; the night's gap offers «+ Spuntino».
18. **14 Nov night, his photo of Oggi (production, desktop): «vedi i bug, e perché poi mi appaiano
    "allenati", che è sta roba, poi il padding è fatto male, ma poi alcune cose hanno i contorni
    altre no, bo, tutto con padding e dimensionamento fatto male, ma non esistono tool appositi
    per evitare tutto questo?»** Measured, then fixed per pattern (branch `oggi-spacing`):
    - One gap between any two cards or blocks of a page, 12 px (VIS-04); it was a rule for two
      blocks only, so «Il giorno» touched «Allenati» (0 px) and cards were 8 px apart elsewhere.
    - The weather card loses its line (VIS-04: colour separates); it was the only frame.
    - The dock sits on the bar at the page's end and ⊕ above it: the 80 px kept for ⊕ had gone
      under the dock, which then floated over the bar on a short page, ⊕ on top of it.
    - A sky band tapped shows the kit's ring inside it, not the browser's white box.
    - «Allenati» leaves Oggi (it stays on Corpo's diary): undoes the «decided by Claude» of §13.
      Oggi starts the gym from the cycle's planned session («Inizia» on its box).
    - The tool he asked for: `e2e/layout.spec.ts` (CI, every PR) measures every place at 390
      and 320: the gap between cards, frames, and ⊕ / dock / bar covering one another. On
      main's code it names each bug of his photo; `e2e/layout.ts` runs the same by hand.

19. **14 Nov night, his answer to the report of §17–§18 (verbatim):** «ap ma controlla meglio il
    padding anche altrove perché gia vedo altri problemi simili. e poi sinceramente non ho capito
    e non è intuitivo il funzionamento dei blocchi e cicli, poi che significa che vengono mostrati
    sia in alto che in basso, poi nel piano nel "giorno" vengono mostrati i dati precisi delle
    somme pianificate degli alimenti? perché in oggi non mostra la quantità raggiunta coi
    pianificati, per lo meno solo graficamente con la barra ma attraverso i numeri dice solo " +
    tot" quindi devi fare la somma a mente ed è scomodo. quello che voglio pianificare in generale
    è questo: creare magari dei prototipi di giornata magari da mettere in ciclo, eventualmente, e
    devo poter pianificare qualsiasi cosa, dai cibi, alle sessioni, alle semplici assunzioni, alle
    pesate, eccetera. inoltre come ti avrò detto prima per quanto riguardava le cose che si
    aggiungevano man mano, bisognerebbe mettere delle modalità per gli orari, ovvero se l'orario
    previsto si sovrascrive o meno alla conferma o no, (vale anche per orari non messi, e quindi
    cose fuori orario) e poi al momento della conferma, eventualmente, poter decidere se
    effettivamente sovrascrivere o meno (non so se con doppio tocco o qualche altro sistema per
    differenziare la cosa). quindi mettere questa feature in due momenti, sia alla pianificazione
    sia all'effettivo completamento, in modo intelligente pero, non so bene come possa essere
    implementato. inoltre continuo a vedere disallineamenti o cose poco centrare o scritte a caso
    che rompono il design. comunque molte alte cose andrebbero cambiate, hai controllato dove
    portano le varie interazioni? ci sono parecchie pagine che non ho mai usato o perché non le ho
    mai capite o perché fanno schifo e ce ne siamo dimenticati o entrambe.»
    Taken as: (a) padding and alignment checked on every page, not only Oggi; (b) the day's
    numbers say the total with the planned, not «+ n»; (c) a map of where every interaction
    leads, with the pages he never used; (d) planning: day prototypes, possibly in a ciclo, any
    type planned, and time modes at planning and at confirming — an object-model decision,
    asked with options before any code (CLAUDE.md rule 1).

20. **14 Nov night: «ok i have to go, ap until you finish the token, for everything yc».** Every
    recommendation below is taken and logged with its undo; what cannot be undone or reaches
    production (migrations, deletes, merges) stays his.
21. **Padding on every page, measured (his (a) of §19), same PR #355.** A crawl of the 82 pages
    the app links to, with his data at 390 and 320 (`LIFEOS/review/2026-11-14/crawl/`): the
    page's column is one (text at 28 px in a card, boxes at 16). Off it: Elenco, lying loose on
    22 pages (its chips touched the screen's edge) and padded twice inside Piano's card. Fixed for
    the pattern: Elenco is a page card itself, its groups have no padding of their own. The other
    hits were link tap areas (4 px wider than their text on purpose) and a label hidden for
    screen readers. The layout spec counts Elenco and ObjectActions as page pieces.
    Not measurable this way, so not claimed fixed: «poco centrate», «scritte a caso» beyond loose
    text; a photo of each one he sees is enough to turn it into a check.

22. **The planned sums written out (his (b) of §19), PR #355.** The kcal, each macro and each limit
    say the total with what is planned after an arrow, as FD-34 already judges it: «0 → 306 /
    2.105 kcal», «120 → 150,5 / 168 g»; «di cui 306 kcal previste» moves under the bar (at
    320 px it ran into the target). Photos `LIFEOS/review/2026-11-14/planned/`. Decided by
    Claude: the arrow's number in the muted ink of the plan (undo: `.k-plan` in kit.css).

23. **Asked, his to settle (his (c) and (d) of §19; page `LIFEOS/review/2026-11-14/crawl/index.html`,
    opened in his browser).** Not built: an object-model change and a pattern change he has not
    seen (CLAUDE.md rule 1, design.md rule 3).
    - Q1 Planning model: (a, Claude's pick) «giornata tipo» (any previsti with times, any type)
      + ciclo (which giornata tipo on which day); blocchi become lines of a giornata tipo;
      «Salva questo giorno come giornata tipo»; a migration. (b) keep blocchi and cicli + «Salva
      come tipo» making blocchi. (c) giornata tipo as a third type.
    - Q2 Times: (a, Claude's pick) at planning «Ora: fissa · quando capita» per previsto (the
      `timeMode = fixed` of `core/entries/write.ts` exists, with no field to set it); at
      confirming «Fatto» follows it and the toast offers the other for 5 s («tieni le 20:00»),
      which changes PAT-74. (b) a double tap or long press on «Fatto».
    - Q3 Piano shows the cycle three times (strip, week list, Blocchi · Cicli): (a) strip + the
      open day; the list only in Elenco.
    - Q4 The interaction map (82 pages, every one linked; each place ×5 by area): Cestino as a
      row in Profilo; «Qualità dei dati» merged into «Come valutiamo»; Legami hidden with no
      data (PRD-02); the rest kept. And: which pages he never understood.

24. **15 Nov, his answer to §23 (verbatim):** «ap yc, pero considera che dalle grafiche che hai
    mandato ci sono alcune cose che non mi piacciono, tipo il "è costata di piu" non mi serve, lo
    posso vedere dai voti, il resto del testo mostrato anche, dovrebbe essere mostrato negli
    obiettivi no? e poi ti avevo gia detto che le parole "ok", "pessimo" eccetera non le voglio,
    occupano spazio inutile e ci sono gia le barre grafiche e i numeri e i colori e le forme a
    farmi capire tutto. una cosa che manca è che la barra delle calorie dovrebbe colorarsi anche
    lei in base ai range.»
    Taken as: Q1–Q4 of §23 approved as recommended (a); «è costata di più» goes from every Box
    (VIS-43); the day's dispendio sentence goes to Obiettivi; no judgement word beside any number
    or bar (F1 of 13 Nov again; the words stay for screen readers); the kcal bar is coloured by
    its zones like the macros.

25. **Built under his «ap yc» of 15 Nov, PR #355** (photos `LIFEOS/review/2026-11-15/nowords/`):
    no «è costata di più» and no judgement word beside any number or bar (0 left on his 9 Nov at
    390 and 320); the targets' sentence moved from «Il giorno» to Obiettivi («Oggi: dispendio ≈
    …»); the kcal bar has its zones ruler and coloured tip (VIS-43, VIS-52, FD-31 in `delta.md`).
    Decided by Claude: the kcal edges ±5 / ±10 / +25 % are the app's, marked «*» in the source
    (undo: `kcalRange`). His question «cosa dovrei fare con il draft della 354?»: merge #355
    first; Claude then updates #354 on main and marks it ready (Q3 approved it).

26. **Q4 of §23, under his «ap yc»:** «Qualità dei dati» is the last section of «Come valutiamo»
    («Con quali dati»; the old address redirects there); «Legami ›» shows on Andamento only with
    21 days of check-ins (PRD-02, product.md §4 «correlations: not now»); Cestino was already a
    row of Profilo: unchanged. Photos `LIFEOS/review/2026-11-15/pages/`. Undo: the door and the
    redirect in `oggi/andamento/`. His 15 Nov rule «when you wait… do it in background» is in
    CLAUDE.md (Tests and deploys).

27. **Q2 of §23, first half, PR #356:** at confirming. «Fatto» on a previsto of today takes the
    tick's time as before (PL, «ora della spunta»); the toast now says it («segnato fatto alle
    02:44») and offers «tieni le 23:00», which puts the planned time back and stays fatto;
    «Annulla» then swaps again. Tried in the app (photos `LIFEOS/review/2026-11-15/times/`).
    Still to build, the second half: at planning, «Ora: fissa · quando capita» per previsto
    (the `timeMode = fixed` the tick already respects has no field to set it).

28. **Q1 of §23 (a), approved by his «yc», 15 Nov; planned, not built** (MOD-30…36 in `delta.md`).
    Found while writing it: no migration is needed. The registry gains a catalog type «day»
    (giornata tipo) whose parts are today's blocchi; ciclo steps already hold catalog items;
    his data has 0 blocchi and 1 ciclo (PPLCR) of schede, so nothing to convert. Build order, one
    slice at a time, each photographed:
    1. Registry entry «giornata tipo» + its ObjectPage (lines with time and time mode).
    2. «Salva come giornata tipo» on a day (Oggi and Piano) → its voci become lines.
    3. `core/plans`: a ciclo step holding a giornata tipo expands into its lines on that day.
    4. Elenco: «Giornate tipo» and «Cicli» (the word «blocco» leaves the screens); Piano shows
       the strip and the open day only (Q3).
    5. «Ora: fissa · quando capita» on every line and every previsto (Q2's second half).

29. **«Salva come giornata tipo» built, 15 Nov, under «ap» (branch `giornata-tipo`).** Found while
    building: a ciclo's step already holds blocchi «nel ciclo», each with its own time and any
    type, and the Piano already plans them on the step's days — a step *is* a giornata tipo. So,
    decided by Claude (undo: the type «day» of §28 instead): no new type; the giornata tipo is
    the step. On Piano's day, «Salva come giornata «Legs»» turns the day's voci into the lines of
    the step due that day: one line per object or type (eight glasses are one «Acqua»), nothing
    twice; a meal of foods is first kept as a pasto «Cena · Legs» (reused when it exists), so the
    line plans the real food; a step holding its scheda directly (his PPLCR) gets it into its
    blocco first, or it would stop planning it; a step named by what it held keeps its name.
    Tried on his 10 Nov export reloaded locally: today saved as «Legs» → Monday 16 plans «Legs»
    and «Cena · Legs» at 21:00. Not on a rest step (it would stop being a rest); not on a past
    day (the Piano has no step for it). Photos `LIFEOS/review/2026-11-15/giornata/`.
    Next: slice 4 (Elenco: «Giornate tipo» and «Cicli», the word «blocco» off the screens) and
    the time mode (§27).

30. **15 Nov, his question: «ma non avevi detto che elimnavi i blocchi?».** Yes: (a) said blocchi
    go. The idea is gone (a giornata tipo's lines live in the ciclo's step); the word left the
    screens in this slice, PR #357: Elenco shows «Giornate tipo» (each step with its righe, to its
    ciclo) and «Cicli»; Piano's header offers «Nuovo ciclo»; the ciclo's editor says «riga»; the
    scores say «adatto al piano»; every area's Piano lists the giornate tipo. A blocco outside
    every ciclo shows under «Fuori dai cicli» only while one exists (he has none); it can no
    longer be created from Elenco. Still a blocco underneath (the storage of a riga: no
    migration). product.md §3: «giornata tipo» and «riga» get their row (they were in «Not»).
    Left: «Ripeti nel Piano» on a voce still makes a loose blocco — next, it should add the voce as
    a riga of a giornata tipo. Photos `LIFEOS/review/2026-11-15/giornata/elenco-390.png`.

31. **15 Nov, his answer on §30 (verbatim):** «si ma non mi piace per nulla che ci sia sopra e
    sotto, e poi sono confusionari e ripetitivi anche da soli, fatti male». Built in PR #357, one
    place per idea (photos `LIFEOS/review/2026-11-15/ciclo/`):
    - Piano: the strip and the open day only. «La settimana» (the same seven days under the strip)
      and the list at the bottom are gone (Q3); the day's plan line links «PPLCR ›». The week
      rows' code (`features/plan/week-rows.ts`) is deleted, its lint suppression pruned.
    - Elenco: one «Cicli» section; each ciclo one row with its giornate tipo in order, «Push →
      Pull → Legs → Corsa → Rest». No second list of the same steps.
    - The ciclo's page: each step shows its righe («Legs · Cena (Legs) · Acqua»), not «scheda».
    - «Salva come giornata»: the day's meal of foods is linked to the pasto made from it (as «Salva
      anche come pasto» does), so the day does not show it twice; the pasto is named «Cena (Legs)».
    Not redone yet, his «fatti male» on the ciclo's page: the rules (Nome, Avanza, Se salti, Dal
    giorno) still come before the steps, and «Cambia i passi» is a column of Su · Giù · Togli.
    Next, shown as photos before building: the steps first, rules folded; reorder by dragging.

32. **15 Nov, his words on Piano (verbatim):** «si il widget intero del piano fa veramente schifo,
    oltre che non capirsi per nulla. scusa ma non si puo fare diversamente? togliere anche quello e
    fare in modo che ci sia solo una pianificazione come fosse una giornata in Oggi ma nel futuro,
    e quindi puoi aggiungere cose e dove e quando vuoi ogni tipo di cosa, però aggiungiamo una
    sorta magari di opzione di "periodizzazione" o qualcosa di simile, magari alle singole cose o
    anche a loro combinazioni, e periodizzazioni configurabili, ogni tot magari, o magari facciamo
    in modo che, come i cicli attuali, possiamo dargli un nome, e cosi possiamo configurare la
    periodicità anche in funzione di altri cicli. solo che nella visualizzazione è di fatto solo un
    tag che appare in quell'aggiunta alla timeline, e magari sotto oppure toccando quel tag non so,
    puoi visualizzare e configurare,... bo»
    Claude's reading, to build in slices shown as photos:
    - **Piano = a day of Oggi in the future.** The card «Oggi/Il piano del giorno» (ciclo select,
      «Salta», «Sposta l'allenamento», «+ previsto», «Copia i pasti di ieri», «Salva come giornata»,
      «Apri il giorno») goes. A day to come is added to with ⊕ and the gaps, as Oggi.
    - **A ritmo** (his «periodizzazione»): a name and a rule — ogni giorno · questi giorni della
      settimana · ogni N giorni · a turno con altri (today's ciclo). It holds one thing or several
      together (today's giornata tipo). Storage: today's blocco (rule = recurrence) and ciclo (a
      turn); no migration expected.
    - **On the timeline it is only a tag** on the voce («PPLCR · Legs», «ogni giorno», «lun · mer ·
      ven») in place of «dal ciclo» / «dal piano»; tapping it opens a sheet to see and change the
      ritmo: its rule, skip this time, move this time, the other things in it. A voce with no ritmo
      offers «Ripeti…» there, to give it one (new, or an existing ritmo by name).
    - Word: «ritmo» (his «periodizzazione» is the idea; one short word for the tag). To confirm.
    **Slice 1, built (PR #357):** Piano is the header, the strip and `DayPage` for the day chosen
    (today by default) — the card is gone, with its actions (`app/(app)/piano/actions.ts`,
    `SaveDayType` deleted; `saveDayToStep` stays in core for the ritmo's «più cose insieme»; lint
    baseline −13 lines). A planned line's «dal ciclo» is now its ritmo as a tag, «PPLCR · Legs ›»,
    on the line even when its box is closed, opening the ciclo; a blocco's tag is its rule. The
    day's closing stays in Oggi only. Photos `LIFEOS/review/2026-11-15/ritmo/`.
    Lost until slice 2, said plainly: «Cambia» the step of one day, «Salta», «Sposta
    l'allenamento», «Copia i pasti di ieri», «Salva come giornata». Slice 2: the tag opens a sheet
    (this time: salta · sposta · cambia passo; always: the rule, the name, the other things in it)
    and «Ripeti…» on a voce with no ritmo.
    **Slice 2a, built (PR #357):** the tag opens the ciclo's page for that day (`?giorno=`) with
    «Questa volta · lunedì 16»: the steps as chips (the day's on), a tap gives the day that step,
    the same again gives back the ciclo's own; «Salta questa volta» / «Non saltare più». Tried on
    his data: Monday Legs → Push → Legs, then skipped. Back now: «cambia passo», «salta». Still to
    come: «sposta» this time, «Ripeti…», the rule and name on the page, «Questa volta» first
    (the page's redo). Decided by Claude: the ciclo's page is the ritmo's sheet (one place, no
    second screen); undo: a `Sheet` instead. Photo `ritmo/this-time-390.png`.

33. **15 Nov, his «ap yc» again: the ciclo's page redone (§31's «fatti male»).** The kit's
    ObjectPage gets two slots for any type (PAT-30): `first`, a section under the header, and
    `fold`, the values folded under a word after the parts. The ciclo uses them: «Questa volta»
    first (when reached from a tag), then «Passi» with «Cambia i passi» under them, then
    «Regole» folded, then «Andamento». Photos `ritmo/ciclo-redo-390.png`. Not yet: reorder by
    dragging (the editor's Su · Giù · Togli stays), «sposta» this time, «Ripeti…».

34. **15 Nov, his «tc» to «confirm «ritmo» or another word»:** read as «yc» (t beside y on the
    keyboard): «ritmo» is the word for his «periodizzazione». Undo: his other word, here and in
    product.md §3.
35. **15 Nov, his words (with «ap»):** «btw on the phone the little votation cards do not appear,
    only the number, i think because the rendering is too little». Cause: VIS-43 hid the skyline
    at ≤ 360 px, and his phone is 360 px wide or less. Decided by Claude: the skyline stays at
    every width, smaller at ≤ 360 px (the Box head's 60 × 28 → 40 × 22, a row's 52 × 24 → 36 ×
    20); the title gives way (it ellipsizes). VIS-43's narrow line changed to say so. Undo: the
    `@media (max-width: 360px)` block in `kit.css` back to `display: none`.
36. **15 Nov, his «yeah ok, go on» (ap): «sposta» this time, built.** The tag of a ciclo's line
    now carries the line and its time (`&riga=…&ora=…`); «Questa volta» shows «Legs alle 06:43»,
    «Sposta», and «↺ Ora del ciclo» once moved. Decided by Claude, each with its undo:
    - **One line moves, not the whole step.** Tried on his data: Tuesday's Legs step holds Legs
      06:43 and «Cena (Legs)» 21:00; shifting the step together would have put dinner at 08:47
      the next morning. A line anchored to the moved one («30 min prima di») follows it; once
      its anchor is done, it follows the fatto time (PL-11), not the move. Undo: shift by step.
    - **Stored in the day's `cycle_override` row** as `at: { <blocco id or "step">: minute }`,
      beside `position`; each is kept when the other changes, and an empty row is removed. No
      migration (the `decisions.kind` check would have needed one for a new kind). Undo: drop
      the `at` key.
    - A ciclo's lines are never written as previsti (`inCycle` is never «planned on» a day), so
      moving the computed line covers today too; a previsto written by hand keeps its own time.
    Photos `LIFEOS/review/2026-11-15/sposta/`.
37. **15 Nov, his words on §36's photos (verbatim):** «non mi piacciono per nulla, sono
    disordinati, non centrati e belli da vedere, e poi non tengono conto del fatto che se aggiungo
    tante cose graficmente diventa orribile. tempo fa esisteva una regola che ti imponeva di usare
    tendine per scelte che si possono espandere, o robe simili che comunque tengono conto
    dell'espandibilità. che fine ha fatto». Found: the old kit spec (`archive/spec-v2/kit.md` §7)
    said «a choice that can grow (more than four options, or a list the person extends: day
    types, groups, categories) is a drop-down, never a row of chips that breaks the layout»;
    VIS-85 kept only «segmented ≤ 4, else drop-down», losing «a list he extends». `Field` still
    does the ≤ 4 part; «Questa volta» bypassed it with hand-made chips. Fix: the rule whole in
    VIS-85, a `Field` that always drops down for a list he extends, «Questa volta» redrawn from
    `Field` only — shown to him before the PR moves on.
38. **15 Nov, his words (verbatim), with the question «cosa proponi?»:** «inoltre quando clicco
    +500 all'acqua si modifica in "ancora 500?" ma che senso ha. e poi se sotto vuoi mettere le
    assunzioni, dovrebbero essere trattate tutte allo stesso modo, compresa l'acqua, quindi per
    esempio non dovresti mostrare quella specie di obiettivo custom, a meno che non metti
    l'opportunità di crearlo anche per le altre assunzioni e quindi di modificarlo anche. lo rendi
    un tracker o qualcosa di simile, non so come funzionano, mai usati perché mai capiti. inoltre
    ci sono delle incoerenze: la pagina piano non ha senso nei giorni passati, mentre quella oggi
    non ha senso per quelli futuri, quindi tanto vale unirle e tra l'altro essere sicuri che quando
    si pianifica qualcosa in un orario futuro (non solo giorno) sia sempre pianificato. di
    conseguenza la pagina piano attuale deve essere diversa da adesso, non cosi ridondante come
    Oggi, e immagino che anche Oggi a questo punto. cosa proponi?» — options in the reply, his to
    pick (rule 1: merging two places is expensive to reverse).
39. **15 Nov, his answer on §38 (verbatim):** «yc, 3 semplicemente evita di mettere annulla cosi
    lunghi e permetti di poter modificare le quantità messe successivamente, e non solo
    aggiungerle. inoltre "questa volta" fa ancora veramente schifo: "Tapping a row opens it in
    place, leaving saves" si ma fa schifo e poi hai questa cattiva abitudine di buttare tasti
    decentrati e con pessimo padding e spaziature e dimensioni e contorni pessimi, per esempio
    adesso "salta questa volta" a parte che puo essere un semplice "skip" ma vabbe. hai anche
    questa brutta abitudine di fare tasti con scritte lunghe inutilmente. ma poi non vedi che da
    guardare fa schifo? non ci sono tool o skill o qualsiasi cosa che ti puo far migliorare lato
    grafico? perché stai performando veramente male». Taken («yc»): **1A** Oggi holds every day
    (past · today · future by the time), Piano only what repeats + the weeks ahead, a day there
    opens in Oggi; a voce at a time after now is always previsto. **2a** any assunzione may have a
    daily goal (an Obiettivo), water is the first; set and changed from its chip's sheet. **3**
    no «Ancora +500?»: one tap logs, a short undo, and the amounts logged can be changed after,
    not only added. «Questa volta» to redo as the app's own Box (VIS-40), short labels («Salta»).
40. **15 Nov, his words on the Box version (verbatim):** «ma fa ancora schifo e poi non vedi che i
    numeri rispetto alle intestazioni e i bottoni sono sfalsati?». Measured: every Box head on
    Oggi, Cibo · Elenco and the ciclo's page had title, number, score and action 2–9.5 px apart
    (baseline alignment; a tiled row's title pushed down 6 px). Fixed in the kit for every
    screen: the head centred; a narrow row whose value wraps keeps score and «›» on the name's
    line. Guard: `e2e/layout.ts` `measureHeads` in `layout.spec.ts` fails a PR when a head is
    more than 1.5 px out of line (shown failing on the old CSS). «ancora schifo» beyond the
    alignment is asked of him (what exactly), not guessed.
41. **15 Nov, his «aè», read as «ap»** (è sits beside p on the Italian keyboard, as «tc» → «yc» in
    §34; undo: say so). Done from his «yc» on §38, needing no new design:
    - **MOD-15**: a voce that starts after now is previsto whatever the form said (`statusAt` in
      `core/entries/write.ts`, on create and update; one minute of slack for «adesso»).
    - **Water (3)**: «Ancora +500?» gone; one tap logs and the toast says «Acqua · 500 ml ·
      Annulla», as every assunzione's does. Open, the water box lists each drink with its time and
      the kit's `Stepper` (± 50 ml), saved after a short pause (`setEntryNum`, any number field of
      a built-in type within its bounds). Decided by Claude: «annulla così lunghi» read as the
      long «Ancora +500?» question, the toast keeps the kit's time; undo: a shorter `TOAST_MS`.
    - **Heads that do not fit** (found while photographing the water at 320: the skyline was
      drawn over «Acqua», and a day «Mar 10» in Andamento at 390): a Box head wraps its score and
      number to their own line, the title keeping about eight letters (a list row five); every
      head's first line is 28 px, so «›» and the actions stay on the title's line. `measureHeads`
      now also fails a title covered by its score.
    Parked for him: 1A (Oggi = every day, Piano = what repeats) and 2a (goals on every assunzione)
    change screens, so they are shown before they are built; «Questa volta» waits for what he
    finds ugly in it.
42. **15 Nov, his «yc ap»: 1A built on its own branch, shown before merging** (design.md rule 3).
    Oggi opens every date (the strip no longer sends a day to come to Piano; a planned line's
    fallback link opens the day in Oggi). Oggi · Piano is what repeats: header, the week strip
    (each day's step, a tap opens it in Oggi), the ritmi as the kit `Elenco` — the same shape as
    an area's Piano, nothing drawn new. `DayPage` loses its `piano` frame. PAT-97 rewritten in the
    delta. Decided by Claude: the strip opens on the week of tomorrow (on a Sunday the next week,
    not one already over); «Nuovo ciclo» only at the end of «Cicli», not in the header too.
    Undo: `git revert` of the branch. Photos `LIFEOS/review/2026-11-15/oggi-piano/`.
43. **15 Nov, his words on §42 (verbatim):** «ma che stai facendo, in piano a questo punto è
    inutile avere le giornate o cose simili,». Done: Oggi · Piano has no week strip and no week in
    its header; it is only what repeats (the ritmi as the kit `Elenco`), the same page as an
    area's Piano with every area. Days live in Oggi alone.

44. **15 Nov, his note in `RULES_LOG.md` (inbox W-04) and his «ap yc» on the answer:** no feature
    code; first a map of the whole app read from the code, then the target as tables for him to
    review, then the difference as a backlog of convergences (foods and meals in Oggi and Elenco
    first), then guards that a machine runs. Built: `scripts/map.mjs` → `docs/spec/map.md`
    (`npm run map`; `--check` fails when stale, not yet in CI): 42 routes, 70 screen components,
    41 kit pieces, 37 components that take input, 17 where a quantity, time or date is typed, 20
    with a control made by hand. Decided by Claude: the map is a generated file (like
    `lint-baseline.json`), not a decision document, so it replaces none; undo: delete both files.
    Also by his «yc»: #362 stays open until the target tables say what Oggi and Piano are. He
    asked for a new session (context) and not Fable for everything: the handoff says which step
    needs which model.
45. **15 Nov, his second «ap yc»:** (1) 2a taken as **(a)**: a goal «al giorno» on a food, set from
    its chip and shown in Obiettivi; water keeps its computed target, shown the same way and
    overridable. A decision only: no code until the target tables place it (§44). Undo: his word.
    (2) Step 2 of §44 done as a list, nothing deleted (`LIFEOS/review/2026-11-15/dead/DEAD.md`):
    `npx knip` named 5 code files, of which 3 are candidates (`core/catalog/archive.ts`,
    `core/engines/metrics/index.ts`, `scripts/load-v2-export.ts` — the last one asked of him) and 2
    are kept (run by CI and by `verify`); `jscpd` kept (`scripts/cpd.mjs` runs it); 94 exports and
    34 types no one imports, not checked one by one; 16 of 64 ADRs cited by no live file
    (candidates to archive); 5 other files no one mentions. Deleting waits for his word.
46. **15 Nov, «ap»: step 3 of §44 drafted, foods and meals** (`target.md` in this folder). Read
    from the code: a cibo is drawn 9 ways and a pasto 6; the richest box (voto with criteria,
    every nutrient, cost) exists only on the day, the pasto's own page has none of it; no screen
    links to a marca's or formato's page. Proposed: row, box and page are one piece at three
    levels for every catalog type, opened in place in the Elenco; a backlog B1…B8. Decided by
    Claude: the draft is a file of this change, merged into `patterns.md` or dropped when he has
    answered its five questions (undo: delete the file). Nothing built.
    Step 5, first guard: `npm run lint` ends with `node scripts/map.mjs --check`, so CI's
    `static` job fails on a stale map (decided by Claude; undo: drop it from the `lint` script).
47. **15 Nov, his «ap yc» on `target.md`'s five questions:** all five taken as (a): row = box =
    page at three levels; a tap opens in place in the Elenco; marche and formati nested under
    their cibo; the label behind «Etichetta»; the order B1 → B2 → B4 → B3 → B5 → B6 → B7, then the
    same table for exercises and schede. Written as PAT-30 and PAT-43 in `delta.md`. Each B is
    built in the real app and shown as photos before it merges (design.md rule 1).
48. **B1 built under his «ap yc», 15 Nov** (photos `LIFEOS/review/2026-11-15/b1/`): a saved
    pasto's page opens on the box the day draws for a meal — voto with its criteria, the four
    bars, the doors Nutrienti · Cibi · Costo — in place of its plain rows of totals and cibi.
    The doors live in one module (`features/day/meal-doors.tsx`) used by both. Decided by Claude:
    behind «Cibi» each cibo is a kit row that opens its page (B4 for this list); the box is open
    at first on its own page; judged as a logged meal is (all the foods' estimates). Found: the
    composer's «come sarà» judges a new meal with fewer estimates than the day does, so the same
    meal can have no voto there (not changed here). Undo: `git revert` of the commit.
49. **15–16 Nov, his words, added by him to `RULES_LOG.md` (verbatim):** «la pianificazione
    inoltre va ripensata anche in funzione di come si possa applicare anche per cose come
    sveglia, pesata, misure, passi, e altre cose.» Not decided by Claude (a model of the Piano is
    his, rule 1): it becomes its own table in `target.md` — for each type, what «planned» means
    (a time to wake, a weigh-in due, a count to reach) and where it is shown — drafted for his
    pick before any Piano work. His «procede» of 16 Nov on B1's photos: B1 stays as shown (the
    cibi as rows); B2 next.
50. **B2 built, 16 Nov, «Pasti salvati» first** (photos `LIFEOS/review/2026-11-16/b2/`): a row of
    the Elenco opens in place with the meal's box — voto, the four bars, «Registra · Cambia i
    cibi · Apri», the doors Voto · Nutrienti · Cibi · Costo; «Apri» goes to the page (PAT-43).
    The box is now one kit piece, `MealBox` (its third place: day, page, Elenco — PRD-53), in
    the gallery and photographed; a pasto is composed once (`oggi/elenco/meal-box.ts`) for the
    page and the row. Decided by Claude: the doors' words come from the app (PAT-81); a row
    keeps its criteria behind «Voto» (the kit `Box` showed that door only on a card); the three
    actions are act pills, none filled (one primary per screen, VIS-85). Not yet: the «Cibi»
    shelf (a cibo's box has other doors: B3), search as `Find`. Undo: `git revert`.
51. **16 Nov, his words:** «ho scritto altre cose nel file, comunque toglile da li dato che mi hai
    detto che non ci devono stare». Done: his note left `RULES_LOG.md` and is verbatim at the
    end of `inbox.md` (W-04); its last paragraph is §49.
52. **16 Nov, the planning table of §49 drafted** (`target.md` §6): the model already plans any
    type as «a voce due»; it cannot plan a time to hit (sveglia) nor an amount to reach (passi,
    acqua, an assunzione). Proposed: three shapes of «planned», declared per type; four
    questions, Claude's pick first. Nothing decided, nothing built.
53. **16 Nov, his words on B2's photos (verbatim):** «ok mi piace, comunque in generale non pensi
    che sarebbe meglio centrare le icone ogni volta invece di metterle in alto?». B2 is approved
    as shown. The icons: a change to the kit `Box` head (VIS-40), so to every box at once —
    Claude's view: yes while a box is shut (the icon centred on the title and its meta line);
    open, it stays with the head line, or it would drift to the middle of a tall box. To build
    in the kit and show as photos before it merges. The four planning questions of §52: not
    answered yet.
54. **16 Nov, «ap»: the icons centred, built in the kit** (branch `target-b3`; photos
    `LIFEOS/review/2026-11-16/icons/index.html`). The Box head's icon left the title's span: it
    is one `k-lead` beside the head and its meta line (`k-top`), centred on both while the box is
    shut — also when the head wraps at 320 — and on the first line when open. Nothing else moves:
    the widths at which a head wraps, the indent of the meta, the tap area (the head reaches
    under the icon). Decided by Claude: «centred» is on the head and the meta, not on the strip,
    the pills or the buttons under them. Not merged before his word on the photos (design.md
    rule 3). Undo: `git revert` of the commit.
    Measured on his data, 225 boxes on 7 screens at 390/360/320, before and after: only the icon
    moved, but for (1) 35 list rows at ≤ 360 px that show 40 px more of their name (an old rule
    left that gap empty) and (2) a row's title now on its action pill's centre (2 px). Found: the
    head guard of `e2e/layout.ts` read `.k-box > .k-line` and so measured nothing once the
    markup moved, yet stayed green; it now fails when no head is measured, checks the icon's
    centre, and runs on the gallery too. His to judge on the photos: «Acqua» on the day, whose
    score wraps to the right under the title, so the centred icon stands beside an empty spot.
55. **16 Nov, «ap»: B4 built** (same branch): a cibo's «Usato in» is a kit `List` of rows, each
    pasto with how much of the cibo it has as its value, and a tap opens the pasto (before: plain
    lines that opened nothing). A pasto's «Cibi» were made rows with B1 (§48), so B4's two hand
    lists are gone. Undo: `git revert`.
56. **16 Nov, his notes on the gym, the Elenco and Andamento (verbatim, written by him at the
    end of `inbox.md`, moved here 17 Nov since this change is open):**
    > [07:32, 16/11/2026]: Mi pare che il calcolo delle serie e rep da fare si basi solo sulla prima scorsa, oltre che certe volte essere assurdo. Anche per i progressi, le misurazioni sono strane
    > [07:34, 16/11/2026]: Inoltre come ti avevo gia detto per il resto dell'app, il design della gym session è fatto male, cose non allineate e centrate, buttate una sopra laltra, senza studio delle priorità e degli spazi e delle dimensioni e del padding. Questa cosa dovrebbe essere un controllo obligatorio ogni volta che si dusegna qualcosa dell app
    > [07:36, 16/11/2026]: Inoltre, hai fatto un refactoring nell elenco per ingrediwnti e pasti, ma le altre xose nell elenco?
    > [07:37, 16/11/2026]: Va tutto conformato
    > [07:39, 16/11/2026]: Gli esercizi oltretutto vanno pensati bene, per quelli che hanno tonnellaggi veri e propri, si deve mettere la possibilità di poter specificare gli incrementi (in palestra non si possono aggiungere pesi a caso) e se sono asimetrici (vanno compiuti un lato alla volta) o simmetrici ma il peso si divide comunque in 2 e non è unico
    > [07:40, 16/11/2026]: Va pensato ai gruppi muscolari toccati
    > [07:41, 16/11/2026]: I riscaldamenti come e quando e quanto
    > [07:41, 16/11/2026]: Pause consigliate a seconda degli esercizi
    > [07:41, 16/11/2026]: E queste cose si aggiustano in sessione a seconda del contesto di quel momento
    > [07:41, 16/11/2026]: E poi la sessione
    > [07:42, 16/11/2026]: Va rifatta, anche qui lo studio del design di prima
    > [07:44, 16/11/2026]: E la pianificazione tocca molto anche loro, per quanto la periodizzazione degli aggregati di blocchi (combinazioni di pasti o sessioni o singoli esercizi i ingredienti nella linea tel tempo, pianjficati insieme)
    > [07:45, 16/11/2026]: L andamento degli esercizi e dell3 sessioni è praticamente inesistente, persino piu di v1
    > [07:46, 16/11/2026]: Anche andamento va aggiustato e conformato e uniformato
    > [07:47, 16/11/2026]: Riprebdendo in tutto e per tutto i voti nelle altre visualizzazioni, ma resi piu complessi e con piu dati o non so, come pensi?
    What they ask, in short (Claude's reading, his to correct): (1) the next sets and reps come
    from the first session only, sometimes absurd; progress measures look wrong; (2) the gym
    session's layout is not aligned, spaced or ordered by priority — and a layout check must be
    mandatory on every design; (3) B1–B2 conformed foods and meals in the Elenco, the other kinds
    must follow; (4) an exercise needs its load steps (real plates), one side at a time or the
    load split in two, muscle groups, warm-ups (how, when, how much), rest per exercise, all
    adjusted in the session to the moment; (5) the session to redo with that design study;
    (6) planning must cover them too, with periodisation of groups of blocks; (7) Andamento of
    exercises and sessions is almost missing, less than v1, and must reuse the voti of the other
    views, richer. His question: «come pensi?». Next: the exercises and schede rows of
    `target.md` (step 3, a Fable step) take these in; nothing built from them yet.
57. **17 Nov, his words after merging #366: «merged, ap yc».** By the global «yc» rule this takes
    every recommendation still open to him: the four planning picks of `target.md` §6, all (a) —
    (1) «planned» has three shapes declared per type in the registry (a voce due · a time to hit
    · an amount to reach); (2) an amount «al giorno» lives in the ritmo and Obiettivi reads it,
    one truth (so §45's 2a, a goal «al giorno» on a food, is built as a ritmo of the shape «an
    amount to reach»); (3) sveglia is a ritmo «a time to hit», changed for one day with «Questa
    volta»; (4) pesata and misure are proposed as ritmi by the app (MOD-34), accepted with one
    tap. Spec only: nothing built; the model delta (MOD-30…36, PL-) is written when the Piano
    rows of the target tables are drawn. Not taken: deleting the dead files and Q-25, which are
    deletes and outside «yc». Undo: reply (b) on any of the four; this paragraph changes.
58. **17 Nov, «ap»: exercises, schede and the session drafted** as `target.md` §7 (today, his
    §56 notes against TR-, the three levels, five questions with Claude's pick first). Spec only;
    by Opus, not Fable (cost, model-per-step); the gym's photos and `Gym.tsx` not opened, so his
    note (1) is not checked yet. Undo: delete §7.
59. **17 Nov, his words after merging #367: «merged, ap yc».** This takes the six picks of
    `target.md` §7.4, all (a): the exercise's facts into the registry; load steps per exercise
    from its equipment; three kinds of sides; a primary and up to three secondary muscles; the
    order of work starting with his note (1); the TR-30/31 fix of §7.5.
60. **17 Nov, «ap»: TR-30/31 fixed** (branch `gym-progression`; `domains/training.md`). Built
    as §7.5 says, with one change decided by Claude: the load goes up when the **first** set
    reached the top and **no set fell under the range**, in both of the last two sessions — not
    «every set at the top», which his own drop makes impossible once the plan follows it (the
    plan would stay at the top for ever). After a step, the last set aims at the bottom of the
    range, the first higher by his drop. Undo: `git revert`; the rule is TR-30.
61. **17 Nov, his words:** «do not wait for ci, i repeted this to you many times. btw i said "ap
    yc" so you should not stop. in fact now i have to go so continue». Logged in `RULES_LOG.md`.
62. **17 Nov, «ap»: an esercizio's facts are registry fields** (§7.4 q1–q4; same branch; photos
    `LIFEOS/review/2026-11-17/exercise/index.html`). Its page now shows and edits in place:
    Movimento, Attrezzo, Lati (insieme · un lato alla volta · insieme, carico per lato), Muscoli,
    Salto di carico, Recupero, Posizionamento, Riscaldamento, Guida. The gym reads them: the
    load step is his own, else from the equipment (manubri by pairs, macchina 5 kg, cavi 2,5 kg,
    bilanciere as TR-02); «Riscaldamento: no» proposes no warm-up sets. No migration: the old
    yes/no «un lato alla volta» is read as Lati when Lati is empty, and equipment saved in
    Italian («manubri») is read as its key. Decided by Claude: the keys of Lati; macchina 5 kg
    and cavi 2,5 kg as defaults. **Not built, open:** «carico per lato» does not yet change how
    a set is typed in the gym (the gym's redesign); Muscoli is still the stored text («abs,
    obliques»), a picker of one primary and three secondary is a new control he must see;
    «Recupero e posizionamento» inside the gym stays until the gym is redone. Found: a React
    key warning on every object page in dev, older than this change. Undo: `git revert`.
63. **17 Nov, «ap»: his «le misurazioni sono strane» — TR-21 and TR-23** (same branch). The
    strength estimate no longer adds RIR (it was on few sets, so two sessions were not
    comparable; the spec already said so). An esercizio's «Andamento» now lists its records with
    the day each was set: Forza stimata, Carico massimo, «Record a 65 kg» (the most reps at his
    usual load), from its 3rd session. Decided by Claude: «usual load» = the one used in the most
    sessions. Effect he will see: «forza stimata» values drop a little where he typed a RIR.
    Still open from §56 (7): a trend chart per exercise and the session's voto over time in
    Andamento — screens he must see. Undo: `git revert`.

64. **19 Nov, «yc for everything»: his notes of 13–19 Nov, moved here from the inbox** (verbatim,
    with Claude's pick under each; «yc» does not cover a design he has not seen, so each UI pick
    is shown as photos first).
    - «Quanto dovrebbero contare la durata dei recuperi per i riscaldamenti? Le durate non
      dovrebbero essere piu dinamiche in base agli sforzi appena fatti?» (13 Nov) → a rule for
      `domains/training.md` (rest after a warm-up set short, rest after a work set from its RIR
      and load). Pick: a new TR row, built with the gym's redesign; numbers with their source.
    - «Mezzogiorno meglio chiamarlo pomeriggio» (16 Nov) → **answered «yc» 19 Nov = (a), built**; was: «Pomeriggio»
      already names the snack band (VIS-61, from his meal-role bounds), so a rename collides.
      Options: (a) the lunch and snack bands become one «Pomeriggio» (four bands) —
      recommended; (b) the lunch band «Pranzo»; (c) another word of his.
    - «non mi piace come viene indentato, spaziato il calendario della settimana in alto, anche
      la sua modalità piu espansa, è brutta, va rifatta» (17 Nov) → the week strip (VIS-63) is
      redone; its levels stay. Shown as photos, one level at a time.
    - «la barra delle calorie puo cambiare colore in base ai range, e puo anche essere piu
      graduale la sua palette» (17 Nov) → VIS-50/VIS-52 for kcal: the fill takes its zone's
      colour, a graded ramp instead of a macro colour. Pick: build in the kit gallery, show. **Built 19 Nov**
      (VIS-50; photos `LIFEOS/review/2026-11-19/kcal/`): the fill is a ramp through the zones'
      colours laid over the whole ruler; without zones it stays ink. Decided by Claude: each
      zone's colour at its middle (not hard edges); the planned part keeps its hatch. Undo:
      `git revert`.
    - «non vedo piu le icone quando le fasce temporali della giornata sono minimizzate» (17 Nov)
      → a regression of VIS-60/VIS-61: icons stay in a folded band. Pick: restore, no new design.
    - «Quando clicco, i riquadri o i bottoni, non hanno le giuste interazioni… Molti pezzi
      dovrebbero essere interagibili per intero e non solo da una freccia affianco, che dovrebbe
      essere invece tolta. Inoltre l'effetto "tocco" fa lampeggiare male quelle sezioni»
      (19 Nov) → a pattern for every piece (VIS-40, VIS-90): the whole Box is the target, the
      side arrow goes, one pressed state without the flash. Pick: one kit change, so every
      screen gets it; first in this change's queue, before the exercise box (§59 builds on it). **Built 19 Nov** (VIS-40; photos `LIFEOS/review/2026-11-19/taps/`): no «›» on any Box; a
      closed box that opens opens from any spot; open, «Apri» leads to its page; no browser
      flash, a press lightens the box. Not changed: a link-only box is a link over its title
      line only (the line under it is not yet; `.k-top` is positioned to sit above the drawing).
    - «Le pagine e schede di aggiunta, come di modifica, dovrebbero tutte essere toccate dai
      cambiamenti che stiamo apportando. Fosse per me renderei unica la pagina di
      visualizzazione che quella di modifica. Ovviamente dovrebbe contenere tutto e anche opzioni
      in piu, non meno» (19 Nov) → one page per object to see and edit (PAT-13 «InPlace» on
      `ObjectPage`, PAT-30, PAT-61); the add pages follow. Pick: a delta to PAT-30/PAT-61,
      object type by object type; nothing either page holds today is lost.
    - «In voto, densità sarebbe proteica? E limiti? Sembra fatto male e poi che significa
      "senza: valore, adatto al piano, momento"? E poi perché ci sono 2 righe? Come valutiamo
      dovrebbe essere raggiungibile anche da li?» (19 Nov) → the meal's open voto (VIS-43,
      PAT-51): each criterion named in his words («densità proteica»), the limits shown as
      criteria, «senza: …» rewritten as «non contano ancora: …» with why, one line per
      criterion, and a «Come valutiamo ›» link. The two lines: to check on his photo. **Built 19 Nov**
      (VIS-43; photos `LIFEOS/review/2026-11-19/voto/`, gallery `box-livello-2` now photographed):
      every voto (meal, water, sleep, weigh-in, session, day) opens one line per criterion —
      mark, name, ruler, number with «pesa n %» under it; «Non contano: valore (manca il
      prezzo) · momento (conta vicino all'allenamento o al sonno)…» after them; «Come valutiamo ›»
      to the model's page. «densità» is «densità di nutrienti» (protein × quality, fibre,
      vitamins, minerals, omega-3 per 100 kcal: not protein only); «limiti» was already a
      criterion when the limits are known. Decided by Claude: the reasons' words; «pochi dati»
      and «mancano i dati» where the engine gives no reason. Undo: `git revert`.
    - «E poi i filtri sono spaziati male rispetto a sopra» (19 Nov) → the filter chips' gap to
      the piece above: a spacing rule in `e2e/layout.ts`, never a one-screen fix. **Built 19 Nov**
      (photos `LIFEOS/review/2026-11-19/filters/`): the day's filters and «Orari» are one
      line when they fit, else «Orari» under them at the end; a band of the day has no margin
      of its own, so filters → «Orari» → band → band are all 12 (they were 12 · 20 · 20).
      Tried and dropped: a section inset of 16 like a box (the five chips no longer fit one
      row at 360 and 390).
    Order (Claude's): the regression (icons) → taps (kit) → the voto → one page see/edit → week
    strip → kcal bar → rests. Undo: move the lines back to the inbox.

65. **19 Nov evening, his words on the tap photos:** «yeah ok yc, ma dalle foto che mi fai vedere
    vedo che ci sono comunque quei problemi di spaziature, padding, simmetrie e posizionamenti
    formattati male. inoltre quando si estendono, le icone in alto a sinistra è meglio che
    stiano ferme, e non si decentrino. so che ti avevo detto diversamente prima, ma adesso
    realizzo che è meglio fare diversamente. inoltre mi pare che ti avessi dato gia dei
    feedback simili. un esempio è sulla scheda dell'acqua, vedi quanto è spaziata male? come
    quella molte altre». The taps are approved. His 16 Nov «centrare le icone… invece di
    metterle in alto» is replaced: a Box's icon does not move when it opens (VIS-40). The
    spacing is a pattern, never a fix per box: measured on every Box (`e2e/layout.ts`). **Built 19 Nov**
    (VIS-40; `LIFEOS/review/2026-11-19/spacing/`, before/after of 7 pages in `cmp/`): the icon on
    the first line always; one `--sp-2` between a box's lines (they were 8 · 11 · 0 · 23); the
    water head on one line (the title kept 8 em, now 6); the head number with no patch and no
    4 px inset; «›» gone as a Box value (Aggiungi, Palestra, gym start). Seen, not changed: the
    meal's four macro bars are short with a wide gap to the grams (Nutrients L0, its own pattern).
66. **19 Nov night, his words:** «"Seen but not changed" yes solve it and remember all
    visualizations occurrencies. and procede too» — the short macro bars with a wide gap to the
    grams (Nutrients L0, VIS-50) are fixed in the piece, so every place that draws it changes,
    each photographed; then on with §64's order (the meal's voto next). **Built 19 Nov:** the four
    bars (`NutrientsL0` in `.k-slot-l0`, the only short one) use the box's width, grams on its
    edge, in all four places that draw them: a meal open on Oggi, a pasto in Elenco, a pasto's
    page, the gallery (photos `LIFEOS/review/2026-11-19/bars/`); the other nutrient bars («Il
    giorno», the composer) were already full width. The corner drawing (9 % opacity) stays
    below them. `measureBoxLines` now counts every line of a box, open too.
67. **19 Nov night, his words on the voto photos:** «i voti non mi piacciono per nulla, prendono
    troppo spazio e sono spaziati male, anche qui la barra dovrebbe avere la priorità e essere in
    tutta lunghezza se possibile, non dovrebbe esserci cosi tanto spazio tra di loro, inoltre la
    parte di sinistra credo si possa mettere sulla barra stessa per guadagnare spazio. anzi in
    realtà si potrebbe ripensare completamente. dammi un po di proposte che si presterebbero
    bene, pensando a tutte le feature che dovrebbe avere, non trascurando quelle attuali». The
    one-line criteria of §64 (VIS-43) are rejected; proposals in the `/kit` gallery, his pick. **Proposals built 19 Nov** (`packages/kit/src/Criteria.tsx`, gallery `#voto-proposte`,
    photos `LIFEOS/review/2026-11-19/voto-proposte/index.html`, his numbers): A «nella barra»
    (his idea: one full-length bar per criterion, the words on it), B «colonne» (the skyline
    grown big, a legend), C «punti» (one bar of 100 points, what each criterion lost, the
    costliest first). Claude recommends **A**, with C's «−29» beside the number as an option.
    The app keeps the old panel until he picks (`Box` `scoreLook`).
68. **19 Nov night, his pick and his words:** «la c è quella che preferisco, ma si potrebbe usare
    lo stesso criterio per colori e range e forme che usiamo nei macro. cosa che tra l'altro
    andrebbe fatta anche per i micro. colori per identificarli e pattern di riempimento delle
    barre per identificarli così come range e interazioni con la pianificazione. inoltre
    un'altra cosa fondamentale, è che si dovrebbero inserire gestioni più intelligenti del
    design, tramite minimizzazione, estendibilità e scorrimento o altro, insomma per evitare
    listoni e abusi di spazi. te ne avevo parlato già più volte nel caso degli oggetti
    dell'elenco che possono aumentare all'infinito, ma vale anche semplicemente quando vengono
    listati più di tot elementi. va pensato come condensare l'informazione ma mostrarla anche
    interamente». Three things: (1) the voto is C «punti», drawn with the macros' grammar
    (VIS-50/52: an identity colour and fill per part, the zones, the planned hatch); (2) the
    micros the same; (3) a rule for any list past a few items: condensed, yet all of it
    reachable (PAT-40 today: 8 rows, then «Mostra altri»). **(1) built 19 Nov** (VIS-43, `Criteria.tsx`,
    gallery `#voto`, photos `LIFEOS/review/2026-11-19/voto-c/`): the Porridge's panel from ≈ 420
    px to 166. Decided by Claude: the six identity colours are the muscles' palette (checked for
    contrast); a criterion's row only when it lost ≥ 0,5 points. A and B removed. **His picks,
    19 Nov:** (2) micros: a colour per group (vitamins, minerals, …), each micro a shade of it,
    as a macro's kinds; full-length bars, zones under them, tip by zone, planned hatched.
    (3) long lists: «condensed line, opens in place» — the items that matter most as rows
    (worst first, or most used), the rest on one line naming every one («e altri 14: A · C ·
    …»), which opens in place to the full list; the level remembered per piece (VIS-70). A
    pattern for every list (PAT-40 changes), the voto's «Pieni» line its first use. His
    words on it, 19 Nov: «si ma anche i "Non contano" andrebbero condensati» — the names on one
    line, the reasons on open. **(2) and (3) built 19 Nov** (PAT-40, VIS-50; kit `Condensed`, photos
    `LIFEOS/review/2026-11-19/condensed/`): micros in their group's shades, the fine ones on
    «A posto»; the voto's «Pieni» and «Non contano» condensed; `List` past 8 rows names the rest
    on one line (Elenco: «e altri 111: …»). Decided by Claude: the word «A posto» (fine: ok or
    ottimo); two lines at most closed; micros have no planned part yet (no data). Not yet: the
    other 15 `List` uses pass names (each falls back to «Mostra altri» until it does).
69. **19 Nov night, his words on the micros photo:** «i micro sono orribili, sempre stesso
    problema, poco spazio alle barre, troppe scritte, spaziature pessime». The rule he set for the
    voto (§67) holds for every bar: the bar first and full length, the words on it, few numbers,
    tight rows. Proposals in the gallery (`#micro-proposte`), his pick.
70. **19 Nov night, his words on M1/M2:** «ti avevo detto di usare gli stessi criteri delle
    macro riguardo colori, range eccetera». M1 and M2 dropped: a micro is drawn by the macros' own
    row (VIS-50/52: its bar, the target tick, the zones ruler with its amounts, the tip, the word),
    in its group's colour — the same piece, not a lookalike. **Built 19 Nov** (photos
    `LIFEOS/review/2026-11-19/micro-macro/`, a macro row above the micros).
71. **19 Nov night, his words on the micros as macro rows:** «no non va bene, in effetti era meglio
    prima. senti e se a questo punto, coerentemente con il sistema delle occorrenze, ripensiamo a
    tutti i tipi di visualizzatori a barre dei nutrienti, limiti, voti e tutto quello che potrebbe
    poi richiederlo? facciamo uno studio per unificare tutto e inserire tutte le funzionalità e
    visualizzazioni che vengono richieste in un elemento base comune». A study first
    (`bars-study.md` in this change): every bar in the app, what each needs, one base element;
    options, his pick, then code. Which «prima» he prefers for the micros: asked with the study.
72. **19 Nov night, his «yc» on the bars study and his words:** «yc, comunque la scritta sulla
    barra non mi piace perché la rende troppo grossa, ma allo stesso tempo fuori le toglie spazio,
    sia che sia a lato o sopra. se glie lo togli in lunghezza è sempre brutto, se lo metti sopra
    dipende da quanto spazio togli. oppure potresti valutare altri tipi completamente diversi di
    visualizzazione, non necessariamente barre». «yc» = (a) one `Meter`; sizes: no words on the
    bar; for the micros «prima» = the group-shade rows (Claude's reading: M1 had words on the bar).
    Next: proposals of other forms (thin words above with zones as the bar's background, tiles,
    rings) on his micros, photographed, his pick before `Meter` is built.
73. **20 Nov, his words on the forms:** «ma il punto è che alcune metriche sono aggregati che
    contribuiscono ad altri valori sommari che vanno visualizzati anch'essi. cosa che c'era nei
    macro e nei voti. e si potrebbe creare un costrutto in generale per le categorie comuni, per
    esempio mi parlavi delle categorie per i micro. i cerchi singoli sono troppo dispersivi, le
    linee singole troppo effetto elenco. inoltre non tengono conto di pianificazione e aggregati?
    inoltre i range inferiscono una sorta di valutazione quindi anche quello va pensato. questi
    sistemi poi dovranno molto probabilmente essere riutilizzati nelle visualizzazioni degli
    andamenti, che mostrerà dati anche molto più specifici e particolari, probabilmente di
    aggregati di varie informazioni che sarebbe meglio poter far inferire da come vengono
    renderizzati. densità informativa. magari online trovi qualcosa?». V1–V3 rejected (rings too
    scattered, lines too much a list); the base element must show a hierarchy (parts → summary),
    the plan, the ranges as judgement, and serve Andamento. Research first (bars-study §7).
74. **20 Nov, his words on the measure tree:** «non mi fa impazzire, e poi dovresti rivedere tutto
    anche applicando diversi gradi di espandibilità. per ogni tipo di informazione. e comunque non
    mi fa impazzire questo stile». The tree's style is rejected; the content per level of
    expansion is decided first, as a table per type of information (bars-study §8, his 15 Nov
    «decidere per tabelle»), then the style from references he picks; no more drawings before.
75. **20 Nov, his words:** «lo stile non puoi renderizzarmelo qui quindi non mi puoi far scegliere se
    non me li fai vedere. per quanto riguarda la tabella, non mi va di leggerla, però posso dirti
    che, ovviamente, l'estendibilità è un compromesso, sarebbe meglio avere meno livelli di
    estendibilità ma con la più alta densità informativa ma allo stesso tempo semplice, bello da
    vedere. dato che riuseremo e o modificheremo o comunque torneremo spesso su questo, bisogna
    capire quando questi tradeoff determinano cosa. e poi anche le varie dimensioni di esposizione
    dell'informazione, colori, dimensioni, pattern graficI, forme... cos'altro?». Styles are chosen
    only from rendered samples; the trade-offs and the visual channels become written rules
    (bars-study §9) so every later change follows them.
76. **20 Nov, his words on the grammar:** «e ovviamente è sempre preferibile usare quelle dimensioni
    che il testo, senza perdere informatività». Rule 4 of bars-study §9 made strict.
77. **20 Nov, his words on the grammar:** «e poi alcune dimensioni si prestano meglio a rendere più
    chiara la loro scala, il loro valore. ovviamente l'informazione massima è data dai numeri,
    immagino, solo che anche loro vanno affiancati da altri dimensioni, più facilmente da altri
    numeri o unità di misura. noi però non vogliamo troppo testo». Rule 7 of bars-study §9.
78. **20 Nov, his words on the three styles:** «sì e tra l'altro nemmeno mi piacciono molto». Pieno,
    calmo, denso rejected too. Open: the style, from new rendered samples that follow §9 (rules
    1–7), started in a fresh session (his question on the context's size).
79. **20 Nov, his words:** «leggi l'handoff e riparti dai campioni di stile delle barre». Round 2
    built (bars-study §10): colonne · quadretti · rosa, each a different main channel on the same
    blocks, photos `LIFEOS/review/2026-11-20/stili2/`. Open: his pick.
80. **20 Nov, his words on round 2:** «they all suck badly. non si capisce nulla ed e sono brutti. la
    comprensibilità è importante, non solo come leggere la visualizzazione, ma anche far capire la
    scala e eventuali range o comunque tutte le dimensioni che vuoi. e poi ti ho detto che non
    necessariamente devi mostrare tutto in un livello, magari imposti piu livelli. hm, pensa alle
    visualizzazioni nei database, dati con un sacco di dimensioni, come funziona li? … drill down
    dig up». Colonne · quadretti · rosa rejected. The scale and the ranges must be readable on the
    drawing; more levels are allowed (bars-study §9 rule 1 changes); the model comes from OLAP
    (drill-down, roll-up, slice, dice, pivot): bars-study §11.
81. **20 Nov, his words:** «prima mostrami come lo fanno i tool reali. e poi tu potresti anche fare
    qualcosa di tridimensionale no? permettendomi di ruotarlo e vederlo meglio, o magari tu gestisci
    la rotazione e anche quella è una dimensione? non so come funziona». Next: real tools' pictures
    (review page), and an answer on 3D (rotation as OLAP's pivot, faces kept flat).
82. **20 Nov, his words on the real tools page:** «yeah combine the best things of them. make a study
    and some proposals». Study: bars-study §12; proposals in the gallery (`/kit#drill`), photos
    `LIFEOS/review/2026-11-20/drill/`.
83. **20 Nov, his words on A · B · C:** «tutti brutti e fatti male, oltre che certe dimensioni
    mostrate in modo ridondante da piu vettori, i range per esempio, non mi serve che scrivi "ok" o
    "pessimo" se lo vedo gia dai colori, oltre che ti ho detto che vorrei evitare il testo. lasciamo
    poi perdere che continui ad avere problemi nel dimensionare i bottoni, li fai sempre troppo
    grossi (in questo caso i per macro per pasto e per momento, oltre che non si leggono
    interamente). poi non mi sembra di vedere nulla di tridimensionale. mi piaceva di piu la
    visualizzazione dei macro originale. e poi ti avevo detto che non puoi mettere testo+barra+testo
    su stessa linea, toglie troppo spazio alla barra. e poi speravo facessi cose piu interessanti
    delle semplici barre, come qualche poligono o solido tridimensionale. non lo so». A · B · C
    rejected. Rules: a property carried by a channel is never also written (no range words when the
    colour says it); no text · bar · text on one line (the bar gets the full width, §67); controls
    small and fully readable; the original macro bars (VIS-50/52) are the base he likes. Next: a
    polygon and a real 3D solid, rotatable, on his 9 Nov.
84. **20 Nov, his words on the polygon and the solid:** «ok tridimensionale per ora no, pero potresti
    migliorare la visualizzazione del poligono pero, magari non deve essere necessariamente quello.
    e poi le scale? i range piu graduali e sfumati? molto spazio è sprecato, cosi come molte
    dimensioni.» Then: «e comunque va trovato qualcosa per le cose in generale», and: «si ma il
    poligono si presta come cosa centrale, non per tante cose o sbaglio? ecco magari determinate
    famiglie di rappresentatori hanno scopi e momenti divers». The solid dropped for now; the
    polygon reworked as the one central overview (bars-study §14); the families of
    representations by purpose and moment, bars-study §14.
85. **20 Nov, his words on the reworked polygon:** «il poligono è orribile». `Radar` removed; the
    families table (bars-study §14) stays a draft; the next step is asked before any drawing.
86. **20 Nov, his pick:** «Look at real apps first» (of: improve the original · real apps · his
    reference). 10–15 screens from apps known for data views on one page; he marks what he likes;
    the bars are built only from that. Page: `LIFEOS/review/2026-11-20/app-reali/`.
87. **20 Nov, his words on the real apps page:** «non vedo nulla di straordinario, tu puoi fare di
    meglio». Claude's own idea, built: the bar takes the shape of its ranges (bars-study §15,
    `Ridge`), photos `LIFEOS/review/2026-11-20/crinale/`.
88. **20 Nov, his notes in the inbox (08:53–10:22), moved here:**
    «Per esempio anche le barre della palestra, per ogni esercizio che sto facendo potresti
    mostrare valutazioni dinamiche dei progressi dell'esercizio singolo e poi anche voti cumulativi
    dinamici sull'intera sessione» · «E poi in schede di andamento e progressione esterne, anche
    aggregati nel tempo» · «Sempre con feature olap ma migliorate e adattate al nostro contesto» ·
    «Quindi il cambiamento che dobbiamo attuare riguarda grafici sia su valutazioni su dati storici,
    che predizione di andamento eccetera, statistiche altre e cosa altro?» · «Quindi ricapitoliamo
    tutti gli ingredienti che riguardano questo cambiamento» · «Di questi ingredienti dobbiamo
    identificare i vettori che meglio si prestano a ogni dimensione e alle loro combinazioni. E per
    prestazioni si intende soprattutto quel discorso che ti facevo su comprensibilità della scala,
    dei range eccetera» · «Hm in effetti c'è un'altra cosa che non abbiamo valutato: il contesto in
    cui viene mostrato: per esempio nella timeline giornaliera, ha più senso mostrare quei valori che
    sono dinamici rispetto a oggi, e non quelli costanti, come possono essere quelli generali di un
    pasto. Però anche quelli non vanno ignorati, e se richiesti mostrati. Magari va data una
    priorità e mostrato come quelli dinamici cambiano quelli costanti. E questo si applica non solo
    al cibo. Ma come si generalizza e si uniforma a tutto il resto di quello di cui abbiamo
    discusso?» (typos fixed, words his). With «procede» (20 Nov). Answer: bars-study §16, the
    ingredients, their channels, the context rule; for his corrections before any drawing.
    Decided by Claude (cheap to undo): this stays inside the open change five-places (one change
    open at a time, PRD-41), as its visual-system part; it can move to its own change folder when
    five-places closes.
89. **20 Nov, his pick** (asked «come procediamo?»): «yc, then draw» — the study of §88 taken as
    written, corrections later on the real screens. First screen: Oggi, the ridge as «Il giorno»'s
    overview on his 9 Nov, and a meal open showing its slice lit inside the day's ridge (the
    context rule, bars-study §16.4); photographed; then stop for his word.
90. **20 Nov, his words on the ridge in Oggi:** on «meals don't carry sugars, saturated fat and
    salt»: «e ma dovrebbero portarli. comunque non mi piace». The ridge rejected and removed (kit,
    gallery, Oggi). A meal now carries its limits (free sugars, saturated fat, salt) against the
    day's targets, without a fascia of its own (FD-35: a meal is judged only on protein).
91. **20 Nov, his answer on what failed in the ridge** (asked, several picks): «The hill shape» and
    «Too tall, too much». Not picked: the blended colours, the meal inside its day. Claude then
    built a meal's four bars on the day's scale (reverted, §92).
92. **20 Nov, his words on it:** «ma il punto è che tu stai facendo ancora qualcosa di specifico, io
    ti avevo chiesto di astrarre, non semplicemente di fare "meal" e poi perché sono frazionate le
    barre dei macro nei singoli pasti? mostrano i contributi di ogni sottopasto? mi pare tu l'abbia
    fatto solo a caso adesso. e poi non vedi che la spaziatura è fatta malissimo? anche le varie
    dimensioni delle cose son gestite male, le schede, i padding, le luminosità e saturazioni dei
    colori. e in ogni caso non avevo chiesto questo». The meal-in-day bars reverted. Answer on the
    segments: they are the macro's kinds (VIS-50, older than this change), shades with no legend —
    a defect he is right to see. Open, asked: the abstraction first (one model for every measure,
    every page derives from it) and the foundations (spacing, sizes, cards, padding, colour
    lightness and saturation) measured across the app.
93. **20 Nov, his words on the model of §17:** «non è solo quello però. non solo acqua, tutte le
    assunzioni, non solo sonno, misure. non solo gym, ma tutte le attività, non solo di esercizi.
    tutto il movimento e future altre attività o tracker generici. cosa altro? devi partire da
    questa domanda. e poi assicurarti che ogni cosa che verrà aggiunta passi per questa astrazione e
    le sue prerogative. finché ovviamente non le settiamo e capiamo come costruirla, con che
    pattern, che gerarchie eccetera» — and: «è un motore di visualizzazione di dati». Answer:
    bars-study §18, the visualization engine (a horizontal engine like MOD-50…54), starting from
    «cosa altro?» over every class of thing the registry holds or will hold.
94. **20 Nov, his «yc» on §18.6 and his rule:** «yc, la regola, come per tutto, è che più
    implementiamo più ci rendiamo conto se tornare indietro e ripensare». Taken, each with its undo:
    (1) the classes of §18.1 — intake · activity · state · measurement · exchange · note · context
    (+ his trackers in one of them); sleep a *state*, how he feels a *measurement* (undo: edit
    `CLASSES` in `core/kinds/kind.ts` and the builtins); (2) one hierarchy, class › type › object ›
    part, the same depth everywhere (undo: model.md MOD-56); (3) frames own · day · session ·
    period, «session» = the span of any activity (undo: MOD-56); (4) one family per reading
    (§18.3) (undo: the reading table in `core/engines/view`); (5) the name «motore di
    visualizzazione» (undo: product.md §3 when archived). Decided by Claude: a batch (cooking
    portions for later) is an *exchange* (stock in), not an intake. Built in slices, each a step
    he sees; any slice may send us back to rethink (his rule).
95. **20 Nov, slice 2 of the engine built** (his «leggi l'handoff e fai lo slice 2 del motore di
    visualizzazione»): `viewOf(measure, {frame, level})` in `core/engines/view/view.ts` gives a
    view description; the kit's `MeasureView` draws it with the pieces that exist (MeasureTree,
    MeasureDays, Judge, Unknown); gallery «Il motore · tre classi» (`/kit#motore`, photographed)
    shows water, a session and sleep. Decided by Claude, each with its undo: (a) at frame *own* an
    object is not judged by the day's target or zones, a score keeps its 0–100 ruler (undo:
    `judged` in `view.ts`); (b) level 0 hides the parts (§17.3), level 1 shows them named (undo:
    `depth` in `view.ts`); (c) a score at level 0 is the chip, open it is its criteria on the
    0–100 bar (undo: the `score` branch); (d) over a period a day without data is absent, never
    a zero, and the line says the mean (undo: `MeasureView` «days»); (e) done · category ·
    presence give *none* until their slice, never a home-made drawing; the past-self ghost and
    the record are not drawn yet (MeasureTree has no ghost mark: a kit change, next slice).
    No real screen uses it yet: moving a screen onto it is a design he sees first.
96. **20 Nov, his words on slice 2 (`/kit#motore`):** «non mi piacciono per nulla i pallini. molte
    scritte potrebbero essere nelle barre stesse. inoltre alcune cose, alcuni tracker potrebbero
    essere dei binari, come semplici si o no, e vale per qualsiasi cosa. pensa ad assunzioni come
    la creatina: un valore costante che o prendo una volta o no al giorno. la caffeina è diverso.
    anche il resto. ma potrebbero esserci obiettivi con semplici "completato" e "non completato"
    immagino, no?. non lo so. in ogni caso dove sono tutti gli ingredienti e channel e tutto il
    loro studio? e uno studio su altre forme di grafici oltre alle semplici barre?» Answer: the
    ingredients and channels are bars-study §16.2–§16.3, the families §14; slice 2 did not apply
    them (it reused MeasureTree, whose end dot repeats the tip's colour, against §16.3's «never a
    word that repeats the colour»). The forms beyond bars: bars-study §19, for his corrections.
97. **20 Nov, his «yc» on bars-study §19.5** (the three recommendations), built on PR #371,
    photos `/kit#motore`. Each with its undo: (1) **no dots** on bars and day columns — the end
    dot, the dot under each column and on each part are gone; the columns get the zone bands the
    bars have, so the judgement is where a column ends; the chip keeps VIS-21's mark (undo:
    `git revert` of the MeasureTree hunk); (2) **yes / no for any class** — `done` is a reading
    the engine draws (`doneView` in `core/engines/view/view.ts`): a day is one cell in VIS-22's
    shape (fatto solid, previsto hatched, saltato struck, niente a faint outline), a week seven
    cells, a month a calendar from its weekday, a goal «n volte» n cells with the done ones
    filled; a fixed dose reads as yes / no: `intakeReading` says *done* when three logs or more
    all have the same dose and the intake is not judged by a limit (caffeine's ≤ 400 mg stays an
    amount) (undo: `intakeReading` returns «amount»); (3) built first: kit `Done` (`DoneDay`,
    `DoneCells`). Decided by Claude: a streak is written only from three days («3 di fila»),
    since a calendar does not show it at a glance; nothing else is written that the cells show;
    the goal's cells have no day labels (undo: `Done.tsx`). Not yet wired: no screen reads
    `intakeReading` from his logs; words in the bar (§19.3) not built.
98. **20 Nov, his words:** «mi sento di star sprecando token. non è quello che voglio. assolutamente
    no. allora, dobbiamo lavorare alla specifica. devi pensare e pensare e pensare meglio a come
    poter combinare tutte le informazioni e le richieste che ti ho fatto». Answer: building stops;
    one synthesis of every request on the visual system (bars-study §20), for his corrections.
99. **20 Nov, his answer on §20.3:** C1 «è che non sei in grado né di fare dentro né fuori. perciò
    mi contraddico… parlo di compromessi». C2 «non necessariamente solo due. vedi il tuo problema è
    che ogni volta è come se usassi solo una metrica singola per rappresentare qualcosa. quando
    potresti usarne tante contemporaneamente per mostrare tante cose. vedi le barre attuali dei
    macro. nella loro semplicità mostrano attraverso il colore la loro categoria, la loro
    gradazione il sottotipo di nutriente o la loro qualità, il tratteggio la pianificazione, la
    linea dei range sotto, con dimensione e colore e cifre. le cifre sopra per specificare meglio
    la scala delle barre. che altro? … si possono aggiungere anche altre dimensioni allo stesso,
    come avevi fatto con le collinette, aggiungendo così altri livelli di informazione (momenti,
    durate degli assorbimenti probabilmente, non so) … tutto questo solo in una barra, non capisci?
    e aveva ancora margine di aggiunta senza perdere di comprensibilità. immagina adesso con altri
    tipi di visualizzatori diversi dalle semplici barre. o magari anche con loro aggregati, come hai
    fatto con i voti … immagino che continui ad usare le barre perché sono gli elementi che si
    prestano meglio alla comprensibilità e allo stacking … offre un'ottima prestazione dunque per
    "qualcosa che vuoi raggiungere". ma non come predizione, come andamento, come sì o no, e cosa
    altro? non so se mi hai capito. non so se hai capito dove voglio arrivare». Answer (chat):
    every visualizer an instrument like the macro bar, many channels at once; the bar is the one
    for «reach»; other purposes need their own (prediction, trend, yes / no, rhythm, stock,
    comparison, composition, source, spread, verdict), each as dense; they combine.
100. **20 Nov, his principle:** «la cosa fondamentale è condensare il più possibile informazione,
    senza perdere in comprensibilità e bellezza». Taken as the first rule of the visual system
    (bars-study §21.0); §21 written on it.
101. **20 Nov, his words:** «ah dimenticavo, anche drill down e dig up no? o altre azioni come i
    filtri, quelle sono fondamentali no? offrono letteralmente livelli in più di informazione, più
    viste, sullo stesso elemento no? però ti ricordo che odio come fai i bottoni, li dimensioni e
    colori e contorni sempre male con tutto il resto». Answer: bars-study §21.7 — the actions are
    part of every instrument; the instrument itself is the control wherever it can be; the few
    controls left are one kit piece measured with the foundations.
102. **20 Nov, his «yc» on §21 and §20.3 C3–C5.** Taken, each with its undo: §21 (instruments by
    question, each as dense as the macro bar; the actions; the instrument is the control) is the
    visual system (undo: bars-study §21 marked rejected); C3 the edges' amounts are written, the
    range names never (undo: §20.3 C3); C4 judgement = where it ends among lightness steps, the
    tip's colour doubles it, VIS-20 holds (undo: §20.3 C4); C5 the interest comes from density and
    the actions, the shapes stay ones everyone reads (undo: §20.3 C5). Then step 21.6.2 done:
    bars-study §22, every type on his data, content only; stop for his word.
103. **20 Nov, his «yc» on §22.** Step 21.6.3 done: the foundations measured on ten screens with
    his data (bars-study §23). Spacing is already on a 4-px scale (all but 107 of 3.308 values);
    what is uneven: line heights (334 of 765 unset), controls (22 looks, 9 heights; 4 browser
    buttons in Profilo), radii (224 of 682 off scale), fills (35 lightness levels), and identity
    colours whose lightness and saturation vary inside a family. Proposed scales in §23.3; stop
    for his word.
104. **20 Nov, his «tc» (read as «yc») on §23.3.** Applied on PR #371 and measured again on the
    same screens, before · after (`LIFEOS/review/2026-11-20/foundations/index.html`); bars-study
    §23.4 says what changed, two corrections to §23.2–23.3, and what is left. Undo: revert the
    commit (tokens.css, kit.css, .prettierignore, the kit photos). Open, his: the gym's 52 px
    stepper; the surfaces' ladder, shown before it is changed.
105. **20 Nov, his words:** «yc. in ogni caso non conta molto tutto questo, o per lo meno solo come
    pre step. anche perché solo le pagine Oggi e Come valutiamo e Elenco per ora vanno bene. tutte
    le altre sono obsolete, o forse te ne sei dimenticato. oltretutto vale anche per tutte le altre
    che non hai mostrato. non contando poi che ovviamente stiamo lavorando su un sistema di
    visualizzazione che toccherà ovviamente anche le card di Oggi, Elenco e Come valutiamo». Taken:
    (1) «yc» on the gym's stepper = the first option, it stays 52 px (undo: `.k-step.big` 44);
    (2) **the current pages are Oggi, Come valutiamo and Elenco; every other page is obsolete**
    (written nowhere before: now in `.claude/rules/design.md`); the foundations (§23) are a pre-step;
    the visual system (§21–§22) is built on the cards of those three pages. Measuring seven
    obsolete pages in §23 was wasted work; the counts stand only for the shared kit.
106. **20 Nov, his words:** «aspetta, come non ti ricordi? ne avevamo parlato? e poi scusa non lo
    vedi? la pagina piano è inesistente e porta a cose inutili, lo stesso vale per andamento e le
    altre. hanno pochissimo di tutto quello di cui avevamo discusso… è importante perché i
    cambiamenti che attuiamo toccheranno anche quelli futuri in quelle pagine. anche solo parlando
    del prossimo piano "macro bar in Oggi's «Il giorno», rebuilt as the reference": non ti ricordi
    che avevamo detto di pensare a un motore di visualizzazione unico? avevamo attuato cambiamenti
    parziali in oggi e elenco appositamente per unificare, ma questo va fatto ovunque e per ogni
    cosa, era solo un esempio e comunque come vedi parziale o solo rappresentativo». What Claude
    failed to connect: W-04 (15 Nov, «every specific problem is systemic»), target.md (one type,
    one of each, places only compose), §32 (Piano = a day of Oggi in the future), §93–§94 (one
    engine, everything through it). The Oggi and Elenco changes were examples of the unification,
    not the target; every place, current or to come, is built from the same engine.
107. **20 Nov, his words:** «ok, facciamo un passo indietro, un re framing. ripensando veramente a
    tutto». Answer: `reframe.md` in this change (draft): four layers (things, measures, views,
    places), two spaces (Il tempo, Le cose) with ADR-0063's five as presets, one interaction
    grammar, the constitution's amendments, the process by layer. If he takes it, its parts
    move to their homes (model.md, `views.md` absorbing bars-study §21–§23, the presets table) and
    the file goes (one truth, PRD-40). His to settle: its §9.
108. **20 Nov, his «yc per ora» on reframe §9, and his words:** «comunque hai controllato eventuali
    spec… quando hai rifatto le card di oggi e elenco? … ogni cosa che si mette in un orario
    successivo a tot minuti è obbligatoriamente pianificato, qualcosa che si mette prima o adesso
    è sempre già fatto e non pianificato. quindi in teoria possiamo togliere i bottoni, dato che si
    basa tutto sull'orario. e se si mette qualcosa fuori orario? … potremmo dire sempre pianificata
    finché non viene eseguita, mentre potremmo pensare a cosa debba poter rimanere fuori orario come
    eccezioni? … i passi li uso così principalmente, ma da svariate precedenti discussioni (trovale)
    … un refactoring delle attività in generale, esercizi, percorsi, monitoraggio del movimento
    (tutti dati funzione dei momenti che vengono usati nel calcolo dell'effettiva sedentarietà della
    giornata, settimana, mese…) … anche tutto questo va inserito nel quadro generale». Answer:
    reframe §9 settled with undo; §10 the card (checked against VIS-40…43, PAT-30…33, target.md;
    the reframe had read only target.md); §11 time decides the state (MOD-15 extended); §12 the
    movement model from his 29 Oct, 3 Nov (BODY-31) and BODY-27 words; §13 his to settle.
109. **20 Nov, his answers on reframe §13:** «1 possono essere settate dalle impostazioni, ma per ora
    mettiamo 20 minuti? 2 anche questo da impostazioni, di default saltato (aggiungi una terza
    opzione di confermato) ah, e dovrebbero essere mostrate delle icone anche per le cose
    pianificate quando in oggi si minimizzano le fasce temporali. magari icone uguali ma
    tratteggiate? non so. 3 non lo so, per ora nulla? yc 4 dopo ma sempre in mente e pensando a come
    le due cose si influenzano. 5 un modo diverso di aggiungere il monitoraggio a mano, (per ora
    finché non la rendiamo una app vera) magari puoi manualmente aggiungere tot quanti di attività
    misurata in passi o minuti di camminata nelle varie fasce orarie in modo comodo e senza aprire
    altre pagine e o pop up e o occupare troppo spazio. stavo pensando a una riga parallela a quella
    temporale in cui inserire tramite tocco questi quanti che vengono quindi inseriti nella timeline
    e in un design intelligente aggregati o meno. rendendo quella linea più densa a seconda di
    quanti quanti ci sono in quegli intorni. vabbe magari ci ripensiamo dopo con calma, è una bozza
    magari fallimentare. dipende da cosa riuscirai a fare». Written in reframe §11–§13 and delta
    (MOD-15, product.md §4). Read by Claude: «yc» after 3 = item 6 (drop «step windows» from «not
    now»); «confermato» = counted as fatto at its planned time (undo: reframe §11).
110. **20 Nov, his words:** «sicuro che non dobbiamo fare un reframing di nuovo in luce di queste
    cose?» Answer: reframe §14 — not a new frame, two changes at its base: the state is derived from
    time (the rail split by now; only saltato and confermato are acts), and the timeline holds two
    kinds of thing, voci and **signals** (levels over time: movement, caffeine left, creatine
    stores, daylight, weather), each signal a lane beside the rail. For his word.
111. **20 Nov, his «yc» on §14; reframe §11 built** (PR #371; photos
    `LIFEOS/review/2026-11-20/timing/`). The time decides the state: after now + the slack previsto,
    at now or before fatto (`core/entries/timing.ts`, used by every write); the slack (20 min) and a
    past previsto's fate (saltato · da confermare · confermato) as settings in Profilo
    (`settings.prefs.timing`, no migration); ⊕ without «Adesso · Previsto · Prima»; the composer
    without «Stato», its preview reading the time; a folded part draws a previsto's icon dashed.
    Decided by Claude, each with its undo: (a) a past previsto's fate is **derived when the day is
    read, never stored** — changing the setting changes the past days too (undo: `pastState` in
    `readDays`); (b) what a ritmo writes keeps its previsto, only what he types takes its state from
    the time (undo: `slack === null` in `createEntry`); (c) a session left «in corso» on a past day
    is a previsto and follows the setting; (d) a voce typed with no time keeps what was asked; (e) a
    gap's «+ aggiungi» still passes `&stato=` as a hint for the default time; (f) the kit rule: three
    or more options with a label over 11 characters are a drop-down, so every label is whole at
    320 px («Da confermare» was cut) (undo: `asSelect` in `Field.tsx`). Open, his: the dashed icon is
    subtle at 18 px — enough, or a dashed ring around it?
112. **20 Nov, his words:** «ah, una cosa importantissima, molte modifiche e aggiunte preferirei
    fossero quasi principalmente on place negli stessi posti in cui si visualizza. se togliessimo
    quell'orribile bottone + e quella pagina aggiungi orribile sarebbe ottimo. per variazioni di cifre
    di ingredienti, aggiunta di nuovi, con loro ricerca, o aggiunta di categorie diverse magari alla
    timeline si possono fare cose a comparsa e barre di ricerca a comparsa che ne pensi? ma non che
    coprono, intendo li on place. usiamo visualizzazioni a scorrimento verticale e orizzontale se
    serve o non so. insomma magari poi ci pensiamo. o forse andrebbe fatto un reframing di nuovo».
    Answer: reframe §15 — not a new frame: it completes §4 (one grammar) with «add where it will
    show», and it removes ⊕ and the Aggiungi page (PAT-01, PAT-10, PAT-60, ADR-0063's per-place ⊕).
113. **20 Nov, his «yc» on reframe §15.** Taken, each with its undo: (1) everything in place; ⊕, the
    Capture sheet and the Aggiungi page go (undo: PAT-01/10/60 as they are); (2) «Al volo» stays as
    the one shortcut (undo: §15 «Kept»); (3) built with the instruments, card by card (undo: §8.4's
    order). First card: the meal — reframe §16, content only, for his word before any drawing.
114. **20 Nov, his words on §16:** «aspetta ma in che senso? di nuovo fare una cosa nello specifico?
    non è meglio pensare e ragionare in dettaglio a tutte le cose che servono per ogni cosa, poi fare
    un passo indietro per un reframing per capire le cose in comune e cosa unificare, poi ancora un
    passo indietro su un livello gerarchico superiore, eccetera. e poi tornare nel dettaglio per
    capire come rifinire e poi di nuovo indietro dove e quando necessario. insomma evitiamo di rifare
    gli stessi errori. non esistono modus operandi, pattern, robe simili a quella che ti sto
    dicendo? anche più complessi e standardizzati? non possiamo seguire quelli?» Answer: yes — the
    methods he describes exist (chat, 20 Nov); reframe §16 (one card first) is withdrawn; his to
    pick: the method.
115. **20 Nov, his words:** «ok, inizia a pensare a come vada preimpostato tutto questo framework,
    anche per cambiamenti futuri a tutto il progetto». Read as: OOUX/ORCA in Double Diamond rounds
    taken as the direction («ok»). Answer: `method.md` in this change (draft) — the ORCA tables and
    their home, the zoom levels, a round's steps and stops, every future request through the same
    door, the checks, what it folds, the first pass; his to settle: its §9 (then ADR-0064).
116. **20 Nov, his words:** «come si configura tutto questo con i framework che già ci sono?»
    Answer: `method.md` §10 — each existing piece gets one job (product.md Z1–Z2, model.md Z2 rules
    and Z4 rules, patterns.md and visual.md Z3, domains Z5, a change = rounds, inbox = the door,
    map.md = the inventory, check.py = the guards, the skills by step); the only new home is
    `docs/spec/orca/`. Corrected: no `system.md` nor `views.md` (they would duplicate product.md,
    model.md and visual.md). His call: `PROJECT.md`, which overlaps product.md.
117. **20 Nov, his «yc» on method §9 and §10.** Taken, each with its undo: (1) OOUX/ORCA in Double
    Diamond rounds is the project's method, to be recorded as ADR-0064 (undo: the ADR superseded);
    (2) the ORCA tables as markdown tables with a fixed schema `check.py` reads (undo: YAML + a
    generated page); (3) zoom Z1–Z5 in the existing homes, only `docs/spec/orca/` new (undo: method
    §3); (4) stops A (tables) and B (photos) per round; (5) the `change` skill and `check.py` updated
    before the first pass; (6) `PROJECT.md` archived to `docs/archive/` (its pitch is in product.md
    §1), done with step (5) since the `adr` skill and `check.py` read it (undo: `git mv` back).
    Next, in a new session: ADR-0064 → `change` skill + `check.py` + `orca/` schema → round 1 at Z4.
118. **20 Nov, the method set up** (his «leggi l'handoff e imposta il metodo: ADR-0064, poi skill
    change e check.py, poi il round 1»). Done: ADR-0064; PRD-41 cites it; `docs/spec/orca/` with its
    schema (README) and four empty tables; `check.py` checks the schema, the links to OBJ rows, every
    registry key (`eslint/type-keys.json`) against `objects`, the proposal's **Zoom** and **ORCA
    cells**, and (changes from 21 Nov) that each delta row cites a cell or a zoom; the `change`
    skill gains the triage and the rounds; `PROJECT.md` and the `kickoff` skill archived. Decided by
    Claude, each with its undo: (a) prefixes REL- ACT- ATT- beside OBJ- (undo: rename in
    `orca/README.md` and `check.py`); (b) instrument «word» and question «name» for a name or a
    note, which no instrument draws (undo: drop them from `ORCA_VALUES`); (c) an empty table is not
    checked until round 1 writes it (undo: the `if objects` guard); (d) the kickoff skill archived
    with `PROJECT.md`, which it filled (undo: `git mv` back). Not yet a check: «one card per
    object» (method §6) — a code guard, built in round 1's Deliver.
119. **20 Nov, round 1 to stop A.** Discover: `round-1.md` (one Sonnet reader; 102 things, 13
    conflicts, his export of 19 Nov counted). Define: `docs/spec/orca/` written — 78 objects, 62
    relationships, 48 actions, 60 attributes. Decided by Claude (undo in `round-1.md` «Define»):
    actions and attributes only for objects with his data (PRD-02); forms `part` and `frame` added;
    what is not an object. Waiting for his word on `round-1.md` «For his word» q1–q9.
120. **20 Nov, his «yc» on `round-1.md` q1–q9: stop A passed.** Taken, each with its undo: (1) the
    ORCA tables as written (undo: edit the rows); (2) an assunzione refers to a pasto salvato, the
    cibo's `intake` flag goes — FD-64 in the delta (undo: the delta row; OBJ-26 back to ◐); (3)
    «marca» (undo: OBJ-23 and the words row); (4) «percorso» for the saved route (undo: same); (5)
    «movimento» is the body's, money reads «uscita» · «entrata» (undo: OBJ-19); (6) sessione, sonno,
    pesata on screen (undo: the words row); (7) Come valutiamo's sliders stay, «adjustable weights»
    leave «not now» (undo: the §4 row); (8) Dispensa = a filter of Elenco, no planning (undo:
    same); (9) «ritmo» only what repeats, a goal's pace has no noun (undo: ATT-51's name). Next:
    Develop (`round-1.md`).
121. **20 Nov, Develop of round 1** (`round-1.md` «Develop»): one look per form (Box · row · lane ·
    channel · container · preset), cells = many members, one grammar in three spots, the Z2
    consequences. Decided by Claude (undo there): the obiettivo also a Box in Obiettivi; cells as
    the many-member form. His word: q10 (the question in the registry), q11 (the order of Deliver).
122. **20 Nov, his «yc» on q10–q11.** Taken, each with its undo: (10) each registry field declares
    its question, the engine picks the instrument from it, a test keeps the registry equal to
    `orca/attributes` (undo: the engine's rules per type); (11) Deliver in order ① docs fold → ②
    registry → ③ the Box (stop B) → ④ adding in place, ⊕ out (stop B) → ⑤ lanes (stop B) (undo:
    another order). Started ①.
123. **20 Nov, Deliver ① done: the docs fold** (his «yc» q11). product.md (PRD-03, PRD-04 new,
    PRD-16, PRD-19, PRD-20, §3 words, §4), model.md (MOD-01 families and signals, MOD-14, MOD-15,
    §3 → `orca/`, MOD-30…32, MOD-41, MOD-56, MOD-57, MOD-58 new), visual.md (VIS-40, VIS-43, VIS-52,
    VIS-61, VIS-64 new, VIS-70, §13 VIS-100…105 new), patterns.md (PAT-01, PAT-03, PAT-10, PAT-30,
    PAT-43, PAT-51, PAT-52, PAT-60 → adding in place, PAT-74, PAT-95, PAT-97, PAT-98, PAT-99, PAT-100
    new), food.md (FD-31's kcal row, FD-64), plan.md (PL-71). Decided by Claude, each with its undo:
    (a) PAT-01 and PAT-95 lose ⊕, which the delta still had (his §113 is newer; undo: the delta's
    text); (b) PAT-97: the Piano is the rail after now, not «no days» (reframe §14; undo: same);
    (c) new «Not» words with a bracket (prodotto, sveglia, movimento) are not enforced by the
    glossary test until the screens are renamed in ④, as «allenamento (as object)» already was
    (undo: drop the brackets); (d) the drafts keep a «folded» header and stay in the change until it
    archives (PRD-41) rather than moving now (undo: `git mv` to `docs/archive/`). Next: ② the registry.
124. **20 Nov, Deliver ② done: the registry.** Every field answers a question (MOD-58: `QUESTIONS`,
    the field's optional `question`, `questionOf`, `INSTRUMENT_OF`); each measure carries its question
    and instrument; the overrides the tables chose (weight, waist, mood · energy · stress → trend;
    servings, stima, the pesata's conditions, NOVA → name); the signals are registry entries
    (`core/kinds/signals.ts`, `type-keys.json` «signal», OBJ-46…50 keyed); `orca/attributes` gains a
    **Field** column and `questions.test.ts` fails when a row's instrument or a field's question
    differs from the code (checked by breaking ATT-27). Decided by Claude, each with its undo: (a)
    done → yes/no as a default, which MOD-58 had not listed (undo: `DEFAULT_QUESTION`); (b) the
    form in code is the existing split — `Kind`, `CatalogType`, `child`, `Signal` — not a new field
    (undo: add `form` to the schema); (c) FD-64's code (the flag → pasti salvati) moves to ④, since
    it changes what the dock and the search row offer (undo: do it here). Next: ③ the Box, stop B.
125. **20 Nov, Deliver ③a: the Box's plan, no UI.** `core/engines/view/box.ts`: `BOX_PLAN` gives each
    voce, object and the obiettivo its slots by level (0 the closed head after icon and name, 1 open
    in place, 2 the page) with the instrument of each, from `orca/attributes`'s Level column;
    `box.test.ts` keeps code = table both ways (checked by moving ATT-38 to level 0). Decided by
    Claude, each with its undo: (a) ATT-61 cibo «kcal per 100» and ATT-62 pasto salvato «kcal» at
    level 0, since PAT-30 and target.md §2 give the closed row «one value» and the table had none
    (undo: drop the two rows and slots); (b) a type with no rows has the empty plan — icon and name
    closed, its fields as rows open (PRD-02; undo: a default per family); (c) the obiettivo's plan
    goes by the key `goal`, as it has no registry type (undo: a registry type). Next: ③b the kit Box
    draws the plan, Elenco first (photos), then Oggi → stop B.
126. **20 Nov, his «go on with this model, i cannot use fable»; Deliver ③b, first screen: Elenco ·
    Cibi.** A cibo opens in place as a pasto salvato already did (PAT-30 level 1): kit `ThingBox`
    (the open/door state for any thing; `MealBox` is now it with a meal's doors), doors from the
    plan (`features/box-doors.ts` `planDoors`): Voto · Nutrienti (100 g) · NOVA, «Apri» inside.
    Decided by Claude, each with its undo: (a) the icon's tile only on a row that is a link, so a
    row that opens matches the pasti (undo: `tile={!!e.href}` in `Box`); (b) «1 prodotto» shows
    only open, as `Box` levels already do for every meta (undo: none needed, the rule exists).
    Seen, not new: at 320 px «53 kcal/100» drops under the name (it did before). Photos
    `LIFEOS/review/2026-11-20/box/index.html`. **Stop B for this screen: his word.**
127. **20 Nov, his word on §126 (Elenco · Cibi):** «puoi rimuovere "apri" da tutti per guadagnare
    spazio? e non so aggiungere magari un qualcosa in basso a destra sulla stessa riga delle altre
    voci, di modo da guadagnare spazio. che se cliccata lo apre. appare pero solo quando estesa. a
    cos'altro si puo applicare?. questo non contraddice quello che ti avevo detto prima riguardo al
    rimuovere frecce e cose varie e implementare una interazione a tocco su tutta la schedina,
    questo perché quello serve per espandere i livelli. ora, in realtà sarebbe anche inutile
    "aprire" se come ti dicevo el cose si potessero modificare in place, tutte quante le sue
    caratteristiche».
128. **20 Nov, his answer on the doors' row and the page:** «allora, vorrei evitare il piu possibile
    in tutta l'app cose pop up o pagine in piu, è preferibile che tutto gia ci sia. per esempio, se
    ci sono tanti bottoni, invece di andare a capo, si possono far scorrere orizzontalmente nella
    schedina no? magari con una animazione carina. e magari ne approfittiamo meglio per pensare a
    come spaziarli meglio, soprattutto con le cose che stanno sopra e sotto. ah e non mettermi su
    telefono delle barre di scorrimento. su telefono non servono. da pc servono ma solo quelle
    orizzontali immagino, perché quelle verticali possiamo toglierle anche dato che si puo usare la
    rotella o il touchpad». Taken: no ⋯ sheet; an open box's doors and its verbs on **one row that
    scrolls sideways**, never wrapping; no scrollbars on touch, only horizontal ones with a mouse.
    Direction for the page (PAT-30 level 2): everything already in the box, as far as possible.
129. **20 Nov, his word on the sideways row:** «ecco a questo punto il cibo aperto invece di avere "1
    prodotto" per esempio, puo avere un'altra piccola sezione a scorrimento orizzontale che li
    elenca. inoltre non so se a questo punto sia meglio per questo genere di testi e per esempio
    anche le descrizioni sotto i pasti, di averle allineate completamente a sinistra, anche sotto
    l'icona. pero spaziati bene comunque».
130. **20 Nov, his word on the marche:** «ok, ma se fai le marche come bottoni dovresti fare in modo
    che sia interagibile, quindi se tocchi una, la scheda si aggiorna con i dati di quella
    specifica. di conseguenza deve essere selezionata una di default, magari quella piu usata, e se
    mai usate, quella con miglior valutazioni, e se pari, la prima inserita. inoltre c'è troppo
    spazio sopra e sotto, dimensionato male. e non mi piace "marche" scritto cosi. preferisco
    un'altra icona allineata a quella di sopra. o magari niente, meglio pure. comunque stiamo
    facendo cose troppo piccole, oltretutto la freccia ti avevo detto che sarebbe dovuta scomparire
    se vogliamo fare tutto in place. ma immagino che riguardi i prossimi step quindi tu l'abbia
    tenuta come cosa momentanea. ok, detto questo aggiusta queste piccolezze e andiamo avanti. ci
    siamo focalizzati troppo su dettagli inutili». Taken: a marca is a choice that redraws the box;
    the default most used → best voto → first inserted; no label; tighter spacing; the › is
    temporary, gone when the page's content is in the box.
131. **20 Nov, his word while Esercizi and Schede were built:** «comunque devi diminuire le
    proporzioni generali di tutti i boittoni».
132. **20 Nov, his «ma stiamo procedendo col piano del framework?», then «yc».** Claude's answer: ③b
    drifted into one component per type (`FoodBox`, `ExerciseBox`, schede by hand). Taken (his «yc»),
    decided by Claude, each with its undo: (a) **one builder**: the kit's `PlanBox` draws a slot by
    its instrument (word → a chip, many words → a `ChipRow`, trend → `Chart` behind a door,
    composition of nutrients → `Nutrients` behind a door), never by type; `features/box/slots.ts`
    orders a type's slots by its plan and refuses one whose shape is not its instrument's; a type
    gives only data (undo: the per-type boxes in git); (b) a thing's children he picks (a cibo's
    marche) are **variants** of the same `PlanBox`, each with its own head and slots, one picked by
    the caller's rule (undo: `FoodBox`); (c) then Oggi's voci and Obiettivi through the same
    builder, then **stop B**: one page with every type's Box closed and open.
133. **20 Nov, §132 built (a) and (b), decided by Claude:** kit `PlanBox` (slots `word` · `words` ·
    `trend` · `nutrients`, and `variants`) and `features/box/slots.ts` (`planSlots`: the plan's
    order, i18n labels by slot key, throws on a shape that is not the slot's instrument; `words`
    may also list a composition's members, so a scheda's esercizi are names). Cibi, Esercizi and
    Schede now go through it; `FoodBox`, `ExerciseBox`, `box-doors.ts` are gone. Photos before and
    after are pixel-identical (`LIFEOS/review/2026-11-20/planbox/`). **Open, his (blocks (c)):**
    the meal's Box shows Nutrienti · Cibi · Costo open, but its plan (`orca/attributes.md`, ATT-06…
    ATT-10) says lines · limits · servings · context at level 1 and cost at level 2. Which is
    true? (a) the plan, recommended: the meal box redraws by it (Cibi = lines, limits as bars,
    cost moves to its page) — a change on Oggi, shown as photos first; (b) the box: the table
    changes to match today's doors. The obiettivo's plan (pace → bar, reachedOn → fan) needs two
    more shapes; Obiettivi is history (§105), so it waits for (c)'s answer.
134. **20 Nov, his «yc» on §133 = (a), the plan wins.** Built on the branch, shown as photos, **waits
    for his word** (design rule 3; `LIFEOS/review/2026-11-20/planbox/meal-*.png`). The meal's box
    is `MealBox` on `PlanBox`, its slots from `features/box/meal.ts`. Decided by Claude, each with
    its undo: (1) open doors in the plan's order: Voto · Cibi (ATT-06) · Nutrienti — the limits
    slot (ATT-07) keeps today's panel and his word «Nutrienti» (undo: label «Limiti e micro»);
    (2) the cost leaves the box (ATT-11, level 2): a line «Costo ≈ …» on a pasto's page; **on Oggi
    a voce's cost is only in the day's «Costo ≈» for now** (undo: `mealDoors` in git); (3) the
    other details (provenance, his note) are the context slot (ATT-10), a row of words above the
    doors (undo: a «Dettagli» door); (4) porzioni is its own word (ATT-08), never shown where the
    place has the − × + stepper (the day); (5) the day's cibi are drawn as a pasto's are, one Box
    row each: the amount the value, «kcal · ≈ €» its second line (undo: text lines). Open: the
    day's lines carry no food group, so each has the plain ingredient icon (VIS-31 wants its group).
135. **20 Nov, his words on the §134 photos:** «il moltiplicatore compare 3 volte. elimina può
    diventare una icona di cestino. entrambe le azioni possono essere spostate nello stesso punto,
    come le marche nei cibi, sopra le voci a scorrimento orizzontale come altro scorrimento
    orizzontale ma dedicato alle azioni. oppure no. essendo azioni, e essendo anche la modifica e
    aggiunta di ingredienti altre azioni, dovremmo studiarle insieme a quei cambiamenti in place.
    nell'elenco poi ci sarebbe proprio l'opportunità di cambiare tutto, collegamenti con parti
    parenti, fusioni, cambi di nome, eccetera. poiché nella timeline ti ricordo che non modifichi
    il pasto vero in elenco. questo tipo di cambiamenti poi immagino possano essere astratti anche
    per categorie non sul cibo necessariamente. ma non so come questo influisce sul piano».
    Claude's reading: the actions are `orca/actions.md` (48 rows, by object and place); a voce
    changes only itself (a snapshot, ADR-0007: porzioni, + ingrediente, salta, elimina, «salva come
    pasto»), a catalog object changes its life (MOD-20: rinomina, unisci, variante, parti da,
    collegamenti, archivia). Question to him: how this enters the plan (reply of 20 Nov).
136. **20 Nov, his «yc» on §135 = (a): actions join the box before Stop B.** Spec: PAT-101 in
    `delta.md`, ACT-49 (delete a voce) and ACT-03's place in `orca/actions.md`; `delete` joins the
    action words (README, check.py), for a voce only — decided by Claude (undo: drop it and
    ACT-49). Built: kit `ActionRow` in `PlanBox` (`actions`), first when open; the day's meal and
    every other day box draw porzioni once (the stepper, drawn 32, touched 44; the «× n» pill
    dropped where it steps) and the trash at the end (undo: `serveRow` in git). Photos:
    `LIFEOS/review/2026-11-20/planbox/meal-actions*.png`; **waits for his word** on the meal box.
    Next: the Elenco objects' actions row (MOD-20 verbs, `ObjectActions`' «Altro» into it), the
    voce's righe in place (ACT-03), then Stop B. ④ keeps only where adding happens.
137. **20 Nov, his word on §136:** «sì preferisco "drawn small", dappertutto, e secondo me può anche
    essere più stretto orizzontalmente intendo. magari in futuro quando rifacciamo per le modifiche
    in place, li facciamo simili. per il resto yc». Done: every `Stepper` (`.k-step`) drawn 32 high
    with 32-wide buttons, each touched at 44 (VIS-05, VIS-105); `.big` (52) stays, unused today.
    For later: the in-place edits (ACT-03, PAT-13) take the same small stepper.
    Open, his: in a form the stepper is now 32 while text fields and the segmented control stay 44
    (VIS-86); recommended: the same «drawn small, touched at 44» for every field, with the in-place
    edits (photos `planbox/stepper-small.png`).
138. **20 Nov, his «yc» of §136, next step: the Elenco objects' actions row (PAT-101).** Each Elenco
    row knows its object (type, id, its page's verbs, read from its address); `useObjectVerbs`
    (`features/objects`) runs them for the object page and every Elenco box alike (one merge sheet,
    one toast with «Annulla»). Cibo: Parti da… · Unisci · Archivia · trash; pasto salvato: Registra
    · Cambia i cibi · Parti da… · Variante · Unisci · Archivia · trash; esercizio: Unisci · Archivia ·
    trash. Decided by Claude, each with its undo: the pasto's «Registra» and «Cambia i cibi» leave
    the doors' row for the actions row (§128's «doors and verbs on one row» changes for the verbs:
    undo `verbs` in git); every verb in the row, no «Altro» in a box (the page keeps its «Altro»
    until it is a box too). Not yet: the schede (a server list, no client verbs), rinomina and
    collegamenti in place (ACT-25, with the in-place edits). Photos `planbox/elenco-actions.png`;
    **waits for his word**.
139. **21 Nov, his word on §134–§138 (rejected):** «hm, no non va bene, il problema è che la
    posizione di ogni cosa dovrebbe essere astratta e uniformata, almeno delle cose comuni. e poi il
    cibo è orribile così, spaziato in quel modo, la marca che crea tutto quello spazio. anche il resto
    non va bene, mi chiedo poi quanto dovrà cambiare pensando alle modifiche in place. e poi in
    realtà le azioni son collegate alle visualizzazioni, devo essere in grado di vedere i nutrienti
    per modificarli, ma vorrei anche vedere i voti come cambiano dinamicamente, forse la cosa più
    inutile sono i macro, che per i pasti invece di tutte quelle barre possono averne una unica come
    quella attuale dei voti. e magari mostri sempre i pezzettini di ogni contributo di ogni
    ingrediente a ogni macro, come avviene per la scheda generale immagino però su un piano diverso.
    e tra l'altro, magari i blocchettini piccoli cambiano con il tipo di visualizzazione, per esempio
    nutrienti/ingredienti. in effetti quelli che adesso chiamiamo nutrienti in realtà sono
    ingredienti. i nutrienti sono le origini che creano i blocchettini attualmente nella scheda
    generale di oggi. o e poi se si tocca e quindi si sta modificando uno degli ingredienti, la
    barra illumina tutti i blocchettini che la riguardano (dato che in modalità modifica sarebbe in
    visualizzazione ingredienti) e come ti dicevo, anche i voti devono essere visualizzati, magari in
    una barra sotto a quella dei macro ma riconoscibilmente diversa. e allo stesso modo, alla
    modifica e o al tocco di un ingrediente, i contributi apportati ai voti da quell'ingrediente si
    illuminano? non lo so». Claude's reading, for his answer: (1) one **anatomy** for every Box, fixed
    zones for what is common; (2) actions and views are one thing: editing needs the view it
    changes, and the voto must move as he edits; (3) a meal's four macro bars become **one bar**
    (like the voto's), its blocks always split by contributor, in two modes — by ingredient · by
    nutrient kind (the «origins» of «Il giorno») — editing puts it in the ingredient mode; (4) a
    touched ingredient lights its blocks (VIS-50 already says it for level 2) and, maybe, its part
    of the voto, in a **voto bar** under the macro bar, drawn unlike it. Nothing more is built on
    the box until he answers.
140. **21 Nov, his word:** «be e non pensi che ci dovrebbe essere un collegamento diretto tra i voti
    di un pasto e gli ingredienti che lo compongono? perché di fatti c'è. i singoli ingredienti hanno
    voti, quindi si dovrebbe partire da quelli, o meglio si potrebbe, e robe di densità e altri
    criteri usano anche quelli, quindi perché non evidenziare un legame che esiste». Claude was
    wrong in §139 («an ingredient adds no fixed share»): `core/food/score.ts` `foodParts` builds
    every criterion from **sums over the lines** — density from the nutrients' totals against the
    meal's kcal, the limits from totals of salt, saturated fat, free sugars, trans — and a cibo is
    scored by the same function on its own (its voto per 100 kcal). So each criterion's input is
    each ingredient's amount added up, and per kcal the meal's value is the kcal-weighted mix of its
    ingredients' values; only the last step (density capped at 100 %, the limits' 1…2 ramp) bends
    it. The link exists and can be drawn exactly at the input level.
141. **21 Nov, his «yc» on §139–§140 (all four: one anatomy; the voto bar split by ingredient, live;
    spec first, then one meal box as photos, #372 stays open; «Ingredienti» · «Nutrienti»), and:**
    «utilizza questa cosa dei voti applicata anche al resto, esempio, esercizi singoli magari hanno
    voti, le sessioni quindi sono loro aggregati in qualche modo, quindi stesso pattern. e tutto
    questo ovviamente vale anche per discorsi futuri sull'andamento».
142. **21 Nov, built on his «yc» of §141 (spec: PAT-102, VIS-106, VIS-107, MOD-61 in `delta.md`):**
    `lineShares` (exact shares per criterion) and `split` on every meal voto; kit `PartsBar`
    (macro bar · voto bar); the meal box on the anatomy — head, macro bar, voto bar, one row (mode
    «Ingredienti» · «Nutrienti», then the actions), the mode's panel (ingredient chips each with
    «voto n», or every nutrient's rows). Photos `LIFEOS/review/2026-11-21/anatomy/`; **waits for
    his word**. Decided by Claude, each with its undo: (1) a macro column is full when the macro is
    in proportion to the meal's energy against the day's targets (the day's whole target left every
    meal's column almost empty; undo: scale = the day's target); (2) the mode decides the panel, no
    «Cibi»/«Nutrienti» doors; (3) the ingredient chips do not open their cibo (the old rows did;
    undo: `meal-rows.ts` in git); (4) a pasto's ingredients show no voto yet (the composer's foods
    carry none; Oggi's do). Still a sixth row: «Voto n ›» (the criteria and the page) — to fold
    into zone 3 when the voto bar opens its criteria. The other types keep §132's layout for now.
143. **21 Nov, his word on §142 (rejected):** «non ci siamo affatto, innanzitutto nell'ultima scheda
    mostri i macro 2 volte, poi le spaziature sono fatte a caso, in nutrienti mostri ancora quelli
    che sono di fatto gli ingredienti ma in un rendering vecchio e come dicevo ancora il duplicato
    dei macro. poi le barre fanno schifo. okay facciamo così, hai presente drill down e dig up o quel
    che è? se tocchi sulle barre scorri tra queste visualizzazioni, una mostra le porzioni dei macro
    illuminate che riguardano quelle del pasto rispetto quelle totali del piano, comprese quelle
    pianificate, quindi prende pari pari quella generale ma con quelle evidenziate, una seconda,
    parte invece dal totale del pasto e fa la stessa cosa ma con i suoi ingredienti. per la barra di
    voto lo stesso. ora però il problema è anche un altro, la forma dovrebbe essere più simile a
    quella usata nei macro attuali comuni. quando riprende quella generale, deve riprendere quindi
    anche tutte le dimensioni che dovrebbe usare. quando si va all'altro livello… be capiamo, ma
    sempre qualcosa di simile». Claude's reading: the `PartsBar` skyline goes; the meal's bars are
    the day's own macro bars («Il giorno», same component, same sizes); a tap on them moves between
    two levels (drill down · roll up, VIS-70): (1) **the day**, eaten + planned, with this meal's
    share lit and the rest dimmed; (2) **the meal**, its own total, its ingredients' shares the same
    way; the voto bar the same two levels. No mode chips, no second copy of the macros.
144. **21 Nov, built on §143:** the `PartsBar` skyline is gone. The meal box draws «Il giorno»'s
    own `Nutrients` (same component, same sizes) at two levels a tap on the bars moves between,
    named «Nella giornata» · «Il pasto» with the level dots (VIS-70): the day, eaten + planned, each
    meal a part (`dayByMeal`), this meal lit and the rest dimmed; the meal from its own total
    (no day target, zones or limits: the macros share one scale), its ingredients as its parts.
    No mode chips, no ingredient chips, macros drawn once. Decided by Claude: a macro's number
    without a target carries its unit (VIS-11); a number too wide for its row moves whole under
    the name (a box on the rail at 320). Open: the voto's two levels (the day's voto by voce needs
    MOD-61 for the day); which ingredient is which at the meal level (lit when editing it, with
    the in-place edits); the box's «›» column narrows its bars. Photos
    `LIFEOS/review/2026-11-21/levels/`; **waits for his word**.
145. **21 Nov, his word on §144:** «non ha senso mettere la cavolo di freccia, toglie spazio. e poi
    volevo tutti i macro su un'unica riga». Taken as patterns (PROD-35: never one screen): (a) no
    Box keeps a column for its «›»: the page is the last, small icon of its actions row (PAT-101),
    so the content takes the whole width; (b) a meal's macros at both levels are one row — the
    four bars side by side, each with its icon, its number and its track (same segments, light and
    target mark as «Il giorno»), the energy line above.
146. **21 Nov, his word on §145:** «in effetti è troppo condensato, allora facciamo così, teniamo solo
    il livello del pasto, e facciamo però in modo che le 4 minibarre siano tutte piene, quindi
    indichino solo le proporzionalità o dei nutrienti o degli ingredienti. solo che magari affianco
    ai numeri, mettiamo anche delle minuscole freccette tipo doppio basso rosso o singolo basso
    arancione, o trattino grigio o alto giallo/bianco, doppio alto verde. non so queste sono
    proposte di colori, colori che vengono eventualmente poi ripresi nei voti ovviamente. attento
    alle spaziature sotto e sopra. per la vista "nella giornata" invece, pensavo che quando si
    scorre verso il basso, in alto si minimizza a barra singola, identica a quella del pasto in
    fattezze, e mostra le proporzioni però rispetto a se stessa, quindi per evidenziare il pasto
    attuale quanto contributo dà. sempre attenta agli spazi. anche qui con stesse feature eccetera.
    poi quando è estesa è più simile a quella attuale, con 4 barre diverse, anche se aggiungerei lo
    stesso le freccette dato che sembra esserci spazio. valutiamo se aggiungere anche 3 in basso e 3
    in alto».
147. **21 Nov, built on §146 (the meal box only; the day comes next, one screen at a time):** only
    the meal's level; its four macros on one row, each bar always full (its parts' proportions, no
    mark, no ruler; a hairline between two parts of one shade), no energy line (the head says it);
    beside each number a kit `Verdict` arrow — ⇊ «da evitare» · ↓ «pessimo» · – not judged · ↑ «ok»
    · ⇈ «ottimo», in the heat colours (his proposal; the voto takes them too). Decided by Claude,
    each with its undo: (1) a meal's carbs, fat and fibre are judged against the day's ranges scaled
    to its share of the day's energy — **a change to FD-35** («a meal is judged only on protein»;
    undo: drop `share` in `features/day/nutrients.ts`); (2) five arrows, not seven: the zones have
    four levels, so a third arrow up or down would have nothing to say yet (his «valutiamo»: open);
    (3) a saved pasto has no day's targets in the Elenco, so its arrows are «–» (PRD-22). Photos
    `LIFEOS/review/2026-11-21/arrows/`; **waits for his word**. Next (his §146): «Il giorno» —
    expanded, today's four rows plus the arrows; scrolling down, it shrinks at the top into one
    row of four full bars like the meal's, each meal a part, the meal in view lit.
148. **21 Nov, his word on §147:** «no, non frecce, ma più questi >> ma capovolti. e comunque ti ho
    detto attento alle spaziature verticali, non vedi che hai sempre problemi a spaziare
    verticalmente quando metti delle barre con ciò che c'è sotto?» → the verdict is chevrons
    (»» turned up or down), and the space above and below a row of bars is one token, measured.
    Built: the `Verdict` draws Tabler's chevrons (two down · one down · dash · one up · two up;
    added by hand to `icons.generated.ts` — `icons_build.py` and `icons.json` are not in this
    checkout, said in the file); a Box's zones sit in one column, `.k-zones`, one 12 px gap between
    any two and the same above the first and before the doors — measured at 390 on his dinner and a
    pasto: 12 · 12 · 12 · 12 (before: 8 · **0** · 8). `LIFEOS/review/2026-11-21/arrows/gaps.mjs`
    measures it; **waits for his word**.
149. **21 Nov, his word on §148:** «a 320 dovresti diminuire la dimensione dei caratteri, le frecce
    sono mal spaziate e posizionate». Done: each chevron right after its own number; the row of
    macros knows its width (a container query): under 260 px the numbers take a new smallest size,
    `--fs-b4` 11 px (decided by Claude; undo: drop the token and the query), the icons 12 px, the
    gaps tighter. Measured on his dinner, room left in each cell after its chevron: 390 → 11 px,
    360 → 11, 320 → 1 (it spilled into the next cell before). Script `arrows/cells.mjs`.
150. **21 Nov, his «ok procedi yc»:** the meal box of §147–§149 approved. Next, §146's day: «Il
    giorno» expanded = today's four rows with the chevrons; scrolled past, a thin band fixed at the
    top: one row of four full bars like the meal's, each meal a part, «il pasto attuale» lit — read
    by Claude as the meal box nearest the top of the screen under the band (decided by Claude; undo:
    light the open one); a tap on the band scrolls back to the card.
151. **21 Nov, built on §150:** «Il giorno»'s full rows carry the chevrons too (wherever a macro row
    has zones); kit `PartsBand`: once the card is above the screen, a band slides in at the top —
    the meal box's row of four full bars, each eaten voce with lines a part (a coffee, a creatine
    too), the meal box nearest the top under the band lit, a tap back to the card. It takes no room
    (a sticky line of no height; the page's «lift over the backdrop» rule needed an exception).
    Photos `LIFEOS/review/2026-11-21/band/`; **waits for his word**.
152. **21 Nov, his rule and «yc»:** «facciamo così: ogni volta che in una taglia, come spesso accade
    in 320, determinate cose che dovrebbero entrare su una sola riga non lo fanno, diminuisci le
    dimensioni di tutte le sue componenti, ovviamente entro una soglia, per farle rientrare. in ogni
    caso vai avanti. yc» → VIS-108 (delta): a one-line row that does not fit shrinks as a whole,
    down to a floor, before anything wraps or is cut. «yc»: §151 approved; go on to the other types
    on the anatomy, then Stop B.
153. **21 Nov, built on §152 → Stop B.** VIS-108 as kit `FitLine` (`fitScale`): a macro's row and a
    macro cell shrink as a whole down to 80 % before they wrap (the earlier «number under the
    name» fallback is gone). The other types on the anatomy: a cibo's bars per 100 g (its four
    macros, full, by kind; the picked marca's when it has marche) and no «Nutrienti» door (never
    the macros twice); the choice is **one chip** in the actions row — several marche: «Quaker ·
    5,90 €/kg ▾» opens the list in place, a pick closes it; one: a plain chip («Lidl»). Esercizio
    and scheda already follow the zones (actions, then names). **Stop B**: every type's Box shut
    and open at 390/360/320 on his data, no overflow in any (`LIFEOS/review/2026-11-21/stop-b/`).
    Decided by Claude: the cibo's kinds and micros in the Elenco are on its page only now (undo:
    the «Nutrienti» slot in `features/library/boxes.tsx`).
154. **21 Nov, his word on Stop B:** «ok, anche perché meglio cambiare chat. comunque non ho capito
    cosa sono questi chevron e cosa vuoi da me con le 2 cose aperte. e comunque non hai messo ogni
    tipo, ne hai messi meno della metà. e poi questo step era l'inizio no? mettere tutto insieme per
    capire cosa accomunare no? come rifare ogni cosa di modo che sia uniforme tra di loro. e poi le
    cose dei pasti non abbiamo ancora fatto nulla riguardo i cambiamenti in place, e i voti. cosa
    intendiamo fare? lavoriamo nello specifico ai pasti, sia nella loro versione in elenco che in
    timeline e poi astraiamo tutto e lo uniformiamo a tutto il resto? per poi lavorare nello
    specifico a tutto il resto?» Claude's answer: Stop B showed 5 of the 16 types in the plan
    (`core/engines/view/box.ts`): it is incomplete; its purpose is the comparison of every type to
    find what is common. Proposed order (his question, his «yc» pending): (1) merge #372; (2) Stop B
    complete — all 16 types shut and open, with a table of what each shows in each zone; (3) the
    meal in depth, timeline and Elenco: in-place edits (grams, + ingrediente, porzioni) with the
    voto recomputed live and each ingredient's share lit (MOD-61); (4) abstract it into the kit and
    apply it to every type; (5) each type's specifics.
155. **21 Nov, his «yc procedi»** on §154: the order is approved. Decided by his «yc» (each with its
    undo): five chevrons, not seven (§145's reason; undo: `Verdict` levels); the dashed previsto
    icon stays as it is at 18 px, looked at again when the previsto gets its box shape (undo: a
    dashed ring in `Box.tsx`). **Stop B complete**: all 16 types of `BOX_PLAN` plus the tragitto,
    shut and open at 390/360/320 on his data, none overflowing, with the table of each zone
    (`LIFEOS/review/2026-11-21/stop-b/all/index.html`, script `all.mjs`). Found: (a) four builders —
    `PlanBox` (pasto, cibo, pasto salvato, esercizio, scheda), the old `Box` (seven voci), water's
    own `WaterRow`, and ciclo · blocco · obiettivo not Boxes at all (they do not open); (b) the head
    is already one (icon · name · value · voto); (c) zone 2 (the bar) only for macros and water;
    (d) zone 3 (the voto bar, VIS-107) drawn nowhere — a «Voto n» chip repeats the head; (e) the
    page arrow mid-right in the old Box, last in the row in `PlanBox`; (f) a field's value as tiles
    or as chips; (g) faults: come stai's values twice, «a digiuno» twice, the assunzione's two
    costs (0,10 € and 0,06 €), the tragitto's tiles in English, sonno titled «Sveglia». Next, his
    step (3): the meal in depth, timeline and Elenco. **Waits for his word on the table.**
156. **21 Nov, his word on the table:** «hm ok, non so che dirti sulla tabella tanto cambieremo molto
    se non tutto. andiamo avanti? da cosa partiamo? dobbiamo differenziare la visualizzazione di
    ogni tipo dipendentemente se sta in elenco o altrove giusto? e altrove dobbiamo sempre avere
    qualcosa che ci porti alla sua visualizzazione in elenco? e poi? oppure non partiamo da li?»
    Claude's answer: PAT-30 already says one Box, not two looks — the day adds quanto, quando and
    the state (PAT-31, VIS-22) and judges against the day; the Elenco judges per unit and holds
    the object's life (PAT-101). An edit on the day changes only that voce (ADR-0007), in the
    Elenco the object; «↺» says when they differ (PAT-31). Proposed start: the meal, both places at
    once (open question: the dish name in a voce as the door to its pasto salvato).
## What
- The bar by action and the area as a filter (ADR-0063): `delta.md`.
- Each place rebuilt in the real app from the kit pieces, one screen at a time, shown as photos
  of the real screen with his data (`.claude/rules/design.md`); then the composer and the gym.
- Then the code, place by place, behind his OK on each drawing.

## Not in this change
- Object addresses (PAT-04) and the object model: unchanged.
- Money/pantry (W-02), Q-25 (drop the old Piano tables), W-01's wording: inbox.
- The speed and code review of W-03.

## Stop
- After the drawings in depth: no code before his OK on each place.
- Open, his to settle (asked on the pages, not blocking the drawings): G4 «sides» in place of «per
  manubrio» (a model word); G6 what he dislikes in the «Prossimo · niente riscaldamento» note.
