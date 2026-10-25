# Dossier — ranges: how far from good each number is

Status: **approved as recommended** (2026-10-24, «per il resto sì ok»). Method:
`../method.md`. Spec: engines.md E5 (targets) and E7 (judgements),
content.md §3 (`F.cap`, `F.reach`, `F.judge`), kinds.md (macro kinds,
compounds). Boards: Nutrients (L0/L1/L2), NutrientPanel, DateNav, Box.

## 1. Question

"Is this number fine, and how fine?" Today every bar has one tick, the
target: 140 g of protein against 154 looks «short» though it is optimal,
and 6 g of salt against 5 looks like 120 % of something good. The
developer (2026-10-24): «non avevamo detto che dovevamo fare uno studio
sui range, quali le aree categoricamente vietate, quali pessime, quali ok,
quali ottime? … una sorta di heat bar … nel caso di certe macro i range
sono dinamici, come per le fibre … questo vale anche per le barre dei
sottotipi, e dei micronutrienti». And: «non mi piace come vengono trattati
creatina e caffeina». The boards never drew zones: only the target tick
and three states (`F.cap`, `F.reach`). This dossier adds them.

## 2. Today

- **Targets (E5, `apps/v2/src/core/engines/targets/day.ts`):** protein
  1.6–2.2 g/kg of the reference weight (one value picked by preference),
  fat ≥ 20 % kcal and ≥ 0.6 g/kg, carbs the rest, fibre 14 g/1 000 kcal
  (≥ 25 g); maxima sugars 90 g/2 000 kcal, saturated < 10 % kcal, salt 5 g.
- **Micros (`targets/micros.ts`):** EFSA PRI/AI per sex and age, with the
  UL and its scope (magnesium's UL applies to supplements only, folate's
  to folic acid…). `microState`: short / met / over.
- **Kit bars (`packages/kit/src/Nutrients.tsx`):** a fill and one tick at
  the target; limits as «v / max» with `F.cap` (warn over 85 %).
- **Caffeine and creatine:** v1's `ingredient_compounds` are converted to
  catalog values (`core/convert/catalog.ts`), but a meal line's snapshot
  carries nutrition fields only: **no day knows its caffeine or creatine
  in mg/g.** Oggi shows «CAFFÈ 7,2 g» and «CREATINA 3,4 g» as food boxes
  with grams. The gym's context guesses coffees from line names.
- **Audit, the developer's 25 logged days of 26 Sep–23 Oct** (local copy
  of the 23 Oct export; reference weight 75.6 kg):

| Number             | p10   | median | p90   | Reading                                    |
| ------------------ | ----- | ------ | ----- | ------------------------------------------ |
| kcal               | 1 828 | 2 435  | 3 557 |                                            |
| protein g/kg       | 1.6   | 2.0    | 2.4   | inside the evidence band most days         |
| fibre g/1 000 kcal | 8.9   | 18.8   | 23.6  | some days low; others 68 g (inulin)        |
| fat % kcal         | 17    | 26     | 38    | below 20 % on 1 day in 10                  |
| saturated % kcal   | 3.2   | 6.2    | 10.0  | fine                                       |
| free sugars % kcal | 3.0   | 5.7    | 8.1   | between WHO's 5 and 10                     |
| salt g             | 3.8   | 6.0    | 11.6  | over 5 g on most days                      |
| omega-3 (ALA) g    | 0.2   | 1.5    | 2.1   |                                            |
| vitamin D µg       | 0.7   | 3.5    | 3.9   | far under the AI from food alone           |
| iron mg            | 4.4   | 12.4   | 18.9  |                                            |
| magnesium mg       | 240   | 551    | 772   | «over the UL» if the UL's scope is ignored |

## 3. Evidence (guideline → meta-analysis → study; strength in brackets)

**How to judge an intake against a reference** (IOM 2000, _DRI:
Applications in Dietary Assessment_, doi:10.17226/9956) [consensus]:
below the average requirement (AR) half of people are short; at the PRI
almost nobody is; an AI only says «adequate», never «short» below it;
above the UL, the risk of harm rises. → Zones come from AR, PRI/AI and UL,
and an AI-only nutrient can never be «bad» for being under its AI.

