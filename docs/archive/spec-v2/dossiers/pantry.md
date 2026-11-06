# Dossier — Dispensa (pantry, V-12)

Status: **draft 2026-10-25**, written by the agent while the developer was
away («fai tu le scelte per me»). §9's questions carry the agent's
decisions; the developer reviews them before the pantry's code changes.
**Slice a built (2026-10-25)**: `core/pantry` (stock from purchases,
counts and logged meals; pace over the logged days of 28), Libreria →
«Dispensa» (Da comprare, In casa), a food's «In casa» with «Comprato»
(the last purchase prefilled) and «Ne ho…». Not yet: batches («Lotti
cucinati», ⊕ «Porzioni pronte»), best-before (§9.4), the Oggi reminder,
the shop cadence as a setting (7 days fixed), choosing a format at
«Comprato», purchases' money in Soldi.

## 1. Question

«Cosa ho in casa, cosa sta finendo, cosa devo comprare, e quanto mi costa
mangiare così» — without counting things by hand every day. From the
developer's notes (considerations.txt, 2026-10-09): «una gestione più
intelligente e intuitiva del pantry, degli ingredienti, delle marche, delle
identificazioni, dei conti, delle transazioni… la ui deve essere molto più
intelligente, semplice da usare ma contenente tutto».

## 2. Today

- **v1** (`src/core/pantry/stock.ts`, ADR-0013/0017): stock is never stored,
  it is derived from events — a purchase brings a quantity in, eating and
  cooking take it out, a count replaces the running total from its moment;
  «finisce tra N giorni» = left ÷ the mean daily use of the last window.
  Shopping list from minimums, batches as portions, reminders. Tested; the
  logic is sound.
- **v2**: the schema already holds what the pantry needs — catalog
  `product` and `format` under a food (ADR-0055, a format's size and
  barcode), the kinds `purchase` and `stock count` (kinds.md «Money and
  home»), `batch` entries with their lines (the converter keeps v1's 4),
  `price_observations`, money lines that can point at a purchase entry. No
  screen, no engine yet.
- **The developer's data (23 Oct export)**: 1 product (Latte proteico ·
  Lidl, 1 000 ml), 0 purchases, 0 stock counts, 4 batches cooked on 6 Oct
  (gnocchi ×4, merluzzo ×4, gelati ×1 and ×2), 0 portions logged from them,
  0 of 1 187 logged food lines pointing at a product, 0 receipts. The
  pantry was built in v1 and **not used**: entering purchases by hand was
  too much work for what it gave back.

So the dossier's first job is not more pantry, it is **less typing**: the
stock must fill itself from what is already logged, and the hand entry must
be one tap.

## 3. Evidence

- **Use-by vs best-before** — EU Regulation 1169/2011 art. 24 and Annex X:
  «da consumarsi entro» (safety, perishable) and «da consumarsi
  preferibilmente entro» (quality). Regulation.
  https://eur-lex.europa.eu/eli/reg/2011/1169/oj
- **First expired, first out** (FEFO) is the rotation rule of food logistics
  and of household advice; shelf lives by food and storage from the USDA
  FoodKeeper. Guidance / convention.
  https://www.foodsafety.gov/keep-food-safe/foodkeeper-app
- **Household waste**: ~79 kg per person a year (UNEP Food Waste Index
  2024). Planning meals and shopping lists are among the practices linked
  to less waste (Schanes et al. 2018, systematic review,
  doi:10.1016/j.jclepro.2018.02.030). Review; effects modest, self-reported.
- **Reorder point** (inventory practice): reorder when what is left covers
  less than the days until the next shop, plus a margin. Convention.

## 4. Data

- **Purchase** (typed or from a receipt line): format (or product, or food),
  packages, price, shop, day; best-before optional; location (frigo,
  freezer, dispensa) optional. One tap from a product's page: «Comprato» with
  its last packages, price and shop prefilled.
