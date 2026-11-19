# Five places by action — proposal (ADR-0063)

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
      colour, a graded ramp instead of a macro colour. Pick: build in the kit gallery, show.
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
      criterion, and a «Come valutiamo ›» link. The two lines: to check on his photo.
    - «E poi i filtri sono spaziati male rispetto a sopra» (19 Nov) → the filter chips' gap to
      the piece above: a spacing rule in `e2e/layout.ts`, never a one-screen fix.
    Order (Claude's): the regression (icons) → taps (kit) → the voto → one page see/edit → week
    strip → kcal bar → rests. Undo: move the lines back to the inbox.

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
