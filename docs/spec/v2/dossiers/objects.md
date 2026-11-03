# Dossier — Objects: families, variants, brands, formats, intakes

Status: **decided 2026-11-03** — the developer: «ok alle raccomandazioni, procedi»:
every §9 answer is the recommendation (a). ADR-0060 accepted. Slices a–g in progress.

Ledger: FOOD-44, FOOD-45, FOOD-46, FOOD-48, TRAIN-37, FOOD-17, FOOD-33, FOOD-03,
HOME-02, HOME-03, HOME-07, PLAN-11, PROD-10, UI-38 · ADR-0055, ADR-0060 (proposed)

## 1. Question
«What is this thing, what is it a kind of, and which one did I have?» In his words
(3 Nov):
- «dovrei poter mergiare o legare con legami gerarchici i cibi che registro…
  creare gerarchie anche dei pasti… un pasto porridge, con una base, e poi delle
  varianti, anch'esse selezionabili… vale anche per altri tracked non di cibo»;
- «nella creazione di pasti o registrazione di cibi singoli dovrei poter selezionare
  i prodotti specifici… altrimenti… una media pesata… tra i vari marchi… visualizzabile
  nelle pagine dell'alimento»;
- «come avevamo deciso di gestire i formati diversi con stesso marchio? quindi con
  prezzo al kg e confezione diversi? e nei pasti ecc? insomma va pensata bene»;
- «caffè e creatina sono ancora segnati come pasti, non posso creare assunzioni?…
  devono per forza essere a 0 kcal? forse sotto una certa densità calorica… anche
  l'acqua dovrebbe essere assunzione no?»;
- «molte cose semanticamente ridondanti, tipo i tragitti di corsa o l'allenamento
  corsa, oppure la corsa semplice 30 min con la corsa… vari alimenti doppioni»;
- considerations.txt: «una gestione più intelligente e intuitiva… degli ingredienti,
  delle marche, delle identificazioni»; «creare partendo da una base… così togliamo
  duplica».

## 2. Today
**Code (v2):**
- One table `catalog_items` (catalog, name, `parentId`, `basedOnId`). `parentId`
  carries food › product › format (ADR-0055). Values are rows in `catalog_values`;
  a recipe's foods are `catalog_parts`, with `defaults` (jsonb) holding a
  preferred product.
- **The composer** offers each product as its own choice (`core/food/choices.ts`).
  With no product chosen, a line takes the food's own values. Nothing averages
  the brands, and formats are never offered (`entry_lines.formatId` is written
  only by the v1 converter).
- **Barcode** is stored on the food (`core/food/edit.ts` `createFood`). Since #321 a
  scan also makes the brand the food's first product.
