# What v2 already decided — read before any design, drawing or UI change

No `paths`: this file loads in every session. It cites, it never decides: the truth is the ID's
home (`docs/spec/visual.md` VIS, `patterns.md` PAT, `product.md` PRD, `model.md` MOD). Draft by
Claude, 14 Nov 2026; the user corrects it. A line he changes is changed in the spec too.
Why it exists (his words, 14 Nov): «ogni volta succede che ignori tutte le discussioni precedenti…
il modo in cui stiamo lavorando è sbagliato». The same on 30 Oct: «molte scelte… ogni volta te le
dimentichi».

## How we design (his «yc», 14 Nov; undo: delete this section)
1. **No separate drawings.** A proposal is the real app changed on a branch, built from
   `packages/kit`, shown as photos of the real screen at 390/360/320, dark, with his data
   (`verify` skill; memory local-signed-in-screenshots). No artifact with its own CSS or rows.
   A piece that does not exist yet is first a kit piece in the `/kit` gallery (PAT-94).
2. **One screen at a time.** Show one, stop for his word, then the next.
3. **«yc» and «ap» never cover design.** Dropping, replacing or redrawing anything below is a
   question to him, with options built from the real pieces (PRD-51).
4. **Say what a change keeps.** Every proposal lists the IDs below it follows and the ones it
   asks to change. An ID it would break is named, never silently dropped.
5. A handoff or a pasted summary is not context: this file and the spec file touched are.

## What lifeos is
- One person's app to log and understand the day; everything is a voce in time, judged against
  his goals (PRD-01). The core is what he uses: meals, coffee and creatine, gym, weight, sleep,
  steps, water; a domain without data gets no new structure (PRD-02).
- Rich, not minimal: «semplice da usare ma contenente tutto» → everything one tap away, never
  everything in view (PRD-19). Density is fixed with levels, never by cutting features.
- Fewer numbers, each with its «Perché?» (PRD-20, PAT-51); context beside the fact, never inside
  the number (PRD-21); never invent data (PRD-22); «non so» below coverage (PRD-23, PAT-55).
- Not now (product.md §4): adjustable score weights, goals with no data, receipts, pantry that
  plans, cross-rule plan layers, correlations, themes beyond dark. Each returns only as a change.
- Words: product.md §3 (voce, previsto · fatto · saltato, scheda, sessione, blocco, ciclo, voto,
  fascia, stima). «Parti da», never «Duplica». UI in Italian, 24 h, «tu».

## The look he picked, piece by piece (visual.md)
- **Dark first**, one theme, judged in dark (VIS-01). Barlow + Barlow Condensed, the type and
  space tokens; a page picks a level, never a size (VIS-02, VIS-10). Numbers through `F`: decimal
  comma, unit, never a number without its word (VIS-11).
- **Colour separates**: a section is tinted 7 % by its area, no frame; surfaces L0…L6, no card in
  a card; padding between cards («ricordati del padding tra le schedine») (VIS-04).
- **Icons everywhere** («le icone le voglio»): `Glyph` resolves from data, a page never names an
  icon; ingredient by food group, meal by dish, exercise by movement; the four meal roles drawn
  apart (VIS-30…33).
- **One Box for every item**: icon · title · value or score chip · at most one short action; one
  line closed, details on open (VIS-40). **Silhouettes** by type (pranzo double rim, colazione
  cup, spuntino bite, cena three rims, sonno moon bite), never where they break the row (VIS-41).
  The **box drawing** in the free corner, growing on open (VIS-42).
- **Score chip**: closed = skyline coloured by band + number + word; open = one ruler per
  criterion; at ≤ 360 px number and word only (VIS-43; his «skyline… una combinazione»). The mark
  for a voto: filled dot / half dot / ring (VIS-21). Never colour alone (VIS-20).
- **One nutrient bar** everywhere («tutte le barre dei macro… un unico tipo»): `Nutrients` levels
  L0 four thin bars → L1 every nutrient → L2 foods × kinds; macros split by kind in fixed shades,
  planned hatched, target a moving tick (VIS-50).
- **Zones ruler** under the bar («nella stessa barra… attaccata e sottile»): every zone with the
  grams at each change, the tip in its zone's colour; his «C + D» of 25 Oct (VIS-52).
- **Previsto · fatto · saltato is the box's shape**: outline + hatch, solid, struck (VIS-22).
  Provenance pills «stima», «da confermare», at most one (VIS-23).
- **The day**: the **time rail**, a thin coloured column with vertical times, 20 px, 64 expanded
  (VIS-60, his); **parts of the day** as full-width sky bands with sun and moon (VIS-61); **empty
  time** as a thin dashed grey bar that can be filled (VIS-62).
