# v2 — Places, actions, event chains

> **Places superseded by ADR-0059 (2026-10-30):** Corpo · Cibo · Oggi · Mente · Soldi, the same four tabs (Diario · Piano · Elenco · Andamento) everywhere. This file is rewritten in phase 3 of the review; until then the places below are the code's current state, not the target.

Decided by ADR-0054 (proposed 2026-10-16). Each object has one home.
For every object this file answers five questions: where it is created,
seen, edited and deleted, and what it sets off. Every v1 screen id
(`../06-screens.md`) has a v2 place at the end.

## 1. Places
**Oggi · Piano · ⊕ · Andamento · Libreria**, plus the gear → Settings (V-14)
and the assistant (when enabled) in the header.

| Place | Holds | Screens |
|---|---|---|
| **Oggi** | any day: what was planned and done, in time order | V-01 Day; V-04 composer, V-05 gym, entry sheet (V-03) as sub-pages |
| **Piano** | the future and its rules, for every kind | shelves: Calendario · Giornate tipo (blocks of any kind, week layout) · Cicli · Routine · Pasti tipici · Abitudini · Tracker |
| **⊕** | the one way to add anything | V-02 Aggiungi: search, kinds, usual, recent, scan (barcode, label, receipt) |
| **Andamento** | the past by range, and progress | Il periodo; domains → tracker pages (V-06), Soldi (V-11); Obiettivi (V-09); correlations; data quality; Come valutiamo (V-16) |
| **Libreria** | reusable things | Cibi (ingredients, products: V-07); Pasti e ricette; Dispensa (V-12); Esercizi; Tipi (user-made kinds) |

## 2. Moving around
- **Bar:** on the four places only. ⊕ opens a sheet from anywhere.
- **PageHeader:**
  - top level: title, context, gear;
  - sub-page: "‹ parent" names where it goes; the system back returns to
    where the person came from.
- **DateNav** (one component, three uses), on Oggi (one day), Piano
  (week or month) and Andamento (a range):
  - swipe for the next or previous day;
  - the week strip has ‹ › and a score dot per day;
  - tapping the title opens the month, with each day's score and
    template;
  - an "Oggi" chip appears when away from today.
- **Andamento's range** comes from presets (7/30/90 days, this month)
  or a drag on the month.
- **Every view keeps a URL** (`/day/2026-10-15`, `/plan/models/<id>`,
  `/progress?range=…`, `/library/foods/<id>`).
