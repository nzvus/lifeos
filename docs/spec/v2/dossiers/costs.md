# Dossier — Costs (what eating costs, HOME-14)

Status: **draft 2026-11-03**, written by the agent with no stop (the developer:
«procedi senza fermarti», then «va capito, mi fido di te», ledger HOME-14).
§9's questions carry the agent's decisions; he can turn any of them over.
**Slice a built (3 Nov, #318):** `core/food/cost.ts` (+ tests), the price
per 100 in the choices and so in every new line's snapshot (`cents`),
migration `0005_data_repair_cost_snapshot.sql` (the v2 lines since 17 Oct),
the open meal's «Costo» tile and per-line cost, «Il giorno»'s «Costo ≈ … ·
previsto ≈ …». On his data of 29 Oct: 13 Oct «≈ 8,30 €», 21 Oct «≈ 6,00 € ·
1 senza prezzo», 28 Oct «≈ 5,20 € · 5 senza prezzo».

Ledger: HOME-14, HOME-02, HOME-10, HOME-09, UI-09, UI-52, KEEP-12, FOOD-17 · ADR-0055, ADR-0007

## 1. Question

His words (3 Nov): «nelle varie schede, magari da espanse, e anche nei totali,
ci siamo dimenticati di mostrare i costi… chiaramente è una spesa stimata
diversa da quella del pantry o indicativa… mi sto confondendo».

The confusion is real: there are **three different numbers**, and the app
must never mix them.

| Number | Question it answers | Where it comes from | Exact? |
|---|---|---|---|
| **Costo di ciò che mangi** | «quanto mi è costato questo pasto / oggi / questa settimana?» | grams eaten × the food's price per gram | estimate |
| **Speso** | «quanti soldi sono usciti?» | Soldi's movements (receipts, ⊕ Spesa) | exact |
| **Valore in casa** | «quanto vale quello che ho in dispensa?» | stock × price per gram | estimate |

What you eat this week was mostly paid last week. «Speso» and «costo di ciò
che mangi» meet only over a month, and the gap between them is waste, stock
growing, or food not logged. So the cost of a meal is **always an estimate
(«≈»)** and lives in Cibo. Money spent lives in Soldi. The pantry shows the
value at home.

## 2. Today

**v1** stored the package price and size on each ingredient
(`packagePriceCents`, `packageSize`) and copied them into every logged line
(the snapshot). Lists sorted by cost, price per kg, value per kcal/€/protein
(KEEP-12, S-F01, S-F03). The 16 Oct dinner bug came from there
(migration.md: a price per gram reused on more grams, 18,59 → 85,79 €).

**v2**:
- `price_observations` (ADR-0055: format, shop, day, cents, package qty)
  is filled only by the v1 import (`core/convert/catalog.ts`). Nothing
  reads it.
- Imported lines keep v1's `packagePriceCents`/`packageSize` in
  `entry_line_values` (`core/convert/facts.ts`). Lines written by v2
  (`core/entries/write.ts`) carry no price, so everything logged in v2 since
  the cutover (17 Oct) has no cost.
- Pantry «Comprato» writes a `purchase` entry with `priceCents`
  (`core/pantry/index.ts` `writePurchase`) but no price observation. Prices
  now live in two places that do not see each other.
- `present.ts:127` shows a purchase's price; the food page prefills the
  last price. No meal, day, list, typical day or Andamento shows a cost.
- Unbuilt and already decided: UI-09 (sort by cost, value per €), UI-52
  (price in the open entry's header), KEEP-12 (v1 lists by cost).

**His data** (refined export 23 Oct, script in the scratchpad):
- 26 logged days (29 Sep → 24 Oct); 63 of 111 live foods have a price.
- 559 of 610 lines on logged days are priced. Median priced share of a
  day's kcal: 100 %.
- A day at home costs a median **6,56 €** (mean 6,88; 11–24 Oct ranges
  2,95–8,41 €; 17,83 € on 16 Oct is the bug above).
- The unpriced lines are almost all **eaten out**: «Indiano · Tandoori
  misto», «2 cheese burger doppi…», the takeaway and pizza estimates of
  considerations2 («mi capita spesso di ordinare un menu hamburger o
  mangiare la pizza»). They are exactly what Soldi records: 4 Oct, «Indian
  restaurant TAR», 23 €.
- Soldi has only 2 movements and no receipts. «Speso» cannot yet be
  compared with what he ate; it can only be shown beside it.

## 3. Evidence

- **Price per edible gram, not per calorie, compares foods fairly.** Per
  calorie, energy-dense foods look cheap; per gram or per portion, many
  healthy foods do not cost more. Carlson & Frazão, USDA ERS EIB-96 (2012),
  https://www.ers.usda.gov/publications/pub-details/?pubid=44678 —
  government report, strong. → the list sort offers both (UI-09 already).
- **Healthier diets cost a little more per day** (≈ $1.50/day/person in a
  meta-analysis of 27 studies). Rao et al., BMJ Open 2013;3:e004277,
  doi:10.1136/bmjopen-2013-004277 — meta-analysis. → the meal score and the
  cost are shown side by side, never merged into one number.
- **Nutrient density per € (nutrient-rich foods index per cost).**
  Drewnowski, Am J Clin Nutr 2010;92:1181–8, doi:10.3945/ajcn.2010.29300 —
  single large study, widely used. → «valore per euro» = protein (or score
  points) per €, already in concepts.md.
- **Valuing stock:** weighted average cost or FIFO (IAS 2 Inventories,
  https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/)
  — accounting standard. Among a format's latest prices, a median works like
  a weighted average for a household. → the median of concepts.md stays.
- **Prices go stale** (Italian food inflation 2022–23 was in double
  digits, ISTAT) — convention. → a price older than 180 days still counts,
  shown as «prezzo del <mese>». The snapshot keeps the price of the day
  the food was eaten.

## 4. Data

Nothing new is typed. Only two things are kept that are lost today:

1. **The price at logging** (ADR-0007 snapshot): every new food line gets
   `packagePriceCents` + `packageSize`, the same fields v1's lines already
   have in `entry_line_values`. **No schema change, no migration.** The
   source is the food's price per gram on that day (§5).
2. **Every price where it was seen becomes an observation**: «Comprato» in
   the pantry, a food's «Prezzo» field, and later a receipt line all write a
   `price_observations` row (source `manual` / `receipt`), besides the
   purchase entry. This joins the two places of §2 (ADR-0055 already says
   it).

Eaten out: an estimated meal can carry its own price (`priceCents` on the
entry, the same field as a purchase), typed or taken from a ⊕ Spesa linked
to it (`entry_links` related). One payment, never counted twice: in Soldi it
is spent, in Cibo it is the meal's cost.

## 5. Model

```
price per g (format f, day d) = cents ÷ package_qty of f's latest observation ≤ d, per shop;
                                 the format's price = the cheapest shop's latest, else the only one
price per g (food F, day d)   = median over F's formats (ADR-0055), unit g or ml
line cost                     = grams × packagePriceCents ÷ packageSize      (snapshot; € cents, rounded at the end)
entry cost                    = Σ line costs × servings, or the entry's own priceCents (eaten out)
coverage(entry|day)           = kcal of priced lines ÷ kcal of all lines
day cost                      = Σ done entries' cost   (planned ones apart: «previsto ≈ x €»)
week / month cost             = Σ day costs; per day = ÷ days with food logged
value                          = cost per 1000 kcal · per 100 g protein (lists, typical days)
valore in casa                = Σ stock_g × price per g (pantry)
```

Aggregation: line (L0, snapshot) → entry → day (L1) → week/month in Cibo ·
Andamento, typical day in Piano (from the price per g today), pantry
value. Engines: a pure `core/food/cost.ts` (line, entry, day, coverage)
shared by `features/day/priced.ts` readers; E7 FOOD reads the price per g
for «valore»; nothing changes in the targets or scores.

Shown only when coverage ≥ 80 % of kcal; below that: «≈ 4,80 € · 2 senza
prezzo» (the missing ones named in the open entry). Rounded to 0,10 € on
totals and 0,01 € on a line. Always with «≈».

## 6. Experience (phone first, dark)

- **Open meal (UI-52):** in the header, next to ×servings, «≈ 1,85 €». Each
  line shows its own cost at level 2 (every nutrient). A line without price
  says «senza prezzo ›», which opens the food's «Prezzo e casa».
- **Closed meal row:** no cost, to keep it slim (P4). The day total carries
  it.
- **«Il giorno» (Oggi and Cibo · Diario):** one more line in the totals,
  «Costo ≈ 6,60 €», with «previsto ≈ 2,10 €» when something is planned.
  Never in Corpo.
- **Cibo · Andamento:** a «Costo» row (tracker page like Acqua): per day
  over 7/30/90 days, mean, cost per 1000 kcal, and, as a separate line
  marked as exact, «Speso in alimentari (Soldi): x €». One sentence explains
  the difference (§1).
- **Cibo · Elenco:** sort «Costo» (price per 100 g) and «Valore» (protein
  per €, per 1000 kcal); the row shows the sort's number (UI-09).
- **A food's page:** «Prezzo e casa» (register G) lists the price per pack
  and per 100 g per shop, the date, and «Aggiorna prezzo» (writes an
  observation).
- **Piano · a typical day:** «≈ 6,90 € al giorno» from today's prices.
- **Dispensa:** «In casa ≈ 23 €» under the title.
- **Eaten out:** the estimate form has «Quanto hai pagato?» (optional);
  ⊕ Spesa offers «È un pasto di oggi?» to link it.

## 7. Edge cases

- **Foods without a price:** coverage drops and the total says so; no
  silent 0 €.
- **Water, coffee at the bar, homegrown food:** water with no price costs
  0 and is not counted as missing (group «acqua»). A bar coffee is an entry
  with its own price.
- **Batches / cooked dishes:** a portion's cost = the batch's ingredient
  cost ÷ portions (HOME-11). Until batches exist, a saved meal's lines are
  costed one by one.
- **Pieces vs grams:** lines are in g or ml (his data: 1068 g, 121 ml);
  pieces go through the format's weight.
- **Old lines from v1** keep their snapshot. Lines logged in v2 between
  17 Oct and the slice get the price of their day, filled once by a
  read-only backfill, then snapshotted (data-repair, logged).
- **A shared meal / a meal paid by someone else:** the eaten-out price is
  what he paid; 0 is allowed («offerto»).
- **The 16 Oct bug:** the price per gram is recomputed per line from its own
  grams, never reused on another quantity. Test 8.4 guards it.

## 8. Acceptance tests (his days)

1. **13 Oct** (31 of 34 lines priced, 100 % of kcal): day cost ≈ 8,41 € in
   the refined export of 23 Oct; «≈ 8,30 €» on the v2 data of 29 Oct (later
   edits), to 10 cents.
2. **21 Oct** (50 % of kcal priced, the burger menu eaten out): the total is
   not shown as a plain number. It reads «≈ 6,00 € · 1 senza prezzo» (v2 data
   of 29 Oct) and the open meal names the burger line «senza prezzo».
3. **4 Oct**: the Indian dinner linked to the 23 € movement costs 23 € in
   Cibo. Soldi still shows −23 € once. The month's food cost counts it once.
4. **16 Oct dinner**: split into three dishes, the cost is the sum of the
   lines' own grams × price per g (≈ 18,6 €), never 85,79 €.
5. A meal logged today in v2 with «Latte scremato proteico» (price from its
   format) snapshots `packagePriceCents`/`packageSize`. A later price change
   does not change that meal's cost.
6. «Comprato» with 1,29 € writes a purchase and a price observation. The
   food's price per g the next day uses it.
7. Cibo · Andamento over 11–24 Oct: mean per day ≈ 6,6 €, shown with «≈»,
   and «Speso in alimentari» on its own line (0 € today: no movements in
   that category).

## 9. Questions (decided by the agent; his to overturn)

1. **Show cost on the closed meal row?** Decided: no. Cost goes in the open
   meal and in the totals (his «magari da espanse, e anche nei totali»).
2. **Eaten out: typed price or linked Spesa?** Decided: both. The link is
   preferred (one payment, two meanings); a typed price stays without Soldi.
3. **Threshold for showing a total:** 80 % of kcal priced, else the
   «senza prezzo» form. Cheap to change.
4. **Price of a food with several shops:** the median of the formats' latest
   prices (ADR-0055), not the cheapest. «Il più economico: Lidl» is shown
   on the food's page.

## 10. Slices

a. `core/food/cost.ts` + tests 8.1, 8.2, 8.4; the snapshot written on new
   lines (5) and the backfill of v2 lines since 17 Oct; the open meal and
   «Il giorno» totals (UI-52).
b. Observations from «Comprato» and «Aggiorna prezzo» (6); a food's
   «Prezzo e casa».
c. Cibo · Andamento «Costo» (7), list sorts (UI-09), typical day, pantry
   value.
d. Eaten out: price on estimates, ⊕ Spesa link (3).