- **Week strip**: no arrows on touch, swipe, title opens the month, levels 0 · 1 thin bars per
  area · 2 each day's 24-hour column («com'è attualmente in v2 è il migliore») (VIS-63).
- **Levels of expansion**: a tap goes to the next level, three dots, remembered per piece
  (VIS-70; «più gradi di espandibilità… ricordata»). Open: PRD-19 says two levels, weather and
  week have three (his pick 6 Nov).
- **Weather**: 0 a line in the date row · 1 the card with the animated drawing · 2 hours, air, sun
  arc («b con a in espansione») (VIS-75). **Backdrop**: the domain glyph behind the header (VIS-80).
- **Controls**: one filled primary per screen; act pills 36 in a 44 row; segmented ≤ 4; chips ink
  when on (VIS-85). Fields 44 high, label above, edited = herb dot + «↺» (VIS-86). Targets never
  under 44 px except the named ones (PRD-12, VIS-05). One motion timing (VIS-90).

## The pieces that exist (packages/kit) — a screen is only a composition of these (PRD-18)
- Shell: `NavBar`, `PageHeader` («‹ parent»), `Sheet`, `Toast`, `Banner`, `Confirm`, `EmptyState`.
- Items: `Box`, `List` (8 rows then «Mostra altri», PAT-40), `Elenco`, `ObjectPage` (one page for
  every catalog type, PAT-30), `ObjectActions` («Altro»: parti da, variante, unisci, archivia),
  `EntryHeader` + the voce sheet with two levels (PAT-31, PAT-32), `ContextLine` (PAT-33).
- Find and add: `Find` (the one search, PAT-41), `SortChips` (PAT-42), `Capture` (⊕'s sheet:
  ranked rows first, one tap logs, PAT-60), `MergeSheet`.
- Forms: `Field`, `ObjectForm` (generated from the type, PAT-61), `Stepper`, `Recurrence` («Ogni
  quanto»), `Composer` for types with lines (PAT-62), `InPlace` (tap a value to edit, leaving
  saves, toast «Salvato · Annulla», PAT-13), `Timer` (PAT-63).
- Numbers: `F` (format), `Nutrients`, `Fascia` / `FasciaBar` / `Judge` (the one ruler and chip,
  PAT-52), `Why` (the «Perché?» sheet, PAT-51), `Chart` (the one trend chart, no SVG in a
  feature, PAT-53), `DateNav` / `RangeNav` / `Swipe` (PAT-54), `DayPart`, `Glyph`, `levels`.
- Checks that fail a PR: lint fitness rules, glossary test, jscpd, IDs cited by tests, kit photos
  (PAT-90…94). Baselines only shrink.

## What the real screens hold today (his «you can infer from the screenshots», 14 Nov)
From the photos of the running app with his data, 12 Nov: `LIFEOS/review/2026-11-12/shots/`
(110 screens at 390 px; never a bare `ls` there, use `find`). **Before touching a screen, open its
photo: everything on it stays unless he says it goes.** Seen by Claude on 14 Nov: the 19 below.
- **Oggi · Diario**: date title + «↩ oggi» + level dots; week strip with bars per area and the
  ciclo's step under each day (Legs, Rest, Corsa); Acqua box (skyline, voto, bar, +250 / +500);
  «Al volo» chips (creatina, caffè); weather card with its levels; **«Il giorno»** (skyline, voto
  with word, «è costata di più: …», dispendio ± with the goal's pace, kcal bar, each macro with
  its zones ruler and gram ticks, zuccheri liberi · grassi saturi · sale each judged with a word,
  the week's mean tick, «Vitamine e minerali n su m coperti», «Ricalcola la settimana», «Meno»);
  «Costo ≈ € · n senza prezzo»; «Energia del giorno ≈ kcal ±»; the goal line («76,3 → 72,3 kg
  entro il 20 dic · vai a … ne servono …»); counters per kind; «Orari»; then the day on the time
  rail under sky bands (Mattina … Notte, sun arc): each voce a Box with silhouette, skyline chip,
  «è costata di più: densità (27)», the four macro bars with grams, «× 1,5», «a digiuno»,
  «integratore · scorte ≈ 63 %»; empty time «4 h 35 senza niente · + aggiungi / + Spuntino»;
  «Fine giornata»; «Senza orario» (Passi ≈ kcal); «Giornata chiusa: manca qualcosa · Riapri».
- **Oggi · Andamento**: doors «Obiettivi › Soldi › Legami › Qualità › Come valutiamo ›»; period
  7 / 30 / 90 giorni / Mese; a month of judged days; «Il periodo» with voto; the macro rulers on
  the period's mean; «Energia: quanto consumi, e da dove» (consumo appreso ±, base a riposo, la
  giornata, passi, palestra serie per serie, digerire); «Gli ambiti» (a voto per area with its
  costliest part); Peso; Allenamento (sessioni, serie allenanti, tempo); «I giorni».
