# lifeos — domain: food (Cibo)

Status: approved structure (ADR-0061); rules decided as cited.
Owns what is specific to food and drink: composition, food targets, fasce, the meal voto, micros,
caffeine and creatine, water, costs, food capture. Horizontal things are cited (PRD-, MOD-, PAT-).
IDs `FD-nn`. Sources: ledger IDs, phase 1 answers (`n04`, `c08`, `x06`: `audit-2026-11/needs.md`),
`v2/dossiers/*.md` §, `v2/engines.md`, ADRs. «Today» = audit of 6 Nov (`audit-2026-11/ledger-B.md`
+ spot checks in `src`).

## 1. Composition and value resolution
- **FD-01** Levels cibo › prodotto › formato (MOD-21 «levels»). Values resolve formato › prodotto › cibo,
  field by field, each with its provenance; meals, goals and voti use only the cibo. [FOOD-17, HOME-02,
  ADR-0055, ADR-0060] — Today: built.
- **FD-02** A line with no product reads the food's preferred product (last used), else the food's own
  values. No mean across brands (x06, c08; supersedes objects.md §9.1(a), FOOD-45, ADR-0060 «generic mean»);
  the first food with two products eaten reopens it as a change (PRD-41). — Today: built ahead
  (`core/food/brands.ts` use-weighted mean, dormant: no food has two products).
- **FD-03** A barcode belongs to the formato (GS1: new net content = new GTIN); a formato holds its package
  or piece weight and its own values only where its label differs, and exists for the price per kg only
  (x06: no formats in meals). [FOOD-48, objects §3–§4, ADR-0060, MOD-22] — Today: built.
- **FD-04** A food carries ~40 nutrients per 100 g/ml (MOD §8) plus: food group (~16 from EFSA FoodEx2 L1),
  DIAAS band (high ≥ 100, medium 75–99, low < 75; group default), leucine, fatty acids (SFA, MUFA, PUFA n-6,
  ALA, EPA+DHA, trans), free vs intrinsic sugars, whole/refined grain, GI when published, water, caffeine mg
  and creatine g per 100, NOVA (shown, never scored); each value with source and confidence (MOD-12).
  [FOOD-06, FOOD-08, FOOD-15, FOOD-24, kinds.md; FAO 2013, Atkinson 2021] — Today: partial (DIAAS as a
  high/medium/low stand-in; no GI, fibre types, origin).
- **FD-05** Two views of each macro: **kind** = the segments of its bar (protein by DIAAS band; carbs whole
  / refined / intrinsic sugars / free sugars; fat MUFA / PUFA n-6 / omega-3 / SFA / trans; fibre by type);
  **source** (food group, then the food) opens under the bar. The share no estimate covers is «senza stima».
  [FOOD-07, FOOD-28, FOOD-11] — Today: built.
