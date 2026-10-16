# v2 — Find: search, rank, sort, filter, group

Decided 2026-10-16. The developer asked for smarter search, sorting and
filtering, and noticed that some of v1's are missing from the v2 boards.
v1's rules are the floor (migration.md "Parity of functions"); this file
adds to them. It refines the kit inside ADR-0054; no new ADR.

**Principle.** A page names its collection and its context (the slot,
the time, the plan) and nothing else. One `Find` part gives every list
the same search, the same ranking, the same sorts and filters for that
collection, and remembers them. No page writes its own sort options,
filter chips or search rules.

## 1. Search

Kept from v1 (`src/core/shared/search.ts`):
- case and accents are ignored;
- every typed word must appear, in any order;
- a match at the start of the text beats one at the start of a word,
  which beats one inside a word.

Added in v2:
- **One typo** is forgiven in words of 5 letters or more ("merluzo" finds
  "merluzzo"; "polo" does not find "pollo"). An exact match always ranks
  first.
- **Aliases and plurals:**
  - the names a receipt line taught (aliasKey);
  - singular and plural ("uovo" ~ "uova");
  - a short dictionary of the same food under two names ("petto di
    pollo" ~ "pollo", "whey" ~ "proteine del siero").
- **Every field, the same everywhere:** name, brand, notes, tags,
  ingredient names (of a meal), muscles (of an exercise), shop (of a
  movement). v1 searched different fields in different pickers.
- **A quantity in the text** becomes the amount: "avena 60 g", "acqua
  500" (ml by the kind's unit), "panca 3×10 40". The row offers to add it
  as typed.
- **Digits of a barcode** (8 or 13, valid check digit) open the product
  or the Open Food Facts lookup.
- **Nothing found:** the empty state offers "crea" with what was typed
  (content.md §4): a food (barcode, label, by hand), a kind of tracker.

## 2. Ranking

The text score comes first. Among equal text scores, and for an empty
search, the context decides, and the row says why:

| Signal | Rule | The row says |
|---|---|---|
| Planned now | a block of the plan within ±60 min whose model names this item | «previsto ora» |
| Fits the slot | the slot's fit (v1 `suggestForSlot`, extended to every slot: breakfast, lunch, snack, dinner, pre/post training, before sleep), then use, then rating | «adatto alla cena» |
| Usual at this hour | logged within ±90 min of now on at least 3 of the last 28 days | «di solito alle 20» |
| Use | uses in the last 60 days, an older use counting less (half-life 30 days); then the last use | «12× in 60 giorni» |
| Favourite | marked by the person | a star |
| Otherwise | A–Z (Italian collation) | — |

Exercises are ranked by use too (in v1 they were always A–Z).

## 3. Sorts

Each collection has a closed set of sort keys. Every key has its natural
direction (the one that puts the useful end first), a value shown on the
row, and missing values always last (v1 `sortByValue`, `naturalDirection`).

| Collection | Keys | Relative to | Default |
|---|---|---|---|
| Foods, meals | use, name, energy, protein, carbs, sugars, fat, saturated fat, fibre, salt, cost, score | — (value), per 100 kcal, per €, of protein, carbs, fat, fibre | use |
| Exercises | use, name, e1RM, last done, weekly sets | — | use |
| Pantry | days left, name, cost | — | days left |
| Movements | date, amount | — | date (newest) |
| Entries, weighings, sessions | date | — | date (newest) |
| Models | use, name, last used | — | use |

Meals sort per serving; cost only when every price is known (as v1). The
sort and its "relative to" are remembered per list (v1 remembered one for
all lists, in `user_settings.listSort`).

## 4. Filters

Facets come from the data and show their count. They are chips with
several choices at once (shapes.md §4). A collection with more than four
facets shows the first two and «Filtri (n)», which opens the rest in a
sheet (L1). One «Azzera» clears them. The filters are remembered per list
with the sort.

| Collection | Facets |
|---|---|
| Foods | food group (FoodEx2, 18), state (frozen, canned, enriched), in the pantry, NOVA, with a price, tags |
| Meals | moment (7, as v1), dish, tags, saved or recipe |
| Exercises | muscle region, movement pattern, equipment |
| Pantry | to buy, in stock, cooked batches |
| Movements | category (with its subcategories, as v1), shop, account; "no category" |
| Oggi | domain, state (planned, done, skipped) |
| Models | kind (block, day type, week, cycle, habit) |

## 5. Groups and periods

- **Groups:** meals by moment; movements and entries by day, with the
  day's total (as v1); foods by group; exercises by muscle region. A
  group header is a section (L2) and folds.
- **Periods: one vocabulary.** «7 giorni · 30 giorni · 90 giorni · Mese ·
  Scegli» in DateNav, the trackers and Soldi. Earlier and later move by
  the period, «Oggi» comes back (as v1).

## 6. In the kit

- `Find` (a kit component) takes `of` (the collection), `context` (slot,
  time, plan block) and `items`. It draws:
  - the search field;
  - the first facets, with «Filtri (n)»;
  - the sort, as «Ordina: Proteine per 100 kcal ↓»;
  - the results, grouped, each with its reason or its sort value;
  - the empty state, with «crea».
- `boards-tools/find.json` holds the collections:
  - fields searched;
  - sort keys with their direction and unit;
  - facets;
  - groups;
  - the alias dictionary;
  - the periods.
  
  It is built into `Find` and DateNav like the icon registry.
  `packages/kit` mirrors it.
- On the boards, `Find` runs the real rules on the boards' data, so
  «avena 60 g» or a typo can be tried on the canvas.

## 7. Checks

`boards-tools/coherence.js` (runs every board like t2.js), with max 0:
- every search field is `Find`;
- every list of more than 8 rows has `Find`;
- no sort or filter option outside `find.json`;
- one period vocabulary;
- a link's label is the title of the screen it opens (a verb or a picker
  excepted);
- no link to "#";
- the totals on a page agree with each other.
