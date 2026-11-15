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
