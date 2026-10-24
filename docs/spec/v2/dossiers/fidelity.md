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
| Board | v2 before | Fix |
|---|---|---|
| Each food, exercise, meal with its own drawing (Glyph resolver: group, dish, pattern, equipment) | one generic icon per family (fork, dumbbell) | **done here**: the data reaches the rows (composer, library, gym) |
| Meal boxes named by role (Colazione, Cena), contents underneath | raw food names in capitals | **done here** (drinks and supplements keep their name) |
| L0: four thin macro bars in each meal box, kinds shaded | none | **done here** (`NutrientsL0`; against the day's targets until day templates give slot targets) |
| Score skyline in the box background, the box opens on its score parts and L1 | boxes never open, no score | **done**: a meal opens on its L1; the meal score's skyline and parts (meal-score.md §8); sessions and foods not scored in boxes yet. **Every box opens** (2026-10-24) on its details: fields as tiles, a session's exercises with their sets, a meal's foods, times, provenance; weigh-in, sleep and water scored; water one box inside the timeline with +250/+500 (2026-10-24); **a meal opens on its window (L2)** (2026-10-24): its foods as chips that highlight their part in every bar and in «da dove», each kind's foods, notes (leucine, glycaemic load and free sugars, omega-3, inulin), its micros next to the day's need |
| Pills that say something (caffeine left at bedtime, «+49 min», «P 19,3 g», sets · tonnage · kcal) | only pre/post-workout tags | sessions' sets · tonnage **done here**; the rest per kind |
| Planned items hatched with «Fatto», the now line, end-of-day actions | partly (planned style), no now line on past days, no actions | next |

## Oggi (Main)
Done 2026-10-24: caffeine as mg with what is left at bedtime, creatine
as a supplement with its days of 28 (compounds from the catalog;
ranges.md §6). Done 2026-10-24 (#274): the goal's line under the day
box, «Togli i previsti (n)» with Undo, «Chiudi la giornata» (ho segnato
tutto / manca qualcosa, riapri; E4 now reads «manca qualcosa» as partial).
Missing: day type and cycle in the header («Giornata «Rec» · ciclo PLPRR»),
context chips (weather, light, place), pantry reminder card, «Salva come
modello». Depends on: day templates (Piano), drink
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
Missing: saved-vs-now kcal in the header; tabs
Ingredienti · Pasti · Porzioni · Stima; barcode and camera next to the
search; ingredient rows with glyph, kcal, inline stepper, «36 g prot. ·
1,50 € · NOVA 1», L0 ribbon and product chip; «La cena, come sarà» (food
chips, L1, micros, relations, score); «Pasti adatti alla cena»; «Per
arrivare al blocco» (what closes the protein gap); servings + «Salva
prevista» sticky at the bottom. v2 stacks a long generic list, the meal box
and the day box, with «Quando» last.

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
readiness; short ones in warn). Missing: estimated strength as a pill.

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
its history: on the gym page only, Neon budget), each domain's page.

## Libreria
**Done here**: the index (one search across the catalogs, the shelves with
counts and a line, «Aggiungere»), each shelf opening its list. The board's
Dispensa and Tipi di tracker shelves join when those slices exist.
The board is an index: Cibi · Pasti e ricette · Dispensa · Esercizi · Tipi
di tracker, then «Aggiungere» (food by barcode/label/hand, meal, receipt,
exercise), one search across all. v2 opens straight on the foods list with
tabs and a sort select.

## Piano, Obiettivi, Impostazioni, Aggiungi
Piano: models, day types and cycles (boards Models, ModelEditor,
CycleEditor) — built with day-templates b and c (#275). Obiettivi
(2026-10-24): each goal a row as on the board — its drawing, now → target,
by when with the paces and the arrival, how far along as a strip, the
week's days coloured for a per-day count, «da qui: … kcal e … g al giorno»,
in line or not, a link to where it is logged; goals nothing counts yet
faded; the header counts them. Missing: the score's skyline for a goal,
the inline «Nuovo obiettivo» with its derived pace (it is a page).
Aggiungi (2026-10-24): «A quest'ora, di solito» (meals usually logged
within ±90 min of now on ≥ 2 of the last 28 days, one tap to log again),
«Allenamento · inizia adesso» (the 3 routines most trained), «La ricerca
non trova?» (new food, new exercise). Missing: one search across all, the
«Adesso / Previsto» switch, «Porzioni pronte» (batches, pantry), «Nuovo
tracker». Impostazioni: compare again.

## Codice a barre
Done 2026-10-24 (ported from v1): «Nuovo cibo» reads a barcode by camera
(the browser's BarcodeDetector, else the ponyfill) or typed digits, checks
its GTIN digit, and fills the form from Open Food Facts (name · brand,
unit, values per 100, NOVA) to check against the label; the composer and
Libreria link to it. Missing: a known barcode opening the food it already
is (barcodes are not stored yet: a product's field), the camera next to
the composer's search.

## Impostazioni
Done 2026-10-24: sections with their drawing and a line of why,
«Obiettivi di oggi» (kcal and protein, where they come from, a link),
«Tracker e tipi» (the foods and your own kinds counted), «I tuoi dati»
(download all, the trash with its count). Missing: CSV per kind, replace
or merge from a file, invites, language, the weather's city.

## Proposed order
1. The box (cross-cutting): score skyline + open state + pills, so every
   screen gains at once.
2. Composer to its board (the screen used most after Oggi).
3. Gym header, segmented auto/manual, «Poi» plans.
5. Andamento's Energia and Gli ambiti (needs E3/E7 outputs on the page).
6. Oggi's header and context once day templates exist.