| Nutrient          | Zones and their sources                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Protein           | EFSA PRI 0.83 g/kg (2012) [guideline]; 1.6 g/kg where gains plateau, CI up to 2.2 (Morton 2018, doi:10.1136/bjsports-2017-097608) [meta-analysis]; ISSN 1.4–2.0, higher in a deficit (Jäger 2017, doi:10.1186/s12970-017-0177-8) [position]; 2.3–3.1 g/kg of lean mass when cutting (Helms 2014, doi:10.1186/1550-2783-11-20) [review]; no UL; no harm seen up to ~3.3 g/kg for a year in trained men (Antonio 2016, doi:10.1155/2016/9104792) [small RCT] |
| Fat               | EFSA RI 20–35 % kcal (2010, doi:10.2903/j.efsa.2010.1461) [guideline]; low-fat diets lower testosterone ~10–15 % (Whittaker 2021, doi:10.1016/j.jsbmb.2021.105878) [meta-analysis]                                                                                                                                                                                                                                                                         |
| Carbs             | EFSA RI 45–60 % kcal (2010, doi:10.2903/j.efsa.2010.1462) [guideline]; for training, 3–5 g/kg on moderate days, 5–7 g/kg on harder ones (Thomas 2016, ACSM/AND/DC, doi:10.1249/MSS.0000000000000852) [position]                                                                                                                                                                                                                                            |
| Fibre             | EFSA AI 25 g (2010) and IOM AI 14 g/1 000 kcal (2005, doi:10.17226/10490) [guidelines]; benefits keep rising past 25–29 g (Reynolds 2019, doi:10.1016/S0140-6736(18)31809-9) [meta-analysis]; no UL; inulin/FOS beyond ~10 g a day brings GI symptoms in many (Bonnema 2010, J Am Diet Assoc 110:865) [small RCT]                                                                                                                                          |
| Free sugars       | WHO < 10 % kcal [strong], < 5 % [conditional] (2015, ISBN 9789241549028)                                                                                                                                                                                                                                                                                                                                                                                   |
| Saturated / trans | WHO < 10 % / < 1 % kcal (2023, ISBN 9789240073630) [guideline]; EFSA: SFA «as low as possible» within an adequate diet                                                                                                                                                                                                                                                                                                                                     |
| Omega-3 / omega-6 | EFSA AIs: ALA 0.5 % kcal, EPA+DHA 250 mg, linoleic 4 % kcal (2010) [guideline]                                                                                                                                                                                                                                                                                                                                                                             |
| Salt              | WHO < 5 g salt (2 g sodium) (2023) and EFSA 2 g sodium safe and adequate (2019) [guidelines]; heavy sweating raises losses (ACSM 2007 fluid replacement) — a disagreement for training days, noted, not modelled yet                                                                                                                                                                                                                                       |
| Micros            | EFSA AR / PRI / AI / UL with scope (already in `micros.ts`)                                                                                                                                                                                                                                                                                                                                                                                                |
| Caffeine          | EFSA 2015 (doi:10.2903/j.efsa.2015.4102): up to 400 mg/day and 200 mg at once are safe for healthy adults; ~100 mg near bedtime can lengthen sleep latency [guideline]; 400 mg 6 h before bed cut sleep by > 1 h (Drake 2013, doi:10.5664/jcsm.3170) [RCT]; 3–6 mg/kg ~60 min before helps performance (Guest 2021 ISSN, doi:10.1186/s12970-020-00383-4) [position]; half-life ~5 h (2–10)                                                                 |
| Creatine          | 3–5 g/day, or 0.3 g/kg for 5–7 days to load (Kreider 2017 ISSN, doi:10.1186/s12970-017-0173-z) [position]; muscle saturates in ~28 days at 3 g/day (Hultman 1996, doi:10.1152/jappl.1996.81.1.232) [study]. What matters is days taken, not one day's grams                                                                                                                                                                                                |

## 4. Data

| Datum                                         | Where                                                                     | Note                                      |
| --------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| Reference weight, lean mass when known        | E4 / settings                                                             | protein, fat, carbs per kg                |
| The day's kcal (target) and its training load | E5, day model                                                             | scales every %-kcal zone and carbs g/kg   |
| Caffeine mg, creatine g of a line             | **new:** compounds copied into the line's snapshot, like nutrition fields | from `catalog_values` (2 compounds today) |
| AR per micro                                  | **new** in `micros.ts` beside PRI/AI                                      | EFSA 2017 tables                          |

## 5. Model

A **range** (E5) is an ordered list of zones on one number, each with a
level, computed for the person and the day:

```
Range = { unit, basis: words, source, zones: [{ to: number, level }] }
level ∈ danger | bad | fair | good   (four, as asked: «vietato, pessimo, ok, ottimo»)
```

Day ranges (all edges scale with the day's kcal _E_ or the reference
weight _W_):