- **Sheets** are for short tasks (an entry, a day's swap); **pages**
  are for whole objects (a meal, an ingredient, a model).

## 3. Objects and actions

"With Undo" and confirmations follow content.md §4: Undo for what can be
redone, a question only for what cannot. How each object is read, edited
in place, archived, deleted (only when unused) and restored is the same
for all of them: interaction.md §2–§3 (ADR-0058).

| Object | Created | Seen | Edited | Deleted | Sets off |
|---|---|---|---|---|---|
| Entry (any kind) | ⊕; a planned block ticked on Oggi; a template applied; gym mode; a receipt line; import | Oggi (its day), its tracker page in Andamento | tap on Oggi → its sheet or specialised page | swipe on Oggi, with Undo → trash | day totals → scores → goal pace; a fulfilled planned entry; cycle advance (§5) |
| Meal entry (eaten) | ⊕ → composer; a recipe "Usa oggi"; "Copy yesterday" | Oggi box; Andamento → Cibo | composer (lines, grams, servings) | Oggi, with Undo | nutrients of the day; pantry stock down (when the food is stocked) |
| Food | Libreria → Cibi → "+"; ⊕ search "not found → crea" (barcode → Open Food Facts, label photo → OCR, manual) | Libreria → Cibi; pickers | the food's page: typical values with provenance, its products and formats, "meals that use it" with the % change | archive (stays in history) | available in ⊕ and the composer |
| Product (a brand under its food, ADR-0055) | a scan or a label of a new brand; a receipt line; the food's page "+ prodotto" | under its food; Dispensa | the food's page: only what its label changes | archive | its label corrects the food's values where it differs |
| Format (shape, size, barcode) | a scan of a new barcode; a receipt line of a new size; the product "+ formato" | under its product | the food's page | archive | stock and price per g |
| Price observation | a receipt line; by hand on a format | the food's page: per shop, with the history | the receipt | with the receipt | price per g → value per € in the scores; the cheapest shop |
| Recipe / saved meal | Libreria → Pasti → "+"; composer "Salva come pasto" | Libreria → Pasti (sort by any nutrient, per kcal or €); the composer's "Salvate" | meal editor (lines, live totals, ratings) | archive, with Undo | a template block can point at it; cycles can rotate it |
| Exercise | Libreria → Esercizi → "+"; gym mode "add exercise" | Libreria → Esercizi (guide, records, e1RM) | exercise editor; merge into another | archive | — |
| Block, day type, week layout | Piano → Modelli → "+"; Oggi ⋯ "Salva come modello"; «Parti da…», "estendi" | Piano → Modelli; Calendario | model editor | archive (days already planned keep their entries) | applied → planned entries on the calendar |
| Cycle | Piano → Cicli → "+ ciclo" | Piano → Cicli; the day it fills | its page: days (each with 0..n sessions, or a model), reorder by drag, advance rule, bound block, «Fai slittare» from a day (dossier to come) | archive, or delete | each occurrence takes the next day |
| Routine (a session's exercises) | Piano → Routine → "+"; gym «Salva come routine» | Piano → Routine; the cycle's steps; ⊕ «Allenamento» | its page: exercises in order, sets, rests (in place) | archive, or delete when no session or cycle uses it | a cycle step can hold one or more routines |
| Habit | Piano → Abitudini → "+"; Oggi ⋯ on an entry "Ripeti come abitudine" | Oggi (when due), Piano → Abitudini | habit editor (recurrence, block) | archive | planned entries; streaks |
| Goal | Andamento → Obiettivi → "+" (what, how much, by when; the pace is derived) | Andamento → Obiettivi; Oggi's goal line | goal page | end or delete, with Undo | targets of every day (E5) |
| Day type targets | inside a day type (fixed values or "follow the goal" with deficit, protein and fat g/kg), meal shares on its blocks | model editor; Oggi's day box | model editor | with the model | the targets each block and day are judged against |
| Purchase / stock / shopping item | receipt (⊕ → Scontrino), Dispensa "+", a count | Dispensa | Dispensa | Dispensa, with Undo | "runs out in N days" → shopping list → Oggi reminder (S-T15) |
| Batch (cooked × N portions) | Dispensa or composer "cucina N porzioni" | Dispensa | Dispensa | Dispensa | each eaten portion lowers the batch |
| Movement / receipt | ⊕ (spesa); ⊕ → Scontrino; import | Andamento → Soldi; Oggi (spending entries) | its sheet | with Undo | budgets; value per € of foods |
| Check-in (mood, energy, stress), journal | Oggi (morning prompt), ⊕ | Oggi; Andamento → Mente | its sheet | with Undo | recovery score; correlations |
| Weekly check-in | the goal, when due | Oggi card (S-T06) | its sheet | — | goal pace review |
| Tracker kind (user-made) | Libreria → Tipi → "+"; ⊕ "Nuovo tracker" | Libreria → Tipi; its tracker page | kind editor (fields, units, targets) | archive | a new row in ⊕ and Andamento |
| Scoring model weights | Come valutiamo (V-16) | V-16; every Box's skyline | V-16 sliders within ranges | "Valori consigliati" | past scores recomputed, dated |
| Day closure | Oggi "Chiudi la giornata" | Oggi; Andamento data quality | reopen | — | the TDEE fit uses closed days only |

## 4. Oggi, complete (the v1 actions it keeps)
- **The day's template:** swap it from the day box (S-T05).
- **Weekly check-in** card when due (S-T06).
- **Pantry reminders** due today, linking to Dispensa (S-T15).
- **Supplements** as compact entries (S-T21).
- **On an empty day:** "Copia ieri" (S-T13).
- **With two or more planned:** "Togli ciò che è ancora previsto"
  (S-T12).
- **Future days** show only planned entries (S-T14).
- **Close the day** (S-T28).
- **⋯ menu:** "Salva come modello", "Ripeti come abitudine" (on an
  entry).

## 5. Event chains
1. **Eat:**
   - ⊕ → composer → save;
   - the entry is done; the day totals and the meal's score update;
   - then the day score, the 7-day nutrients and the goal pace;
   - tomorrow's targets (E5); stock goes down for stocked foods.
2. **Buy:**
   - ⊕ → Scontrino → lines matched to products (aliases remembered);
   - movements go to Soldi, purchases to Dispensa, with stock and
     prices;
   - "runs out in N days" → the shopping list → a reminder on Oggi.
3. **Plan:**
   - Piano → week layout → day types (with `extends`) → blocks;
   - a cycle bound to a block gives that block its step;
   - planned entries appear on the calendar and on Oggi;
   - they are ticked, done or skipped; the cycle advances or shifts by
     its rule.
4. **Weigh:**
   - ⊕ or the Oggi row → weighing with context;
   - its reliability score → trend (E4) → TDEE fit;
   - targets, the goal pace and the ETA.
5. **Train:**
   - Oggi's planned session → gym mode → sets with RIR → done;
   - e1RM and progression; the session score;
   - load → recovery → the next session's suggestion; the cycle step.
6. **Make a food:**
   - ⊕ search finds nothing → scan the barcode (Open Food Facts) or
     photograph the label (OCR) → the ingredient editor → save;
   - it is offered in ⊕, the composer and recipes.
7. **Build a habit:** an entry's ⋯ "Ripeti come abitudine" →
   recurrence → planned entries on its days → streak in Andamento.

## 6. Every v1 screen → its v2 place

The one table (screens.md points here). The functions inside each screen, and
whether v2 keeps them, are in migration.md §"Parity of functions".

| v1 | v2 place | Board | Notes |
|---|---|---|---|
| S-T01 day navigation | Oggi: DateNav | Main |  |
| S-T02 day card, goal line, "how this number is built" | Oggi: the day Box | Main, Goals | the deficit pencil goes: the goal owns it |
| S-T03 score row | Oggi: the day Box's skyline | Main | scores split into targets, quality, recovery |
| S-T04 chips (sleep, movement, mood, closure) | Oggi: timeline rows and the day Box | Main | they become entries; the closure stays as a row |
| S-T05 day type / program picker | Oggi: swap the day's model (§4) | Main, Plan |  |
| S-T06 weekly check-in | Oggi card | Main | an optional weekly review of the expenditure |
| S-T07 the day with the plan totals | Oggi: the day Box (Nutrients L1) | Main | planned shown hatched |
| S-T08 timeline | Oggi: timeline of Boxes | Main | plus filters by domain and state (find.md) |
| S-T09 slot rows, suggestions | Oggi: blocks; the composer's suggestions | Main, Food | ranked by fit, use, rating (find.md §2) |
| S-T10 entry row (tick, −/+, eye, refresh, delete) | Oggi: the row Box | Main | eye, refresh and servings in the row's actions |
| S-T11 open row (lines in place, time, quality) | Oggi: the open Box; the composer | Main, Food |  |
| S-T12 remove what's still planned | Oggi (§4) | Main |  |
| S-T13 copy yesterday | Oggi (§4) | Main | also "apply yesterday's model" |
| S-T14 future days planned only | Oggi | Main | rule in E1 |
| S-T15 pantry reminders | Oggi row → Libreria → Dispensa | Main, Pantry |  |
| S-T16 day quality panel | Oggi: the day Box; Andamento → Come valutiamo | Main, Scores |  |
| S-T17 this week | Andamento → Il periodo (7 days) | Progress |  |
| S-T18 energy and calibration | Andamento → Energia; the weight tracker | Progress, Tracker | learnt expenditure, no accept step |
| S-T19 training on this day | Oggi: the session Box | Main |  |
| S-T20 the program's day | Oggi: the cycle's step, from Piano | Main, Plan |  |
| S-T21 supplements | Oggi: compact entries; their tracker | Main | doses on the timeline, curve |
| S-T22 add food | ⊕ → the composer | Capture, Food | portions from a cooked batch included |
| S-T23 add training | ⊕ → Palestra | Capture, Gym | routine at its latest version, a past session, estimate |
| S-T24 movement, S-T25 sleep, S-T26 weight, S-T27 mood, S-T29 spending | ⊕ → the entry sheet | Capture, Entry | sleep also by wake/bed taps; mood with a moment |
| S-T28 close the day | Oggi | Main |  |
| S-F01 meals, S-F02 meal editor | Libreria → Pasti e ricette | Meals, MealEditor | «Parti da…», sort by any nutrient alone or per kcal/€/macro |
| S-F03 ingredients, S-F04 ingredient editor (label, OFF, OCR, impact) | Libreria → Cibi | Catalog, IngredientEditor, Scan |  |
| S-F05 pantry | Libreria → Dispensa | Pantry |  |
| S-F06 food trends | Andamento → Cibo | Progress |  |
| S-F07 day types and programs | Piano → Modelli | Models, ModelEditor | day types with targets and shares |
| S-B01 plan calendar, S-B02 program editor | Piano → Calendario; the cycle editor | Plan, CycleEditor |  |
| S-B03 routines | Piano → Modelli (a session is a block model of exercises) | Models |  |
| S-B04 exercises, merge, guide | Libreria → Esercizi; the exercise editor | Exercises, ExerciseEditor | muscles and pattern suggested from the name |
| S-B05 session editor, S-B06 gym mode | Oggi → Palestra | Gym | "last time" per exercise |
| S-B07 progress, weight | Andamento → Allenamento, Peso | Progress, Tracker |  |
| S-M01 money overview, S-M02 movements | Andamento → Soldi | Money | movements grouped by day with the day's total; search, category, month |
| S-M03 receipts | ⊕ → Scontrino | Receipt | lines matched by alias, then by name |
| S-N01 mind | Oggi check-in; Andamento → Mente | Main, Progress |  |
| S-S01…S-S10 settings | Impostazioni (from any place's gear); goal (S-S04) in Andamento → Obiettivi; day types (S-S05) in Piano | Settings, Goals, Models | time zone typed with suggestions |
| S-A01 assistant | parked since 2026-10-09; when enabled, an icon in every header and a mode of ⊕ | — |  |
| S-U01 sign-in | Sign-in / sign-up (V-15) | — |  |
