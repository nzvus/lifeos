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