- **Obiettivi** (exists: Oggi · Andamento · Obiettivi): «8 obiettivi · 2 senza dati»; each a Box
  with its pace («servono −0,88 kg/sett. · vai a +0,08»), «da qui: 2.105 kcal e 168 g al giorno»,
  «fuori ritmo», a bar for the week («2 su 4»), «nessun dato · si conta quando c'è il suo
  tracker»; «+ Nuovo obiettivo».
- **Come valutiamo** (exists): chips per type (Pasto · Peso · Sonno · Acqua · Sessione · Giorno);
  what the voto measures in words; «I criteri e il loro peso», each with a slider, its % and its
  explanation with the source. **Qualità dei dati** (exists): per kind «21/30», what is missing.
- **Peso** (Corpo · Andamento · Peso): period + judged month; «Il periodo» with voto, «a digiuno»,
  «trend +1 kg»; three tiles Trend · Ritmo · Ne servono; the `Chart` with points, line without
  water, uncertainty and the goal; «Cosa dice di te»; «Pesate» each with its voto; «come
  valutiamo ›». Corpo · Andamento lists Peso · Sonno · Passi as doors.
- **Oggi · Piano**: «sett. 46 · ciclo PPLCR»; the week; «La settimana, tocca un giorno per
  cambiarlo» (each day's step: fatto solid, oggi «in ritardo», previsto hatched, with the day's
  kcal); «Oggi»: «come da ciclo (Legs)» + Cambia, «Salta «Legs»», «Sposta l'allenamento alle»,
  «+ previsto», «Copia i pasti di ieri», «Apri il giorno»; Blocchi; Cicli; Attivi · Archiviati.
- **Cibo · Elenco**: chips Cibi · Pasti salvati · Dispensa; «Possibili doppioni (1) ›»; «+ Nuovo
  cibo»; `Find`; «Ordina per»; each row kcal/100, skyline, voto, «1 prodotto»; «Mostra altri (111)».
- **Aggiungi** (⊕'s sheet): «Cerca tra 153 cose»; Adesso · Previsto · Prima; «Per te» ranked for
  the hour (meals «5 giorni su 28 a quest'ora», schede «inizia adesso», Acqua +500 ml, Passi).
- **Meal composer**: Ingredienti · Pasti · Stima; search with brand and kcal/100; «Dal codice a
  barre»; «Cena, come sarà» (the `Nutrients` of the meal); «La giornata con questo pasto» (the
  day's bars with the meal hatched); Annulla + Salva.
- **Gym start**: «Da un modello» (each scheda: n esercizi · n volte in 90 giorni), «Inizia senza
  modello». Corpo · Diario: «Allenati» with the cycle's next schede, «Altri modelli ›».
- Not opened yet by Claude: the running gym session, a voce sheet, an object page, Cibo and Mente
  diaries, Sonno, Passi, Legami, Soldi, Profilo. Open the photo before touching any of them.

## The model behind every screen (model.md)
- A registry declares every type once; pages, forms, lists, search, verbs and charts read it; a
  new kind is a registry entry, never a new page (MOD-01, MOD-02, PRD-03).
- Voce (MOD-10…14), catalog objects with one life (crea · parti da · variante · unisci ·
  archivia, MOD-20), blocco and ciclo for the Piano (MOD-30…36), metrica · fascia · obiettivo ·
  voto · decision (MOD-40…44), the engines: progresso, proposta, consiglio, contesto, energia
  (MOD-50…54). Domain rules and formulas: `docs/spec/domains/`.

## Open against ADR-0063 (five places by action) — his to settle, found 14 Nov
- Obiettivi, «Come valutiamo», Qualità, Andamento per area and the Piano of a day already exist
  and are richer than the two rejected artifact pages. The five places must be a new way to reach
  what exists, never a redraw of it.
- product.md §4 lists «adjustable score weights» as not now, yet «Come valutiamo» shows a slider
  per criterion: which is true is his to say.
- Words: product.md §3 lists «the areas» and «the four tabs»; «Libreria» and «places» are in the
  «Not» column. The five names need their line there.
- PAT-10/PAT-60: ⊕ is one Capture sheet everywhere; ADR-0063 gives each place its own verb.

## What Claude read to write this (14 Nov) — and what not
Read whole: `visual.md`, `patterns.md`. Read most: `product.md`. Read in part: `needs.md` (§0
start, §12, the conflicts, the summary), his quoted words in the ledger's interface section.
Read by headlines only: `model.md`, the five `domains/` files, the rest of the ledger. So the
look and the pieces above are solid; the domain rules are only pointed to.
