# 02 — Food: ingredients, meals, the log, moments, quality, scores

Read from: `core/nutrition/*` (totals, moments, slots, bands, targets,
week, day-score, quality, quality-summary, analysis, preview, servings,
off), `core/nutrition/repositories/*`, `core/supplements/*`, schema
`nutrition.ts`, `supplements.ts`. ADRs in force: 0007, 0009, 0011 (as
amended by 0044), 0012, 0022, 0039, 0040, 0042, 0047, 0050.

## 1. Objects and what is collected

| Object | Fields | Entered | Table |
|---|---|---|---|
| Ingredient | name, description, unit g/ml, 8 nutrients per 100 (kcal, protein, carbs, sugars, fat, saturated fat, fibre, salt), package price + size, NOVA 1–4, origin (plant/animal/mixed), fibre types (yes/no list of 7), free tags, caffeine/creatine amounts | Food → Ingredients form; barcode → Open Food Facts prefill; label photo OCR; `upsert:ingredients` CLI | `ingredients`, `ingredient_tags`, `tags`, `ingredient_compounds` |
| Meal | name, lines (ingredient × g for one serving), category (a moment hint), notes, review, 1–5 ratings per factor | Food → Meals | `meals`, `meal_items`, `meal_ratings`, `rating_factors` |
| Log entry | day, label, servings, planned/eaten, time (`at`), moment, estimated, left out, batch | Today: "+" sheet, slot "+", in-place editing | `log_entries`, `log_entry_left_out` |
| Entry lines | a **snapshot** of each ingredient: name, unit, quantity, 8 nutrients, price, quality | copied at logging (ADR-0007) | `log_entry_items` |
| Estimate | typed totals for a meal out ("pizza ~900 kcal") | "+" sheet → estimate | an entry with one line, `estimated = true` |
| Batch | a meal cooked × N portions, its lines snapshot | Pantry → cook | `batches`, `batch_lines` |
| Closed day | complete / partial | Today chip | `day_closures` |

**Derived on read, never stored:** every total (`totals.ts`, exact
decimals, "totals = parts"); meal totals from *current* ingredient values;
entry totals from the *snapshot*; cost per line and per day; the moment of
an old entry from its time; usage counts (60 days) for "most used first";
quality summaries (energy by NOVA, protein by origin, fibre by type);
caffeine in the body and creatine saturation (`core/supplements`).

## 2. Moments, slots and the timeline today