- **`basedOnId`** is written by nothing since «Duplica» went (#321 «Parti da questo»).
- **«Unisci»** (`core/catalog/merge.ts`): foods and exercises; the twins are proposed
  by the head word (`foodTwins`) on the food's page only.
- **Intake** is its own kind (no role, no score). It is logged through the meal
  composer (`per=assunzione`), and its items are ordinary foods. Water is
  another kind (`water`, ml). The 0-kcal rule ran once, as migration R6 (0003).
- **Running exists three ways:** a route with mode `run` (`core/movement/routes.ts`),
  a session of one cardio exercise (`core/training/activity.ts`), and the exercises
  «Corsa» and «Run» (TRAIN-02 merge still to do: R5 = two taps).

**His data (v2 export 29 Oct; `audit` scripts in the session's scratchpad):**

| What | Count |
|---|---|
| Foods | 135: 73 with no product, 62 with one; **none has two** |
| Products | 62: 60 with one format, 2 with two (Gnocchi Nonna Mia: gnocchi 1 kg / gnocchetti 500 g; Sale: grosso / fino) |
| Products with their own label values | 2 |
| Lines with a product / with a format | 1,185 / 1,076 of 1,383 (from the conversion) |
| Price observations | 65, one per format, never two |

- **Near-duplicates (17 pairs by head word):**
  - the same food:
    - «Passata di pomodoro (Mutti)» / «Passata di pomodoro»;
    - «Ceci lessati (Sol&Mar)» / «Ceci lessati»;
    - «Gnocchetti di patate freschi (Nonna Mia)» / «Gnocchi di patate»;
    - «Burro d'arachidi 100%» / «Burro di arachidi 100%»;
  - different foods: chia / girasole / lino / zucca seeds; the four «Crema…»; three milks.
- **Recipe families:**
  - **7 «GELATO proteico…»** all share 400 g of protein skimmed milk + 15 g of whey,
    differing by one flavour part. «cioccolato e nocciola» and «… 2» are the same
    idea twice.
  - 2 «AVENA…» share oats + milk.
  - 2 «MERLUZZO al sugo» (one + chickpeas and carrots).
- **Intakes:** 80 = coffee capsule 43, creatine 34, ground coffee 3.
  - Foods ≤ 4 kcal/100: Acqua, Caffè macinato, Capsula Lavazza, Creatina, Sale,
    Coca-Cola Zero.
  - 4–20 kcal/100: Bevanda ACE 12, Zucchine 17, Aceto 19.
- **Running:** «Corsa» 11 one-exercise sessions, «Run» 6, plus Cyclette 2 and
  Treadmill 2. No routes yet.

**Reading:** ADR-0055's tripwire («most foods one product, one format → B would do»)
is met by the converted data. The cause is that nothing in v2 makes a second brand
easy, not that he has none: the duplicates above *are* second brands, kept as foods.

## 3. Evidence
- **Intake threshold.** Reg. (EC) 1924/2006 Annex (as amended by 1047/2012):
  - «energy-free» ≤ 4 kcal/100 ml;
  - «low energy» ≤ 40 kcal/100 g (solids), ≤ 20 kcal/100 ml (liquids).

  Law, the EU's own line for «no energy to speak of»
  ([EC nutrition claims](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en),
  [annex](https://www.legislation.gov.uk/eur/2006/1924/annex)). *Guideline.*
- **When two brands «differ».** The EU guidance on label tolerances (2012) accepts,
  for protein, carbohydrate and fat:
  - ±2 g under 10 g/100 g;
  - ±20 % between 10 and 40 g/100 g;
  - ±8 g above 40 g/100 g.

  Two products inside these bands are, for a label, the same values.
  ([FSAI copy](https://www.FSAI.ie/getmedia/71c87819-77a7-4bf2-b741-2f11cf019c2d/EU-guidance-tolerances.pdf)).
  *Guidance;* the exact table to be re-checked against the PDF in slice b.
- **Generic food from brands.** Composition databases build a generic food as a mean
  of brands. NEVO averages margarines from individual brands. EuroFIR says the method
  depends on how alike the values are and whether shares are known. USDA ERS
  weights brands by sales share, which moves the result versus a plain mean
  ([EuroFIR poster](https://www.openagrar.de/servlets/MCRFileNodeServlet/openagrar_derivate_00026437/A2115-poster.pdf),
  [ERS TB-1880](https://ers.usda.gov/sites/default/files/_laserfiche/publications/47278/51580_tb1880e.pdf),
  [FAO Greenfield & Southgate](https://www.fao.org/4/y4705e/y4705E00.htm)).
  *Convention.* A recent review notes that no framework for aggregating branded
  data exists yet. The share that matters for one person is **his own use**, not the
  market's.
- **A format is a barcode.** GS1: a change of declared net content needs a new GTIN,
  at every level of the hierarchy. So one barcode = one product at one size = our
  *format*, and a barcode belongs on the format, not the food
  ([GS1 decision tool](https://gs1.org/en/standards/id-keys/gtin/gtin-decision-support-tool/declared-net-content)).
  *Standard.*
- **Variants inherit, copies don't.** No standard. The pattern is the app's own: models
  `extends` with stored differences (PLAN-11, concepts §5); recipe apps keep
  «variations» as linked copies. *Convention / opinion.*
- **A run is an activity; a route is a place.** The Compendium codes running by
  speed, not by route. A route only gives the distance (activity.md). *Convention.*

## 4. Data
- **One family relation for every catalog** (foods, products, formats, recipes,
  exercises, routes, the person's kinds' items). There are three different links,
  never mixed:

  | Link | Meaning | Stored | Lives on |
  |---|---|---|---|
  | **level** | what it is under (food › product › format) | `parentId` to the catalog above | yes, values resolve down the levels |
  | **variant** | a version of a base of the *same* catalog (porridge → «con mirtilli») | `parentId` to an item of the same catalog | yes, stores only differences |
  | **copy** | «Parti da…»: started from, then on its own | `basedOnId` | no, provenance only |

  **«Unisci»** is not a link: two become one, and the loser's name becomes an alias.
- **A variant's differences:**
  - **Recipe:** its own `catalog_parts` rows for parts added or changed; a removed part
    is a row with `defaults.removed = true`. No migration (jsonb).
  - **Food:** its own values only where they differ.
  - **Exercise:** its own equipment, rest and setup.
  - **Route:** its own path and distance.
- **Barcode** moves from the food to the format. There are 2 barcodes today; a data
  repair moves them.
- **Intake** is a property of the item, not of the log: `catalog_values.intake = true`,
  plus `dose` (amount and unit: 1 capsule, 3 g, 250 ml). It is proposed automatically
  when the food has ≤ 4 kcal/100 (EU «energy-free») or carries a compound, and it is
  always editable.
- **Price** stays an observation per format (ADR-0055).

## 5. Model
- **Resolving a recipe variant:** variant parts = base parts, then the variant's rows
  (replace by food, add new, drop `removed`). It works on any depth with no loops (as
  `resolve` in E3). Totals per serving follow from the parts.
- **A line's values (L1):**
  - with a product chosen → resolve format › product › food;
  - with no product → the food's **generic** values, by the rule below.
- **Generic food values:**
  - **0 products** → the food's own values.
  - **1 product** → that product resolved.
  - **≥ 2 products** → per field, the **mean weighted by his use** over 90 days
    (lines of that product; a product never eaten counts as 1). The «spread» is the
    min–max. Confidence drops one step when the spread is past the EU tolerance for
    that field (§3). Example: two passate, 100 and 120 kcal, eaten 30 and 10 times
    → 105 kcal, «100–120».
- **Price per kg:**
  - format = cents ÷ package size (latest observation per shop);
  - product = median of its formats;
  - food = weighted like the values.
  - A line's cost takes its format, else its product, else its food (costs.md).
- **Intake on the day:** one tap logs `dose` × 1, as kind `intake` (water stays kind
  `water` for its own engine E10). It counts in nutrients, compounds and fluids, and
  has no role and no score (FOOD-03). An intake item over 20 kcal/100 asks once: «ha
  calorie: lo segno come pasto?».
- **Running (TRAIN-37):** an *activity* (session of one cardio exercise) is what was
  done. A *route* is an optional where, on the activity or on a trip. The exercise
  «Run» merges into «Corsa» (R5) and «Treadmill» into «Tapis roulant» (TRAIN-02). A
  trip whose mode is `run` is logged as an activity on that route, never twice.
- **Aggregation (unchanged above L1):** line → meal → day → week. Variants are
  grouped under their base only in lists and trends («Gelato proteico · 7 varianti ·
  41 volte»); scores read the variant actually eaten.

## 6. Experience
- **Object page (P1):** a «Famiglia» section shows the base and its variants as rows,
  with «+ Variante» (opens the composer or editor with the base's contents, saving
  only differences) and «Parti da…» (copy). On a variant: «variante di Gelato
  proteico · cambia: + 40 g crema pistacchi».
- **Food page:**
  - «Valori» says «media di 3 marche, pesata su come le mangi · 100–120 kcal»;
  - then each brand row with its differing values, its formats and price per kg
    («Nonna Mia · gnocchi 1 kg 1,00 €/kg · gnocchetti 500 g 1,60 €/kg»);
  - «+ Marca» (barcode or by hand).
- **Composer and ⊕:**
  - searching shows the base once, with «7 varianti ▾» opening them (≤ 4 as a
    segmented control, else a drop-down; kit §7);
  - a food line carries a brand pill «media ▾» → the brands, the last one used on
    top;
  - the format is asked only where it matters (pantry, price): it defaults to the
    last bought.
- **Barcode:**
  - a known format opens its food;
  - an unknown code with OFF data asks «È una marca di un tuo cibo?», with the
    likely foods (Find on the OFF name, the OFF category, and the brand among his
    products):
    - a food chosen → new product (or a new format if that brand exists) under it;
    - none → new food + product + format.
- **Intakes:**
  - ⊕ → «Nuova assunzione» (name, dose and unit, caffeine/creatine per dose, kcal if
    any);
  - Oggi's «Al volo» row holds water, coffee and creatine as one-tap chips;
  - no composer.
- **Duplicates:** on creating a food, a product or a recipe, «Esiste già
  «Passata di pomodoro»: è una sua marca? · una variante? · un'altra cosa». A list
  «Possibili doppioni» in Cibo · Elenco (his 17 pairs reviewed once).

## 7. Edge cases
- A base deleted while variants exist: Archivia only (UI-38); variants keep resolving.
- A variant edited to equal its base: «uguale alla base: la tolgo?».
- Brands with very different values (spread past tolerance): the mean is shown «con
  incertezza», and the pill suggests choosing the brand.
- A food with brands but its own typed values (from before): the typed values become
  a product «marca non indicata», so the mean keeps them.
- Past entries never change (ADR-0007): merging, re-parenting or new brands touch
  only what comes next. Totals per day are checked equal before and after each data
  repair (PROD-21).
- An intake taken inside a meal (coffee with breakfast): stays a line of that meal.

## 8. Acceptance tests (his data)
1. **Gelato family:** base «Gelato proteico» = 400 g protein skimmed milk + 15 g
   whey. Variant «al pistacchio» = base + 40 g Crema 100 % pistacchi. Its totals
   equal today's recipe's. Changing the base's whey to 20 g changes all 7 variants
   but none of the 18 + 9 meals already logged.
2. **Passata:** «Passata di pomodoro (Mutti)» becomes product «Mutti» of «Passata di
   pomodoro». Every past day's kcal is unchanged to 0,1. A new line with no brand
   reads the weighted mean of the two.
3. **Weighted mean:** brand A 100 kcal used 30×, B 120 kcal used 10× → generic 105
   kcal, spread «100–120».
4. **Gnocchi formats:** the price per kg is 1,00 € (1 kg at 1,00 €) and 1,60 €
   (500 g at 0,80 €). The product's median is 1,30 €/kg. A logged line of gnocchetti
   is costed at 1,60 €/kg.
5. **Intakes:** the Lavazza capsule (≤ 4 kcal/100) is proposed as an intake with dose
   1 capsule. Bevanda ACE (12 kcal/100) is not; logging it alone asks «pasto?».
   Creatine 3 g logs in one tap, with no role and no score.
6. **Barcode:** a second scan of a saved code opens the format's food, not «Nuovo
   cibo». A new Mutti code with OFF name «Passata di pomodoro» proposes «marca di
   Passata di pomodoro?».
7. **Running:** after R5, 17 sessions are «Corsa». A run trip on a route is logged as
   one activity with the route's km (no second entry, no double steps).

## 9. Questions for the developer — decided 3 Nov, all as recommended (a)
1. **Food with no brand chosen:** **(a) mean of its brands weighted by your use**, with
   min–max shown; (b) a «typical» value typed once; (c) the last brand used.
2. **Weights of that mean:** **(a) your use in 90 days**; (b) your purchases; (c) equal.
3. **Variants store:** **(a) only the differences**, so a change to the base flows to
   them; (b) full linked copies (the base changes nothing).
4. **What makes an intake:** **(a) proposed at ≤ 4 kcal/100 (EU «energy-free») or with
   caffeine/creatine, always editable**; (b) ≤ 20 kcal/100 (EU «low energy» for
   drinks); (c) only by hand.
5. **Water:** **(a) shown as an intake (same row, same ⊕ door), kept as its own kind
   underneath** for hydration; (b) water becomes an intake item.
6. **Running:** **(a) activity = what, route = where (optional), «Run» merged into
   «Corsa»**; (b) keep routes and activities separate as today.
7. **His 17 near-duplicates:** **(a) the agent proposes each (brand / variant / merge /
   different) in one list you tick**; (b) leave them.

Slices after his answers (ADR-0060 accepted):
- (a) the family relation and recipe variants (engine + tests, then the object page);
- (b) the weighted mean and the food page;
- (c) the composer's brand and variant pills;
- (d) barcode on the format and the «È una marca…?» flow;
- (e) intakes as items with a dose, «Nuova assunzione», the «Al volo» row;
- (f) duplicates: the check on create and the review list;
- (g) running: R5 and trips as activities.
