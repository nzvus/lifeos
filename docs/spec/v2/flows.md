# v2 — Places, actions, event chains

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
| **Piano** | the future and its rules | Calendario; Modelli (blocks, day types, week layout, cycles); Abitudini |
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

| Object | Created | Seen | Edited | Deleted | Sets off |
|---|---|---|---|---|---|
| Entry (any kind) | ⊕; a planned block ticked on Oggi; a template applied; gym mode; a receipt line; import | Oggi (its day), its tracker page in Andamento | tap on Oggi → its sheet or specialised page | swipe on Oggi, with Undo → trash | day totals → scores → goal pace; a fulfilled planned entry; cycle advance (§5) |
| Meal entry (eaten) | ⊕ → composer; a recipe "Usa oggi"; "Copy yesterday" | Oggi box; Andamento → Cibo | composer (lines, grams, servings) | Oggi, with Undo | nutrients of the day; pantry stock down (when the food is stocked) |
| Food (ingredient) | Libreria → Cibi → "+"; ⊕ search "not found → crea" (barcode → Open Food Facts, label photo → OCR, manual) | Libreria → Cibi; pickers | ingredient editor (like a label; "meals that use it" with the % change) | archive (stays in history) | available in ⊕ and the composer |
| Product (brand, barcode, package) | a receipt line; scan; the food's page | under its food; Dispensa | product editor | archive | prices → value per € in the scores |
| Recipe / saved meal | Libreria → Pasti → "+"; composer "Salva come pasto" | Libreria → Pasti (sort by any nutrient, per kcal or €); the composer's "Salvate" | meal editor (lines, live totals, ratings) | archive, with Undo | a template block can point at it; cycles can rotate it |
| Exercise | Libreria → Esercizi → "+"; gym mode "add exercise" | Libreria → Esercizi (guide, records, e1RM) | exercise editor; merge into another | archive | — |
| Block, day type, week layout | Piano → Modelli → "+"; Oggi ⋯ "Salva come modello"; "duplica", "estendi" | Piano → Modelli; Calendario | model editor | archive (days already planned keep their entries) | applied → planned entries on the calendar |
| Cycle | Piano → Modelli → "+ ciclo" | Piano → Modelli; the day it fills | cycle editor (steps of any model, advance rule, bound block) | archive | each occurrence takes the next step |
| Routine / habit | Piano → Abitudini → "+"; Oggi ⋯ on an entry "Ripeti come abitudine" | Oggi (when due), Piano → Abitudini | habit editor (recurrence, block) | archive | planned entries; streaks |
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

| v1 | v2 |
|---|---|
| S-T01 day navigation | DateNav on Oggi |
| S-T02 day card, S-T03 score row, S-T07 nutrients, S-T16 day quality, S-T18 energy | Oggi: the day Box (Nutrients L1, micros, limits, day skyline) |
| S-T04 chips (sleep, movement, mood, closure) | Oggi timeline rows and the day box |
| S-T05 day type picker | Oggi: swap the day's template (§4) |
| S-T06 weekly check-in | Oggi card |
| S-T08, S-T09, S-T10, S-T11 timeline, slots, rows, open rows | Oggi timeline of Boxes (rail, compact/times/open) |
| S-T12 remove planned, S-T13 copy yesterday, S-T14 future days | Oggi (§4) |
| S-T15 pantry reminders | Oggi row → Libreria → Dispensa |
| S-T17 this week | Andamento → Il periodo (7 days) |
| S-T19 training today, S-T20 program's day | Oggi training Box; the cycle step from Piano |
| S-T21 supplements | Oggi compact entries |
| S-T22 add food, S-T23 add training, S-T24 movement, S-T25 sleep, S-T26 weight, S-T27 mood, S-T29 spending | ⊕ → entry sheet or specialised page |
| S-T28 close the day | Oggi |
| S-F01 meals, S-F02 meal editor | Libreria → Pasti e ricette |
| S-F03 ingredients, S-F04 ingredient editor | Libreria → Cibi (V-07) |
| S-F05 pantry | Libreria → Dispensa (V-12) |
| S-F06 food trends | Andamento → Cibo |
| S-F07 day types | Piano → Modelli (day type with targets and shares) |
| S-B01 training plan, S-B02 program editor | Piano → Calendario, cycles (cycle editor) |
| S-B03 routines | Piano → Modelli (a block set of exercises) |
| S-B04 exercises | Libreria → Esercizi |
| S-B05 session, S-B06 gym mode | Oggi → V-05 |
| S-B07 progress | Andamento → Allenamento, Peso |
| S-M01 money overview, S-M02 movements | Andamento → Soldi (V-11) |
| S-M03 receipts | ⊕ → Scontrino (V-13) |
| S-N01 mind | Oggi check-in; Andamento → Mente |
| S-S01…S-S10 settings | Settings (V-14); goal (S-S04) in Andamento → Obiettivi; day types (S-S05) in Piano |
| S-A01 assistant | header icon (when enabled) |
| S-U01 sign-in | V-15 |