| Number              | danger | bad          | fair          | good                                   | fair        | bad      | danger                  |
| ------------------- | ------ | ------------ | ------------- | -------------------------------------- | ----------- | -------- | ----------------------- |
| protein g           | —      | < 0.83 W     | 0.83–1.6 W    | **1.6–2.2 W** (2.3–3.1 × lean)         | 2.2–3.0 W   | > 3.0 W  | —                       |
| fat g               | —      | < 15 % E     | 15–20 % E     | **20–35 % E**                          | 35–40 % E   | > 40 % E | —                       |
| carbs g             | —      | < 3 W        | —             | **3 W – 60 % E** (5–7 W on a hard day) | 60–65 % E   | > 65 % E | —                       |
| fibre g             | —      | < 10/1 000 E | 10–14/1 000 E | **≥ 14/1 000 E and ≥ 25**              | > 60 g (GI) | —        | —                       |
| free sugars g       | —      | —            | —             | **< 5 % E**                            | 5–10 % E    | > 10 % E | > 20 % E\*              |
| saturated g         | —      | —            | —             | **< 10 % E**                           | 10–12 % E   | > 12 % E | —                       |
| trans g             | —      | —            | —             | **< 1 % E**                            | —           | > 1 % E  | —                       |
| salt g              | —      | —            | —             | **≤ 5**                                | 5–7.5\*     | > 7.5\*  | > 12.5\*                |
| micro               | —      | < AR         | AR–PRI        | **PRI–UL**                             | —           | —        | > UL (scope total only) |
| micro (AI only)     | —      | —            | < AI          | **≥ AI**                               | —           | —        | > UL                    |
| caffeine mg/day     | —      | —            | —             | **≤ 400**                              | —           | > 400    | > 600\*                 |
| caffeine at bedtime | —      | —            | —             | **< 50 mg**                            | 50–100      | > 100    | —                       |
| inulin+FOS g        | —      | —            | —             | **≤ 10**                               | 10–20       | > 20     | —                       |

\* An edge no guideline sets (the guidelines give one line, not how bad
beyond it): the app's choice, 1.5× and 2.5× the limit, said as such on
the nutrient's page; the developer can move them.

- **Score of a number** (0–1, for E7): 1 inside good; inside fair, linear
  from 1 at the good edge to 0.5 at the far edge; inside bad, 0.5 → 0;
  danger 0. One rule for every nutrient.
- **A meal** gets zones only where evidence speaks per meal: protein
  0.25–0.4 g/kg (ISSN), leucine ≈ 2.5 g; the rest shows its share of the
  slot (day templates) or of the day, without zones.
- **Limits over a week:** salt, sugars and saturated are judged on the
  7-day mean (engines.md E5); a single salty day is «fair» on the day's
  bar only if the week is fine. The day shows both: zone of the day, and
  a tick for the week's mean.
- **Caffeine:** each coffee's mg from its compound; the amount left at a
  minute = Σ dose × 0.5^(Δt / 5 h) (one half-life, said as an estimate);
  at the night's bedtime (E4's sleep). **Creatine:** days taken out of the
  last 28 and «saturazione ≈ k %» = min(1, days at ≥ 3 g ÷ 28).
