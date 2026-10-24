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
| Score skyline in the box background, the box opens on its score parts and L1 | boxes never open, no score | **open state done here** (a meal opens on its L1); the score needs the E7 food/meal scorer, whose thresholds want their own short dossier |
| Pills that say something (caffeine left at bedtime, «+49 min», «P 19,3 g», sets · tonnage · kcal) | only pre/post-workout tags | sessions' sets · tonnage **done here**; the rest per kind |
| Planned items hatched with «Fatto», the now line, end-of-day actions | partly (planned style), no now line on past days, no actions | next |

## Oggi (Main)
Missing: day type and cycle in the header («Giornata «Rec» · ciclo PLPRR»),
context chips (weather, light, place), pantry reminder card, the weight
trend line under the day box, water inside the timeline, caffeine as mg
with its decay, creatine as a supplement, «Salva come modello», «Togli i
previsti», «Chiudi la giornata». Depends on: day templates (Piano), drink
and supplement kinds (migration.md), pantry (V-12).

## Composer (Food)
**Done (s182)**: the header «Pranzo · 13:13» with the day, eaten or planned,
the saved meal and the kcal so far, and «Cibi»; tabs Ingredienti · Pasti ·
Stima; each food a box with its drawing, kcal, protein, a stepper and
«Togli»; «Pranzo, come sarà»; «Salva previsto». Still missing below.
Missing: «Cena · 20:00» header with its block and saved-vs-now kcal; tabs
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

## Andamento (Progress)
**Done (s184)**: the period control (kit RangeNav: ‹ ›, 7 · 30 · 90 giorni ·
Mese, the month with the period highlighted, each day a link); «Scegli» (a
custom range) and the day dots (they need the day's E7 score) later.
Missing: the period box with score and pills; **Energia** (learnt
expenditure and its parts: base, the day's blocks, steps, gym, thermic
effect); **Gli ambiti** (food, weight, training, sleep, water, steps), each
with its score skyline and its page.

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
CycleEditor) — not built. Obiettivi, Impostazioni, Aggiungi: closer;
compare again after the cross-cutting fixes.

## Proposed order
1. The box (cross-cutting): score skyline + open state + pills, so every
   screen gains at once.
2. Composer to its board (the screen used most after Oggi).
3. Gym header, segmented auto/manual, «Poi» plans.
5. Andamento's Energia and Gli ambiti (needs E3/E7 outputs on the page).
6. Oggi's header and context once day templates exist.
