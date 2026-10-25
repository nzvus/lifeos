# Dossier — v2 against its boards (fidelity)

Status: **audit 2026-10-24**, first fixes in the same PR. Why: the developer,
2026-10-23: «la maggior parte delle cose che avevamo pensato negli artifact è
stata resa male in v2». Method: each board rendered locally at 390 px (its
own runtime) next to the same v2 screen on the developer's data (local
PGlite, the refined 23 Oct export). The boards: claude.ai artifact
`Q2fD1qXBKgMJ2N9BuTgHbZ`.

The pattern behind most gaps: slices shipped the data path and a plain list,
and left out what the boards draw from that data (icons, bars, scores,
pills, the open box). The kit has the CSS for most of it; the components
were only ported for the parts a first slice needed.

## Cross-cutting (every screen)

| Board                                                                                             | v2 before                                                    | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Each food, exercise, meal with its own drawing (Glyph resolver: group, dish, pattern, equipment)  | one generic icon per family (fork, dumbbell)                 | **done here**: the data reaches the rows (composer, library, gym)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Meal boxes named by role (Colazione, Cena), contents underneath                                   | raw food names in capitals                                   | **done here** (drinks and supplements keep their name)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| L0: four thin macro bars in each meal box, kinds shaded                                           | none                                                         | **done here** (`NutrientsL0`; against the day's targets until day templates give slot targets)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Score skyline in the box background, the box opens on its score parts and L1                      | boxes never open, no score                                   | **done**: a meal opens on its L1; the meal score's skyline and parts (meal-score.md §8); sessions and foods not scored in boxes yet. **Every box opens** (2026-10-24) on its details: fields as tiles, a session's exercises with their sets, a meal's foods, times, provenance; weigh-in, sleep and water scored; water one box inside the timeline with +250/+500 (2026-10-24); **a meal opens on its window (L2)** (2026-10-24): its foods as chips that highlight their part in every bar and in «da dove», each kind's foods, notes (leucine, glycaemic load and free sugars, omega-3, inulin), its micros next to the day's need |
| Pills that say something (caffeine left at bedtime, «+49 min», «P 19,3 g», sets · tonnage · kcal) | only pre/post-workout tags                                   | sessions' sets · tonnage **done here**; the rest per kind                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Planned items hatched with «Fatto», the now line, end-of-day actions                              | partly (planned style), no now line on past days, no actions | next                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Oggi (Main)

Done 2026-10-24: caffeine as mg with what is left at bedtime, creatine
as a supplement with its days of 28 (compounds from the catalog;
ranges.md §6). Done 2026-10-24 (#274): the goal's line under the day
box, «Togli i previsti (n)» with Undo, «Chiudi la giornata» (ho segnato
tutto / manca qualcosa, riapri; E4 now reads «manca qualcosa» as partial).
Done 2026-10-25: «Salva come modello» (the day's meals as one block per
role at its first time with its share of kcal and protein, its sessions
with their minutes; a role with no energy gives none; then the model's
editor); the day's model as the header's action («Giornata «Rec» ▾», a
panel to change it or skip the step) and the cycle as the header's line
(«ciclo PLPRR: oggi Push, poi Riposo»); the weather chips (high · low,
humidity, air, daylight, the city; engines.md E11), since 25 Oct a card.
Meals of one role together (2026-10-25, the developer's pick): two or more
«Cena» entries are one box with the whole dinner's bars and score, opening
on its panel, then each entry as its own row, then «+ Aggiungi a cena»
(`features/day/meal-groups`). Missing: the pantry reminder card. Depends on: day templates (Piano), drink
and supplement kinds (migration.md), pantry (V-12).

## Composer (Food)

**Done (s182)**: the header «Pranzo · 13:13» with the day, eaten or planned,
the saved meal and the kcal so far, and «Cibi»; tabs Ingredienti · Pasti ·
Stima; each food a box with its drawing, kcal, protein, a stepper and
«Togli»; «Pranzo, come sarà»; «Salva previsto». Still missing below.
**Done (2026-10-24)**, with the day's model's blocks: the header says the
block («164 kcal di 495 kcal del blocco · «Rec»»), «come sarà» is the L2
window (foods as chips) measured against the block, «Per arrivare al
blocco» (the protein missing and two ways to close it — a food in the meal
raised, a usual one dense in protein added — each with what it adds, one
tap), «Pasti adatti a cena» (saved meals by `blockFit`).
**Done (2026-10-25)**: tabs as the board's underline tabs; the barcode
next to the search; each ingredient «8 g prot. · NOVA 4», its energy by
macro as a ribbon, its product as a chip; «come sarà» scored as it is
built (E7 FOOD, the same function as Oggi's, `features/food/lines-score`;
fit from the block); «Pasti adatti» before «Per arrivare al blocco»; the
servings and «Salva» together at the bottom. Missing: saved-vs-now kcal
in the header, the «Porzioni» tab (batches), the price per line (no
prices in the data yet), the photo of a label.

## Gym

**Done (s183)**: «Push · 09:33 · esercizio 2 di 8 · 30 serie · 6.870 kg in
totale»; Automatica · Manuale as a segmented control; each done set with
the rest measured before it; «Poi» with each exercise's plan. Still missing
below.
Missing: header «esercizio 2 di 8 · 30 serie · 6.870 kg»; Automatica ·
Manuale as a segmented control; «La sessione finora» (muscle split bar,
pills, skyline); rest on each done set; the current set hatched «ora · in
corso»; pills after RIR (estimated strength, rest, sleep, last meal); «Poi»
with each exercise's plan («3 × 10 · 35 kg»). **Fixed here**: a finished
session no longer shows the set form, RIR and «Aggiungi esercizio».
**Done (2026-10-24)**: «La sessione finora» as a box (its minutes, the
session score on what is done — the exercise in progress counted to the
sets reached — with its skyline and parts, the muscle split as a strip
and pills from the catalog's muscle groups); the set running hatched
«Serie n · ora · in corso»; the context as pills under the exercise (the
last rest against the planned one, sleep, food in 24 h, creatine,
readiness; short ones in warn). **Done (2026-10-25)**: «forza stimata 40 ·
+2 %» first among the pills (the best e1RM with RIR today against the last
session's; warn when it fell over 2 %).

## Andamento (Progress)

**Done (s184)**: the period control (kit RangeNav: ‹ ›, 7 · 30 · 90 giorni ·
Mese, the month with the period highlighted, each day a link); «Scegli» (a
custom range) and the day dots (they need the day's E7 score) later.
**Done (2026-10-24)**: the day dots (each day's E7 score), the period box
with its score (each part's mean), **Energia** (learnt expenditure and the
priors' parts), **Gli ambiti** (food, weight, sleep, water with their
skylines), each day's row with its mini skyline. **Done
(2026-10-24)**: the period box's pills (sessions, mean sleep — warn under
7 h —, the weight from the first week to the last), the steps in «Gli
ambiti» with their numbers and no score (the movement dossier has not
decided one). Missing: training in «Gli ambiti» (a session's score needs
its history: on the gym page only, Neon budget). **Done (2026-10-25)**:
each domain's page (the board Tracker, `/andamento/peso`, `sonno`, `acqua`,
`passi`, linked from «Gli ambiti»): the period's box with its score, three
stats, the kit's new Chart (weight: the scale's points, the board's
smoothed trend, the goal line; sleep, water, steps: bars against 7–9 h,
the need, the goal), each entry a row with its own score, «Cosa dice di
te». The person's own trackers too (`/andamento/<key>`: each day's first
number summed, or how many times; their rows as on Oggi; «I tuoi tracker»
on Andamento). Missing: the kind's settings on its page, food and
training pages.

## Libreria

**Done here**: the index (one search across the catalogs, the shelves with
counts and a line, «Aggiungere»), each shelf opening its list; «Tipi di
tracker» (2026-10-25: the kinds ⊕ enters, the person's own counted, to
Tracker e tipi; «Un tracker» under «Aggiungere»). Dispensa joins with V-12.
The board is an index: Cibi · Pasti e ricette · Dispensa · Esercizi · Tipi
di tracker, then «Aggiungere» (food by barcode/label/hand, meal, receipt,
exercise), one search across all. v2 opens straight on the foods list with
tabs and a sort select.
Done 2026-10-25 (the board IngredientEditor): a food's page says how often
it was used, «Modifica» in its header, its values as stats, «Così appare»
(100 of it in the meal's bars, folded), section icons; the editor has
«Nome e codici» and «Per 100 g» with steppers two by two and NOVA 1–4.
Missing: one page for reading and editing (the board's), products with
their formats and prices, «Tipi di ogni macro», «Vitamine e minerali»,
«Fonti».

## Piano, Obiettivi, Impostazioni, Aggiungi

Piano: models, day types and cycles (boards Models, ModelEditor,
CycleEditor) — built with day-templates b and c (#275). The week's header
as the board Plan (2026-10-25): the kit's DateNav in week mode
(«Settimana 42 · 12–18 ottobre», ‹ › a week, each day's step or model
under its number), the header line «sett. 42 · giornata «Rec» · ciclo
PLPRR». Obiettivi
(2026-10-24): each goal a row as on the board — its drawing, now → target,
by when with the paces and the arrival, how far along as a strip, the
week's days coloured for a per-day count, «da qui: … kcal e … g al giorno»,
in line or not, a link to where it is logged; goals nothing counts yet
faded; the header counts them. Missing: the score's skyline for a goal,
the inline «Nuovo obiettivo» with its derived pace (it is a page).
Aggiungi (2026-10-24): «A quest'ora, di solito» (meals usually logged
within ±90 min of now on ≥ 2 of the last 28 days, one tap to log again),
«Allenamento · inizia adesso» (the 3 routines most trained), «La ricerca
non trova?» (new food, new exercise). Done 2026-10-25: one search across
the kinds, foods, saved meals and routines on top (names only, read in one
query; a food opens the composer with it, `?cibo=`), «Cosa» first.
«Nuovo tracker» (2026-10-25, Impostazioni → Tracker e tipi; kinds.md).
The «Adesso · Previsto · Prima» switch (2026-10-25): what opens from ⊕ is
done now, planned, or done earlier with its time left to say (`&stato=`
to the sheets and the composer). Missing: «Porzioni pronte» (batches,
pantry). Impostazioni: compare again.

## Codice a barre

Done 2026-10-24 (ported from v1): «Nuovo cibo» reads a barcode by camera
(the browser's BarcodeDetector, else the ponyfill) or typed digits, checks
its GTIN digit, and fills the form from Open Food Facts (name · brand,
unit, values per 100, NOVA) to check against the label; the composer and
Libreria link to it. A food made from a barcode keeps it (a `barcode`
value), and scanning it again opens that food. Missing: the camera next
to the composer's search.

## Impostazioni

Done 2026-10-24: sections with their drawing and a line of why,
«Obiettivi di oggi» (kcal and protein, where they come from, a link),
«Tracker e tipi» (the foods and your own kinds counted), «I tuoi dati»
(download all, the trash with its count). Done 2026-10-25: «Porta i dati
da v1» — v1's export, a dry run (per kind, the days, what stays out), then
«Aggiungi»: an entry comes in when v2 has no live entry of its kind on its
day (with its children, lines, sets), its catalog items by id, else v2's of
the same name, else new; nothing in v2 changes (core/convert `newFromV1`,
ADR-0052's merge narrowed to v1 → v2; a movement with its money,
lines and receipt since 2026-10-25). Missing: CSV per
kind, replace from a file, invites, language. The weather's city is in
«Il tempo» (2026-10-25).

## Soldi (Money)

Done 2026-10-25: ⊕ → «Spesa» (spending or income, how much, the category
grouped under its parent — v1's 51, in Italian —, where, what, card or
cash, the time), written as a `movement` entry with its `money_movements`
row (core/money); `/andamento/soldi` (the board Money): spent, the pace
against the month before at the same day, income, the month by category,
the movements day by day with each day's total, ‹ the month before.
A movement opens from Oggi or Soldi in the same form, to change it or
«Elimina» (to the trash). Missing: budgets, accounts and balances,
receipts (⊕ → Scontrino, V-13).

## Come valutiamo (Scores)

Done 2026-10-25, read-only: `/andamento/come-valutiamo?modello=` — the
models as chips (Pasto, Peso, Sonno, Acqua, Sessione, Giorno), what each
judges, the last weigh-in, night or water of the week as a box and the big
skyline, each part with its share, its allowed range (green) and the
default weight on it, the lock on health limits, why, its score now; the
sources. Linked from Andamento and from each tracker's rows. Missing: the
sliders (the weights stored as a dated decision: a migration on
`decisions_kind_ck`, so the developer applies it), the context lines
(«il contesto che sposta la bilancia»).

## Proposed order

1. The box (cross-cutting): score skyline + open state + pills, so every
   screen gains at once.
2. Composer to its board (the screen used most after Oggi).
3. Gym header, segmented auto/manual, «Poi» plans.
4. Andamento's Energia and Gli ambiti (needs E3/E7 outputs on the page).
5. Oggi's header and context once day templates exist.