- **Aggregation:** number zone score → «obiettivi del giorno» (the day
  score's 45 % part on the boards) = the mean over the macros and limits
  plus the micros as one item → the day's E7 score → the week strip's
  bars (DateNav) and the month's dots.

## 6. Experience

- **The heat bar (kit `Nutrients`, every judged bar: L1, kinds, limits,
  micros):** the bar unchanged (the nutrient's kinds in their shades, the
  planned part hatched, the target tick); its **tip** in the colour of the
  zone it ends in; under it a thin **ruler**: every zone a stretch of one
  line (good green and thicker, the near zones yellow, the far ones bare),
  a tick with the amount where a zone changes (labels too close drop their
  words). The zone's word in the label («ottimo», «da limitare») and the
  aria. Picked by the developer on 2026-10-25 among four real-markup
  options (painted track, separate strip and the glued band rejected).
- Tapping a nutrient (L1 → L2) shows its range in words: «1,6–2,2 g/kg,
  cioè 121–166 g oggi · Morton 2018».
- **Caffè:** a drink row «Caffè ≈ 100 mg», meta «a letto ne restano
  ≈ 13 mg» (as the Main board); a pill «≈ 100 mg» on the meal it was
  with. **Creatina:** a supplement box «Creatina 3,4 g», meta «integratore
  · 11 giorni su 28» (the Main board), a pill «creatina 3,4 g» when it is
  inside a meal, and in «Altro» of the micros «3,4 / 3 g». (Coffee and
  creatine as boxes: done in #266.)
- **Week strip (DateNav):** under each day four thin bars in
  transparency (the developer's pick, 2026-10-25), no score line: food
  against its targets (coloured by its score), the worst limit as a share
  of its allowance, training (done full, planned hatched), habits done.

## 7. Edge cases

A day logged only in part (kcal far under target): zones of «at least»
numbers are not judged before the day ends, or judged on what is logged
with «giornata incompleta»; vitamin D from the sun (food alone is always
short: AI-only, never «bad», with the note); magnesium over its UL from
food (the UL's scope is supplements: not judged); no reference weight
(protein falls back to % kcal 10–35 %, EFSA/IOM); a refeed or a race day
(carbs g/kg from the day model's load); inulin taken as a supplement
(counted by kind); a decaf (its compound is ~0).

## 8. Acceptance tests (the developer's days)

1. 15 Oct, 140.7 g protein at 75.6 kg: zone good (121–166 g), score 1;
   today's bar would read «short» — the heat bar reads «ottimo».
2. A day at 11.6 g salt (p90): bad for the day; the week mean decides the
   limit part of the score.
3. Vitamin D 3.5 µg vs AI 15: fair, never bad; the note says «dal cibo;
   il sole non è contato».
4. Magnesium 551 mg vs UL 250 (supplements only): good, not danger.
5. A coffee at 08:33 with 100 mg: «a letto (23:30) ne restano ≈ 13 mg» (three half-lives);
   two coffees after 16:00 put bedtime over 50 mg → fair.
6. Creatine taken 11 days of the last 28: «saturazione ≈ 40 %».
7. Fibre 68 g on an inulin day: the fibre bar good up to 60 g, then fair;
   inulin 12 g fair («meglio a dosi graduali»).

## 8b. Built (2026-10-24)

Slice (a): `core/engines/targets/ranges.ts` (tests: §8's 1–7), the heat
bar in kit `Nutrients` (macros, limits, micros), Oggi's day box zoned.
Choices made in the build: the reference weight is the last 7 days'
weigh-ins (as §8), not E5's target weight; without day targets the
energy is what the day holds (WHO's %-of-energy limits read the intake);
free sugars from the kinds when the foods have estimates, else the total
without zones; the AR for vitamin A, C, folate, calcium and iron (EFSA
2017; the only micros with a PRI). Not yet: the week's mean
tick on limits, meals' protein zones, caffeine and creatine bars, the
day score and the week strip (slice c).
Same day, slice (c) and the developer's review: the zones moved off the
bar's track onto a strip of their own (the track painting mixed with the
kinds' shades); a day still going is judged on eaten + planned; the day
score (E7 `DAY`, 45/35/20 as the boards) behind «Il giorno» and on the
week strip; limits judged on the week's mean (a triangle); «Altro» with
caffeine and creatine; a coffee's pill judges what is left at bedtime; a
meal's protein zoned from 0.25 g/kg (ISSN). Carbs' floor never past 45 %
of the day's energy (a short day cannot ask 3 g/kg). Then, on the
developer's review: zones as a 3 px band glued to the bottom of the bar
itself (not a separate strip), and the kinds a guideline speaks of judged
too (free sugars, saturated, trans < 1 % E, omega-3 ≥ 0.5 % E, omega-6
4–10 % E, inulin ≤ 10 g); the other kinds stay unjudged.

## 9. Questions for the developer

1. **Four levels (danger, bad, fair, good) with these words: «da
   evitare», «pessimo», «ok», «ottimo»?** Recommended: yes — a fifth
   («sufficiente») blurs what the colours mean.
2. **Protein's good zone 1.6–2.2 g/kg (2.3–3.1 of lean mass in a deficit)
   rather than one target?** Recommended: yes; the target stays as the
   tick inside it.
3. **Salt: the WHO's 5 g, without a training-day allowance for sweat
   until hydration (E4) measures losses?** Recommended: yes, said on the
   bar.
4. **Limits judged on the day and on the 7-day mean, with the score
   using the mean?** Recommended: yes.
5. **Order of slices:** (a) ranges engine + heat bar in the kit +
   compounds in the snapshot; (b) Oggi: every box opens, caffeine and
   creatine as in the boards, the meal's L1/L2 complete; (c) the day
   score and the week strip's bars. Recommended as listed, (a)+(b) in one
   PR.