- `moment` is one closed list: breakfast, lunch, snack, dinner,
  pre_workout, post_workout, pre_sleep. A time derives only the first
  four (`momentAt` with the user's bounds 11:00 / 15:00 / 18:30).
- Main meals form one group each; snacks are placed by their own time and
  named by part of the day (`groupByMoment`).
- A day type's program has timed slots with kcal/protein shares
  (ADR-0044). `withSlots` matches groups to slots; an empty slot becomes a
  placeholder. Without training, pre/post-workout slots turn into snacks
  (`withoutTraining`, 2026-10-11). Pre/post slots follow the session's
  real start (`moveWithSession`).
- Slot hints: pre-workout carbs 0.5–1 g/kg; post-workout and pre-sleep
  protein ~0.4 g/kg (ISSN 2017). `suggestForSlot` ranks saved meals.

## 3. Scores today

- **Day quality** (`day-score.ts`), 0–100, weights 40 / 35 / 25 / 20:
  targets met (zone score per macro), processing (energy from NOVA 1–2
  full, 3 half, 4 none), fibre variety (types ≥ 1 g → 0/40/70/90/100),
  sleep (7–9 h). Missing parts are re-weighted.
- **This week** (`week.ts`, ADR-0047): energy against the week's budget
  (carry ±30 %, never under BMR), protein days in the good zone, 7-day
  averages for fibre, salt, sugars, saturated fat, a regularity note.
- **Analysis** (`analysis.ts`): adherence per nutrient, by day type,
  eating window and energy by part of the day, plans never confirmed.

## 4. Issues found

**F-1 Eight nutrients, one column each, in three tables.** Ingredients,
entry lines and batch lines each repeat the 8 columns. Adding vitamins and
minerals that way means ~25 columns × 3 tables. D7 (2026-10-09) already
chose one row per nutrient; nothing is built yet. The developer asks for
micronutrients "with researched optimal ranges and limits".

**F-2 Fibre types are guesses.** A yes/no list per ingredient. A line's
fibre is split *evenly* among its types (`quality-summary.ts`), and the
fibre-variety score (25 % of the day) is built on that split. Inulin
(the developer's ~7 g/day of powder) cannot be measured.

**F-3 `moment` mixes three questions.** Which meal (breakfast…dinner),
how it relates to training (pre/post) and to sleep (pre-sleep). One field
can't answer all three. A post-workout lunch must choose between "lunch"
and "post-workout". A breakfast logged as pre-workout leaves the
breakfast slot empty, and the timeline marks it "skipped?"
(`EntryList.tsx`, considerations.txt).

**F-4 The day score mixes food and sleep, with hand-picked weights.** 35 %
for NOVA rests on the user's own classification (unclassified energy is
left out). The parts are not validated against any outcome. The
developer: "valutazioni più concrete e valide".

**F-5 Duplicate instead of "based on".** Creating a variant needs a copy
and a rename (considerations.txt: "partire da una base di default di un
altro ingrediente o pasto, così togliamo duplicate").

**F-6 An ingredient has no source.** Values from a label, Open Food Facts,
a composition table or a guess look the same, so a re-check is never
prompted.

**F-7 Compounds are a separate panel.** Caffeine and creatine have their
own Energy/Supplements panel; the developer wants them on the timeline
(FEEDBACK 10-11).

**F-8 Collected, unused.** Meal ratings (shown, never analysed), tags
(labels only, as documented), `review` and `notes` on meals.

**F-9 Hunger and satiety are not collected.** Useful for meal timing on a
cut (plan §2.6), and to judge "this breakfast kept me full".

## 5. Proposals

💡 **P-1 A nutrient catalogue [decision, needs research].** One closed list
in `core/nutrition/catalogue.ts`: macros, fibre fractions, sugars
(added/free when known), fatty acids (saturated, MUFA, PUFA, omega-3
EPA/DHA/ALA, trans), cholesterol, sodium/salt, potassium, calcium, iron,
magnesium, zinc, selenium, iodine, phosphorus, vitamins A, D, E, K, C,
B1, B2, B3, B6, B9 (folate), B12, choline, caffeine, creatine, alcohol.
For each: unit, EU NRV (Reg. 1169/2011), EFSA DRV (AR/PRI/AI) and UL,
sex/age variants, the source. Values stored one row per nutrient per
ingredient and per snapshot line (D7), with a **source** and a
**confidence** (label, OFF, CREA, USDA FDC, estimate). The research is a
task of its own: each range cites its primary source (Principle 3).

💡 **P-2 Meal role + relations, not one moment [decision].** An entry
keeps a *meal role* (breakfast / lunch / dinner / snack, by time when not
chosen). Relations are **derived**, never typed: minutes before or after
the day's training block or session, before bedtime, after 21:00. They
show as tags ("post-workout", "late") and are evaluated: protein
0.25–0.4 g/kg within ~2 h after training, carbs 1–3 h before long or
hard sessions, a pre-sleep protein, the share of energy late (ISSN 2017;
chrononutrition reviews). Skip the training and the tag goes by itself.
Amends ADR-0011/0044; old `pre_workout`/`post_workout` entries map to
the meal role by time.

💡 **P-3 "New from…".** Every ingredient and meal form can start from
another one (all fields copied, name suffixed). "Duplicate" is removed.
For meals, also "from this day's entry" (a restaurant meal that becomes
a saved meal).

💡 **P-4 Scores that can be defended [decision].** Three scores, each
with a published basis, shown side by side and never mixed:
- **Targets**: the week-context reading of ADR-0047 (energy against the
  week, protein daily, limits as averages).
- **Food quality**: a nutrient-density index (e.g. NRF 9.3, Drewnowski
  2009) on the snapshot. It becomes computable once P-1 gives
  micronutrients; NOVA stays as information.
- **Distribution**: protein spread (meals ≥ 0.25–0.4 g/kg), peri-workout
  coverage, late energy (P-2).
Sleep moves to the recovery score (04-recovery-mind P-2).

💡 **P-5 Fibre in grams by type.** Fibre types become nutrients of the
catalogue (P-1): inulin/FOS, β-glucan, resistant starch, psyllium,
pectin, GOS, insoluble. Fermentable fibre gets a *tolerance* band that
grows with habitual intake (~5–10 g/day inulin to start; the developer's
request of 2026-10-10). Total fibre keeps no maximum.

💡 **P-6 One tap after a meal: hunger 1–5 two hours later** (optional,
off by default). Analysed against protein, fibre and energy density of
that meal.

💡 **P-7 Compounds on the timeline.** A dose is an entry like any other;
the caffeine curve and creatine saturation are drawn on the timeline and
in the day's detail, not in their own panel (06-interface).

💡 **P-8 Ratings and tags analysed.** "Your best-rated meals that fit
this slot" (`suggestForSlot` ranks by fit, then use, then rating).

## 6. Aggregation (this area)

```
raw        ingredient values (+source) · meal lines · entry snapshot lines · time · servings · status
derived    line nutrients = per100 × g / 100 (exact) · entry, group, day totals · meal role, relations (P-2)
aggregate  day totals vs targets · slot totals vs shares · 7-day averages · eating window
judgement  targets (week context) · food quality (density) · distribution · hunger pattern (P-6)
```