- **FD-06** An empty field is unknown, never 0 (OFF's empty values too); unknowns are left out and named,
  never summed as 0. [FOOD-25, FOOD-41, PRD-22] — Today: built.
- **FD-07** Snapshot specifics (MOD-11, ADR-0007): a food line copies the resolved values, compounds and
  `cents` (price per 100 g/ml on the day eaten). Sodium = salt ÷ 2.5 (EU label rule). [FOOD-26, ranges §4,
  costs §4] — Today: built (#318 for `cents`).

## 2. Meals in time
- **FD-10** Role from the time when not chosen: pranzo from 11:00, spuntino from 15:00, cena from 18:30,
  else colazione (day boundary 04:00, MOD-10); stored at save with source `auto` | `manual`; moving the
  bounds never rewrites the past. A role is a name, not a container (MOD-60, PRD-24). [FOOD-23, FOOD-03,
  capture §4 §9.1, n04 (he chose a role 3 times in 55)] — Today: built.
- **FD-11** Meals sit on the timeline by time; meals of one role form a group only when neighbours (≤ 60 min
  apart, nothing between); a snack shows where its time is. [FOOD-35, capture §5] — Today: built
  (`features/day/meal-groups.ts`).
- **FD-12** Relation labels (MOD-60) carry their evidence hints: pre-workout carbs 0.5–1 g/kg 1–3 h before;
  post-workout protein 0.25–0.4 g/kg within 2 h; pre-sleep protein ≈ 0.4 g/kg; judged only through the
  voto's «timing» part (FD-51). [FOOD-09, FOOD-34, c03, E5 «Slots»; ISSN 2017, Jäger
  doi:10.1186/s12970-017-0177-8] — Today: built (`targets/slots.ts`).
- **FD-13** Never «colazione saltata» for an empty slot. Advice (MOD-52) only when the energy of a time band
  (a metric window, MOD-40) is under his usual for that band. [FOOD-34, FOOD-36, n04] — Today: not built (no
  band metric; the threshold is set by the change that builds it).

## 3. Targets of the day (goals, MOD-42)
- **FD-20** The day's food targets are Obiettivi (MOD-42), dynamic: kcal = E(t) − deficit, never under the
  BMR (Mifflin–St Jeor) nor 1 200; E(t) and trend weight W from MOD-54. [E5, targets §5, PROD-45] — Today:
  built (three goals, `core/goals/food.ts`, read by `core/day/targets.ts` `dynamicTargets`;
  «Rec»'s values copied by `drizzle/0008`, his numbers unchanged: 2211/167/61 on 19 Oct).
- **FD-21** Deficit from the weight goal's pace (% BW/week): lose 0.5–1.0, gain 0.10–0.25, recomposition
  0.05–0.5; deficit = pace × W × ρ / 7; a recomposition deficit never over 500 kcal (Murphy & Koehler 2022);
  with no weight goal, the goal's own deficit (Rec: 200 kcal). [E5, v1 ADR-0045, targets §9.2; Helms 2014,
  Garthe 2011] — Today: built.
- **FD-22** Protein = g/kg × W (Rec 2.2; fascia FD-31); fat = g/kg × W (Rec 0.8) and ≥ 20 % kcal and ≥ 0.6
  g/kg; carbs the rest; fibre 14 g/1 000 kcal, at least 25 g; limits as FD-31. Reference weight = W, the
  trend weight, confirmed by him 6 Nov (supersedes E5 «target weight» and ranges §8b «last 7 days' weigh-ins»). [E5, targets §5,
  FOOD-02] — Today: built (fasce still read the 7-day weigh-ins).
- **FD-23** Estimated continuously, changed weekly: the week's targets are made on the first open of a day
  in it, from MOD-54 over the 56 days before its Monday, and kept 7 days; no «accetta»; «Ricalcola la
  settimana» remakes them. A day's own numbers are a Decision (MOD-44). The week's carry-over (±30 %, never
  under the BMR) is advice only. [targets §9.1 §9.3, v1 ADR-0047, MacroFactor help art. 222] — Today: built.
- **FD-24** No fixed day models (Rest, Run, Gym): no day types (MOD-32). A meal blocco's kcal and protein
  share is derived from the goal and only judges and advises (MOD-35); slot target = share × day targets.
  [x04, c04, E5 «Slots»] — Today: `slotTargets` built; old models in `templates` until phase 4.

## 4. Fasce (MOD-41)
- **FD-30** Four levels: da evitare · pessimo · ok · ottimo. Score: 1 in ottimo; ok 1 → 0.5 to its far edge;
  pessimo 0.5 → 0; da evitare 0. Edges marked \* in FD-31 are the app's (1.5× and 2.5× the limit), said so
  in the «Perché?». [FOOD-02, ranges §5 §9.1] — Today: built (`engines/targets/ranges.ts`).
- **FD-31** Day fasce (E = the day's kcal, W = FD-22). Today: built.

| Number | pessimo | ok | **ottimo** | ok | pessimo | da evitare | Source |
|---|---|---|---|---|---|---|---|
| protein g | < 0.83 W | 0.83–1.6 W | **1.6–2.2 W** (2.3–3.1 × lean mass) | 2.2–3.0 W | > 3.0 W | — | EFSA 2012; Morton 2018 doi:10.1136/bjsports-2017-097608; Helms 2014 doi:10.1186/1550-2783-11-20 |
| fat g | < 15 % E | 15–20 % E | **20–35 % E** | 35–40 % E | > 40 % E | — | EFSA 2010 doi:10.2903/j.efsa.2010.1461 |
| carbs g | < 3 W | — | **3 W – 60 % E** (5–7 W hard day) | 60–65 % E | > 65 % E | — | EFSA 2010; Thomas 2016 doi:10.1249/MSS.0000000000000852 |
| fibre g | < 10/1 000 E | 10–14/1 000 E | **≥ 14/1 000 E and ≥ 25** | > 60 g | — | — | EFSA 2010; IOM 2005; Reynolds 2019 |
| free sugars g | — | — | **< 5 % E** | 5–10 % E | > 10 % E | > 20 % E* | WHO 2015 |
| saturated g | — | — | **< 10 % E** | 10–12 % E | > 12 % E | — | WHO 2023 |
| trans g | — | — | **< 1 % E** | — | > 1 % E | — | WHO 2023 |
| salt g | — | — | **≤ 5** | 5–7.5* | > 7.5* | > 12.5* | WHO 2023; EFSA 2019 |
| caffeine mg/day | — | — | **≤ 400** | — | > 400 | > 600* | EFSA 2015 doi:10.2903/j.efsa.2015.4102 |
| inulin+FOS g | — | — | **≤ 10** | 10–20 | > 20 | — | Bonnema 2010 |

- **FD-33** Limits (salt, free sugars, saturated) are judged on the day and on the 7-day mean; the voto uses
  the mean; the bar shows the week's mean as a tick. [ranges §5 §9.4, E5 «Week»] — Today: built.
- **FD-34** A day still going is judged on eaten + planned; an «at least» number is not called short before
  the day ends («giornata incompleta»). Fallbacks: no weight → protein 10–35 % E (EFSA/IOM); carbs' floor
  never past 45 % of E; salt without a sweat allowance (said on the bar). [ranges §7 §8b §9.3] — Today:
  built.
- **FD-35** A meal gets fasce only where evidence is per meal: protein from 0.25 g/kg (0.25–0.4, ISSN 2017),
  leucine ≈ 2.5 g; the rest shows its share of the slot or day. [FOOD-02, ranges §5] — Today: partial
  (leucine not judged).
- **FD-36** Kinds judged: free sugars, SFA, trans, omega-3 ≥ 0.5 % E, omega-6 4–10 % E (EFSA 2010),
  inulin+FOS; the other kinds are shown, unjudged. No macro is judged by origin or absorption beyond DIAAS
  protein quality (x07). [ranges §8b, FOOD-30, n11] — Today: built.

## 5. Micros
- **FD-40** EFSA references by sex and age: pessimo < AR, ok AR–PRI (or < AI: an AI-only nutrient is never
  pessimo), ottimo PRI–UL, da evitare > UL only when the UL's scope is total intake (magnesium's is
  supplements); sodium 2 g upper aim; vitamin D «dal cibo; il sole non è contato». [FOOD-02, FOOD-29, E5;
  IOM 2000 doi:10.17226/9956; EFSA DRV 2017, UL v11 2025] — Today: built (AR only for A, C, folate, Ca, Fe).
- **FD-41** Coverage (MOD-41, PRD-23): a micro is judged on a day only when the foods carrying a value for
  it make ≥ 80 % of the day's kcal; below, «non so». The summary counts judged micros only. [n11, FOOD-30] —
  Today: not built (judged on whatever is known, «n su m coperti · stime»).

## 6. The meal voto (MOD-43)
- **FD-50** Scope: a meal (sum of its lines) or a food, on 100 kcal of it (food page, Elenco sort «Voto»).
  No voto under 5 kcal («senza voto»: a coffee), for herbs and spices, for an assunzione, or without density
  (limits alone never make a good voto). [FOOD-01, FOOD-03, meal-score §8] — Today: built
  (`core/food/score.ts`).
- **FD-51** Parts with fixed weights (adjustable weights not now, x10; supersedes E7's v1 weights
  40/25/15/20). [FOOD-01, meal-score §8 §9] — Today: built except «valore» (`value: null` though lines now
  carry prices, FD-07).

| Part | Weight | 0 → 1 | Source |
|---|---|---|---|
| density | 30 | NR = mean share of daily reference per 100 kcal over the present nutrients (protein × quality 1 / 0.8 / 0.6, unknown 0.7; fibre, K, Ca, Fe, Mg, A, C, D, folate, omega-3), each ≤ 100 %; part = min(1, NR ÷ (4 × 100 / day kcal)); needs ≥ 6 of 11 | NRF9.3, Drewnowski 2009 |
| limits | 20 (locked) | each of free sugars, sodium, SFA, trans vs the WHO daily limit shared by the meal's kcal (≥ 10 % of the day's limit): 1 at it, 0 at twice; the worst decides | WHO 2015/2023 |
| valore | 10 | NR per € of 100 kcal vs the catalog median: 0.5 at the median, 1 at ≥ 2×; priced foods only | Drewnowski 2010 doi:10.3945/ajcn.2010.29300 |
| fit | 10 | the role's meals of the day vs the blocco's share (FD-24): kcal ±15 % → 1, ±65 % → 0; protein ≥ 85 % → 1, < 35 % → 0; mean | the goal |
| carbs quality | 8 | mean of whole/intrinsic share (≤ 30 % → 0, ≥ 75 % → 1) and carbs per g fibre (≥ 25 → 0, ≤ 10 → 1); from 5 g carbs | Liu 2023 |
| fat quality | 7 | unsaturated ÷ saturated (≤ 0.5 → 0, ≥ 2 → 1); from 3 g fat | AHA 2017 |
| satiety | 7 | mean of protein (1 → 0, 6 g → 1) and fibre (0.3 → 0, 2 g → 1) per 100 kcal | Holt 1995 |
| variety | 4 | food groups with ≥ 10 % of kcal: 1 → 0.25, 2 → 0.6, 3 → 0.85, 4+ → 1; one-food meal: none | — |
| timing | 4 | within 2 h after a session: protein ÷ (0.3 g/kg or 25 g); within 2 h before bed (FD-61): ≤ 20 % of the day's kcal → 1, ≥ 40 % → 0; else none | ISSN 2017 |

