# Dossier — the score of a food and a meal (E7 «Food and meal»)

Status: **approved as recommended** (2026-10-24, «procedi con le scelte che
ritieni migliori»); meals scored on Oggi — see §8 for what changed in the
build. Method:
`../method.md`. Why now: the boards draw a score behind every meal box (the
skyline), open it on its parts, and use it to suggest meals («Pasti adatti»)
and to sort the catalog (fidelity.md); v2 has no scorer. engines.md E7
already fixes the model's parts and weights; what is missing are the
thresholds that turn nutrients into a 0–1 part — the place where a score
becomes «fatto a caso» if chosen in passing.

## 1. Question
"Is this meal (or food) good for me, for its energy?" One number 0–100 on the
shared scale (70 = met, 40 = in part, content.md), with its parts shown.

## 2. Today
- The model (engines.md E7): **density** 40 % (25–60): protein × DIAAS, fibre,
  K, Ca, Fe, Mg, vitamins A/C/D, folate, omega-3; **limits** 25 % (locked
  ≥ 20): free sugars, sodium, SFA, trans; **value** 15 % (0–30): useful
  nutrients per €; **fit to its block** 20 % (0–30): kcal and protein vs the
  slot's shares. `score()` already leaves out and names a part it cannot
  compute and reweighs the others.
- The data (refined 23 Oct export, 110 foods with estimates): 11 micros on
  all 110 (vit D, B12, C, folate, Ca, Fe, Mg, K, I, Se, Na); fat kinds
  (MUFA, n-6, n-3, SFA) on 98; protein quality (high/medium/low) on 79; free
  sugars on 28; a price per 100 g on 47. **Not in the data:** vitamin A,
  DIAAS, trans fats.

## 3. Evidence
- Nutrient Rich Foods index NRF9.3: per 100 kcal, the sum of %DV of 9
  qualifying nutrients, each capped at 100 %, minus the sum of %MRV of 3
  limits; validated against diet quality (HEI) (guideline-like, widely
  used: Drewnowski 2009, J Am Coll Nutr 28:421S; Fulgoni 2009, J Nutr 139:1549).
- Reference values: EFSA DRVs for the person's sex and age (E5 already
  computes them: `microTargets`).
- Limits: WHO free sugars < 10 % of energy (2015), sodium < 2 g/day (2023),
  saturated fat < 10 % of energy, trans < 1 % (2023) (guidelines).
- Protein quality: DIAAS (FAO 2013) is the standard; we have only a
  three-level quality estimate per food (high/medium/low).

## 4. Model (proposal)
All per 100 kcal of the food or meal; a meal is the sum of its lines.
- **Density.** For each qualifying nutrient present in the data: amount per
  100 kcal ÷ the person's daily reference, capped at 100 %; protein weighted
  by its quality (high 1.0, medium 0.8, low 0.6, unknown 0.7 — a stand-in
  for DIAAS). NR = the mean over the nutrients present. **Part = min(1,
  NR ÷ 20 %).** Why 20 %: 100 kcal are ~5 % of a 2 000 kcal day; a food that
  brings on average four times its energy share of what you need counts as
  fully dense. Vitamin A is left out and named until the data has it.
- **Limits.** For each limit known for the food: amount per 100 kcal ÷ its
  allowance per 100 kcal (free sugars 2.5 g, sodium 0.1 g, SFA 1.1 g, trans
  0.11 g: the WHO daily limits spread evenly over the day's energy). A food
  within its energy's share is fine; **each limit scores 1 at or under its
  share, 0 at twice it, linearly between**; the part is the worst of them
  (one excess is not averaged away). Free sugars and trans unknown for most
  foods: left out per food and named.
- **Value.** NR per € (the same NR ÷ the price of 100 kcal), scored against
  the catalog's median: 1 at twice the median or more, 0.5 at the median.
  Only foods with a price; otherwise left out.
- **Fit to its block.** Needs a slot's targets (day templates, Piano): left
  out until then, and named.

## 5. Experience
- Oggi: the skyline behind each meal box (columns as wide as each part's
  weight, filled to its score), the open box with the parts and their
  values, «come valutiamo» linking to the model's page.
- Composer: «La cena, come sarà» with the score; «Pasti adatti» sorted by it.
- Libreria: sort by score; the score on a food's page with its parts.

## 6. Acceptance tests (to run on the developer's foods before any UI)
1. Fish, legumes, vegetables of the catalog: density ≥ 0.8.
2. Dark chocolate 50 %, hazelnut cream: limits ≤ 0.3 (SFA, sugars).
3. A coffee (no energy): no score (per 100 kcal is meaningless) — shown as
   «senza voto».
4. The 15 Oct lunch (gnocchi alla sorrentina) vs the 15 Oct snack (protein
   gelato): the parts explain the difference in words.
5. Every left-out part is named on the score («senza: valore, adatto al
   blocco»).

## 7. Questions for the developer
1. **The density threshold: 20 % of daily needs per 100 kcal = full marks?**
   Recommended: yes, then checked against test 1 on your catalog; adjusted
   once with the numbers in front of you.
2. **Limits: the worst one decides** (not their mean)? Recommended: yes — a
   meal with a lot of salt is not saved by having no sugar.
3. **Protein quality weights 1.0 / 0.8 / 0.6** until real DIAAS values are in
   the catalog? Recommended: yes, marked as an estimate.
4. **Score foods too** (Libreria sort, a food's page), not only meals?
   Recommended: yes, same model.

## 8. As built (2026-10-24, `core/food/score.ts`, `features/day/score.ts`)
Run on the developer's catalog first (§6), which changed three thresholds:
- **Full density scales with the day:** 4 × (100 kcal ÷ the day's kcal),
  14.4 % on 2 778 kcal, not a fixed 20 %.
- **Limits per meal, not per 100 kcal:** the daily limits shared by the
  meal's energy, but never less than 10 % of the day's limit — per 100 kcal
  alone, spinach's own sodium failed it.
- **Density needs ≥ 6 of its 11 nutrients:** a mayonnaise read without its
  micros scored like broccoli on two capped nutrients.
- A nutrient counts when the foods carrying it make ≥ 80 % of the energy;
  under 5 kcal no score. Catalog check: broccoli 100, cod 91, Greek yogurt
  63, chickpeas 60, gnocchi 23, bread 12, dark chocolate 50 % 9.
- Oggi: skyline behind each scored meal box; the open box shows the score,
  each part with its weight, the limit that decided it («limiti · sale») and
  «senza: valore, adatto al blocco».
- **Open:** scoring a single food (Libreria) needs a reference portion —
  per 100 g favours light foods, per serving needs servings the catalog
  lacks; the composer's choices do not read micros yet. Next slice.