- **Use**: derived, never typed — every logged meal line of a food (or its
  product) takes its grams out of that food's stock (exact, its quantity ×
  servings); a batch takes its lines out when cooked and gives its portions.
- **Count**: «Ne ho …» on the item — replaces the total from that moment.
- **Minimum**: per food, optional; default none (no shopping suggestion
  until there is a pace).
- Kept as long as entries are (purchases are entries; prices are
  observations used by the score's «valore per euro»).

## 5. Model

Per food (products and formats summed into their food, since the meals log
foods):

    in(t)     = Σ purchases' packages × format size (g or ml)
    out(t)    = Σ eaten lines' quantity × servings  (+ a cooked batch's lines)
    stock     = v1's stockOf(events): in − out, a count resets, never < 0
    daily use = out over the last 28 days ÷ 28   (days with food logged only)
    days left = stock ÷ daily use               (none without use)
    to buy    = days left < next shop + 2 days, or stock < minimum

Aggregation: purchase / meal line (L0) → the food's stock and pace →
Dispensa's lists (in stock, finishing, to buy) → Soldi (what was spent per
category, from the purchases' money) and FOOD's «valore per euro» (price per
useful nutrient). Engines: a new pure `core/pantry/stock.ts` (v1's, ported);
E7 FOOD reads prices for «valore».

## 6. Experience

- **Dispensa** (Libreria shelf; the board Pantry): «Da comprare» on top
  (what finishes before the next shop, one tap «Comprato»), «In casa» (each
  food: what is left, «finisce tra 3 giorni» as a thin bar of days left,
  sorted by days left), «Lotti cucinati» (portions left; tap to log one).
- **A food's page**: «In casa: 650 ml · finisce tra 4 giorni», «Comprato»,
  «Ne ho…».
- **Oggi**: the board's reminder card only when something finishes within
  2 days, one line, dismissible.
- **⊕**: «Porzioni pronte» lists the batches with portions left.
- Empty state: «Segna cosa compri e la dispensa si tiene da sola: quello che
  mangi lo toglie lei».

## 7. Edge cases

Eating something never bought (stock stays 0, the pace still counts: the
first purchase starts the stock); a food bought in pieces but logged in
grams (the format says the grams of a piece, else no stock); a product
eaten through its food (the food's stock); leftovers thrown away (a count
fixes it); a holiday (no meals logged: no pace, days left unknown); a
batch's portions eaten as a meal (the meal's lines came from the batch: not
taken out twice).

## 8. Acceptance tests

1. Latte proteico: a purchase of 2 × 1 000 ml on 20 Oct, then the logged
   lines of 20–23 Oct (100 + 400 + 100 + 100 ml) → 1 300 ml left on 23 Oct.
2. Same, pace 175 ml/day over the days logged → «finisce tra 7 giorni».
3. A count «Ne ho 500 ml» on 22 Oct after 1 400 ml by the books → 400 ml
   on 23 Oct.
4. Gnocchi cooked as a batch of 4 portions on 6 Oct, one eaten on 7 Oct →
   «3 porzioni» in Lotti cucinati and in ⊕ «Porzioni pronte».
5. A food eaten every day and never bought → no stock, no «Da comprare»
   (only a minimum makes it a shopping item).
6. Days left 1 with the next shop in 3 days → in «Da comprare».

## 9. Questions (decided by the agent, 2026-10-25, for the developer's review)

1. **Stock per food or per product/format?** Per food (summed): meals log
   foods; a brand's stock alone would rarely match what is logged.
2. **Is use typed?** No: derived from the meals and batches already logged
   (the reason v1's pantry went unused was typing).
3. **The next shop**: a setting «Faccio la spesa ogni N giorni» (default 7);
   no calendar of shops.
4. **Best-before**: optional per purchase; when given, «Da usare prima»
   lists what expires within 3 days (FEFO); no alerts otherwise.
5. **Receipts** (V-13) fill purchases later; until then «Comprato» is one
   tap with the last values.