- **FD-52** A nutrient counts in a part only when the foods carrying it make ≥ 80 % of the meal's kcal; a
  part left out is named («senza: valore, adatto al blocco»). [meal-score §8, MOD-43] — Today: built.
- **FD-53** The composer shows «come sarà» and ranks «Pasti adatti» by voto; the proposal engine (MOD-51)
  reads the same. [FOOD-01, FOOD-14] — Today: built in the composer.
- **FD-54** The day voto's food parts: «obiettivi del giorno» (40) = the mean of each macro's and limit's
  fascia score with the micros as one item (FD-41 applies); «distribuzione proteine» (15) = eaten meals with
  ≥ 0.3 g/kg protein (25 g without a weight), three or more full, none with fewer than two meals (Areta
  2013). [ranges §5, meal-score §9 «DAY v2», FOOD-10] — Today: built (micros' coverage as FD-41 not).

## 7. Caffeine, creatine and assunzioni
- **FD-60** A dose is the compound on the line (mg caffeine, g creatine per 100 × grams), never a name; a
  line with no time counts at noon; the day reads the 60 days before it. [FOOD-18, FOOD-21, compounds §4] —
  Today: built.
- **FD-61** Caffeine left(t) = Σ dose × ½^(h / 5 h). Bedtime = that evening's sleep, else the median of his
  last 14 nights, else 23:30 said «di solito». A personal half-life 3/5/7 h waits for BODY-11. [FOOD-40,
  compounds §5; EFSA 2015] — Today: built.
- **FD-62** Caffeine judged: day ≤ 400 mg (FD-31), one dose ≤ 200 mg; at bedtime < 50 mg ottimo, 50–100 ok,
  > 100 pessimo; last coffee = bedtime − 9 h (a dose > 150 mg: − 13 h). The pill shows only when one of
  these is off; the coffee's mg always. [FOOD-40, compounds §5 §9; Gardiner 2023
  doi:10.1016/j.smrv.2023.101764; Drake 2013 doi:10.5664/jcsm.3170] — Today: built.
- **FD-63** Creatine stores: S_t = min(1, S_{t−1}(1 − k) + r × dose_t ÷ E_max), E_max = 0.35 g/kg × W (else
  last weigh-in, else 75 kg), k = 0.06/day, r = 0.5, S_0 = 0; shown daily once ever logged («scorte ≈ 83 % ·
  in calo da 3 giorni»), and on a session. Supersedes «days ≥ 3 g of 28» (FOOD-02, FOOD-18, ranges §5).
  [FOOD-40, compounds §5; Hultman 1996 doi:10.1152/jappl.1996.81.1.232; Kreider 2017
  doi:10.1186/s12970-017-0173-z] — Today: built; water note on early weigh-ins not built.
- **FD-64** An item is an assunzione when proposed at ≤ 4 kcal/100 (EU «energy-free», Reg. (EC) 1924/2006
  Annex) or carrying caffeine/creatine, always editable; it has a dose (1 capsula, 3 g); one tap logs dose ×
  1 (capture «quick», MOD-01) with no role and no voto, counted in nutrients, compounds and fluids; taken
  inside a meal it stays a meal line; logged alone with > 20 kcal/100 it asks once «ha calorie: lo segno
  come pasto?». [FOOD-03, FOOD-05, FOOD-44, objects §4 §5 §9.4, ADR-0060] — Today: built except the «pasto?»
  question.

## 8. Water
- **FD-70** Need = EFSA AI of total water (2.5 l men, 2.0 women; ≈ 20 % from food) + sweat per session 0.5 /
  1.0 / 1.5 l/h by intensity, + 0.05 l/h per °C apparent over 20 (within 0.5–2 l/h) + 0.05 l per °C of the
  day's highest apparent over 25. Shown as advice with its reason (MOD-52), never judged itself. [E10; EFSA
  2010; ACSM 2007] — Today: built (`engines/hydration`).
- **FD-71** Intake = drinks + food water from the catalog; habitual caffeine counts as fluid (Maughan &
  Griffin 2003; Killer 2014). Weighed before and after training: replace 1.25–1.5 × the mass lost. [E10] —
  Today: built.
- **FD-72** Water voto: vs expected now 50 (the need spread over waking hours), after training 30 (1.25–1.5
  × estimated sweat within 2 h), spread 20 (small doses, little in the 2 h before bed). [E7 «Water»;
  Shirreffs 1996] — Today: built.
- **FD-73** Water keeps its own type (ml) for FD-70 but shows as an assunzione (same row and door, +250 /
  +500). [objects §9.5] — Today: built.

## 9. Costs
- **FD-80** Three numbers never mixed: **costo** of what is eaten (Cibo, always «≈»), **speso** (Soldi
  movements, exact), value at home (not now, x03). The voto and the cost sit side by side, never merged (Rao
  2013 doi:10.1136/bmjopen-2013-004277). [HOME-14, costs §1 §3] — Today: built for the costo.
- **FD-81** Price per kg: a formato's = cents ÷ package size of its latest observation per shop up to the
  day (cheapest shop); a prodotto's = median of its formati; a cibo line with no product = FD-02's product.
  Observations come from «Aggiorna prezzo» and purchases (the pantry survives only as this, x03); a price
  older than 180 days counts, said «prezzo di <mese>». [ADR-0055, MOD-22, costs §5 §9.4] — Today: partial
  (food = median of all its formats, same while ≤ 1 product; writing observations, 180-day words not built).
- **FD-82** Line cost = its own grams × its snapshot `cents` (never a price per gram reused on another
  quantity: the 16 Oct bug); entry = Σ lines × servings, or the entry's own price when eaten out (0 allowed,
  «offerto»); day = Σ fatto voci, planned apart («ancora da mangiare ≈ … · a fine giornata ≈ …»); week/month
  = Σ days, per day ÷ days with food. [HOME-14, costs §5 §7] — Today: partial (line, entry, day built #318;
  eaten-out price, week and month not).
- **FD-83** Coverage = kcal on priced lines ÷ kcal; a total shows only at ≥ 80 %, else «≈ 4,80 € · 2 senza
  prezzo»; water with no price costs 0 and is not missing; rounded to 0,10 € on totals, 0,01 € on a line.
  Shown in the open meal and in «Il giorno», never on the closed row nor in Corpo. [costs §5 §6 §9.1 §9.3,
  UI-52] — Today: built.
- **FD-84** Value = cost per 1 000 kcal and per 100 g protein; Elenco sorts «Costo» (per 100 g) and
  «Valore»; Cibo · Andamento «Costo» with «Speso in alimentari» on its own line. [costs §6, UI-09, KEEP-12;
  Carlson & Frazão 2012, USDA ERS EIB-96] — Today: not built.

## 10. Capture specifics (PAT-60…64)
- **FD-90** Barcode: his formati → Open Food Facts → new. A known code opens its food; an unknown one asks
  «È una marca di un tuo cibo?» → prodotto or formato under it, else a new cibo › prodotto › formato. OFF
  fills every value it has (label, micros, caffeine, package size) and the brand, editable; «non trovato su
  OFF» ≠ «OFF non risponde». [FOOD-43, FOOD-48, HOME-03, objects §6] — Today: built.
- **FD-91** A label without a barcode is typed field by field (confidence 0.9, MOD-12); no photo or receipt
  reading (PRD-27, c10, x01). [HOME-06, FOOD-39] — Today: built.
- **FD-92** Stima: a meal's totals with every label field (kcal, protein, carbs, sugars, fat, saturated,
  fibre, salt) and servings, confidence 0.6, one 100 g line, optional «Quanto hai pagato?»; an unknown thing
  becomes a cibo «stima» at once (PAT-60, MOD-14). [FOOD-22, FOOD-32, FOOD-41, n01] — Today: partial (fields
  built; saved to the catalog by hand, not at once).
- **FD-93** «× porzioni» multiplies every line (PAT-31); editing a logged meal's lines is a local copy
  marked as changed (MOD-11); composer search most eaten first with the last quantity (MOD-51); saved meals
  point at cibi with an optional preferred product; a voce keeps the product and formato used. [FOOD-20,
  FOOD-27, FOOD-31, FOOD-47, ADR-0055] — Today: built.

- **FD-94** v1's meal ratings, free tags and food origin are kept as data (imported:
  `rating:<factor>` on pasti, `tags` on voci, `origin` on cibi), never deleted; they come back in
  phase 4 as generic fields of the pasto and cibo types (a voto 1–5, an etichetta, a choice), no
  screen of their own. Fibre tolerance that grows with habit: not now. [FOOD-11, FOOD-14, FOOD-24;
  his pick 6 Nov] — Today: data imported, no UI.

## 11. Not now (his answers, 6 Nov; product.md §4)
Mean across brands, formats inside meals (x06) · macros judged by origin or absorption beyond
DIAAS (x07) · receipt and label-photo reading (x01, c10) · a pantry that plans: stock, days left,
to buy, best-before, places, minimums, batches, value at home (x03) · accounts, bank/PayPal
import (x02) · hunger 1–5 (x09) · adjustable voto weights «Come valutiamo» (x10).

