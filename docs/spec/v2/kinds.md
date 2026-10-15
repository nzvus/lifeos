# v2 — Built-in kinds, by domain

Each row is a kind (`concepts.md` §2). Shape: **I** instant, **∫**
interval. Entry: **Q** quick (one tap or a number), **F** form generated
from the fields, **T** timer, **S** specialised editor. Metrics and
targets are the defaults; the user can add their own. The agent's
additions beyond v1 and the developer's list are marked ✚.

## Food and drink (specialisation: nutrition)

| Kind | Shape | Fields | Entry | Metrics · targets | Relations |
|---|---|---|---|---|---|
| meal | I | meal role (breakfast / lunch / dinner / snack, from time if not chosen), servings, lines (food × g), estimated (typed totals) | S (food composer) | every nutrient per day, per slot, share after 21:00; cost · kcal range, protein ≥, fibre ≥, salt ≤, sugars ≤, saturated ≤ | pre/post-workout, pre-sleep, late; hours since last meal |
| drink | I | food line (coffee, milk, juice) or water ml | Q | water ml per day ≥; caffeine from its food | caffeine before bed |
| water ✚ | I | ml | Q (+250 / +500) | sum per day ≥ (EFSA AI 2.5 l men incl. food water) | — |
| supplement / medication ✚ | I | catalog item (dose, compounds), amount | Q from a routine | caffeine curve, creatine saturation, adherence % | before/after meal; before bed |
| hunger ✚ | I | scale 1–5, before/after a meal | Q | mean per meal kind; relation to protein/fibre (correlation) | 2 h after a meal |

Food catalog: food (nutrients per 100 g/ml as rows with source and
confidence), recipe (food parts → per serving), product (brand, barcode,
package → its food).

### What a food carries (so every macro can show its kinds and sources)

Two views of each macro, both derived from the catalogue (decided
2026-10-15):
- **kind** (chemistry and quality): the segments of every nutrient bar;
- **source** (food group, then the food): what opens under each bar.

| Field | Values | Source |
|---|---|---|
| food group | ~16 groups folded from EFSA FoodEx2 level 1: meat, fish, eggs, dairy, legumes, soy, cereals whole, cereals refined, tubers, vegetables, fruit, nuts and seeds, oils and fats, sweets, drinks, supplements | EFSA FoodEx2 |
| protein quality | DIAAS (high ≥ 100, medium 75–99, low < 75); group defaults when unknown | FAO 2013; Herreman 2020 |
| leucine | g per 100 g (~2.5 g per meal is the usual threshold for muscle protein synthesis) | USDA FDC; Morton 2015 |
| fatty acids | SFA, MUFA, PUFA n-6, ALA, EPA+DHA, trans | CREA, CIQUAL, USDA FDC |
| sugars | free/added vs intrinsic and milk sugars (WHO: free sugars < 10 % kcal) | WHO 2015; label |
| grain | whole / refined (for cereals) | label, FoodEx2 |
| glycaemic index | when published | Atkinson 2021 tables |
| water | g per 100 g (feeds hydration) | CREA, CIQUAL |
| compounds | caffeine, creatine per 100 g (v1 already has them) | label |

Each value keeps its **source** and **confidence** (CREA, CIQUAL, USDA
FDC, the label, an estimate). Kinds in the bars are fixed per macro:
- protein by DIAAS band;
- carbs: whole, refined, intrinsic sugars, free sugars;
- fat: MUFA, PUFA n-6, omega-3, SFA, trans;
- fibre: its types.

## Training and movement (specialisation: training)

| Kind | Shape | Fields | Entry | Metrics · targets | Relations |
|---|---|---|---|---|---|
| session | ∫ | routine ref, exercises → sets; or estimated (minutes, intensity, kcal) | S (gym mode, editor) | volume per muscle per week, e1RM(RIR) per exercise, density, burn range · weekly sets per muscle range | after a meal (fuel), sleep the night before |
| set | ∫ (child) | reps, load (per dumbbell × 2 shown), RIR, warm-up, side, rest before | S | e1RM(RIR), tonnage, actual rest | order in session |
| steps | I (per day or device sample) | steps, counted / planned | Q, device | sum per day ≥ | — |
| walk / run / ride ✚ | ∫ | distance, duration, elevation | F, T, import | km per week, pace trend | — |
| on your feet | ∫ | — (time standing / moving at work) | F (from the day template's activity block) | hours per day | — |
| mobility / stretching ✚ | ∫ | minutes, areas | Q, T | sessions per week (habit) | after training |

## Body

| Kind | Shape | Fields | Entry | Metrics · targets |
|---|---|---|---|---|
| weigh-in | I | kg, fasted, after toilet, after training | Q | trend weight W ± σ (Kalman), weekly rate · reach target by date |
| measurements | I | waist, abdomen, neck, hip, body fat %, limbs (L/R) ✚ | F | waist-to-height, FFMI, Navy body fat · ranges |
| blood pressure / resting HR ✚ | I | systolic, diastolic, bpm | F, import | 7-day mean · at most |
| symptoms / pain ✚ | I | area, scale 0–10, note | Q | days with, by area |

## Sleep and recovery

| Kind | Shape | Fields | Entry | Metrics · targets |
|---|---|---|---|---|
| sleep | ∫ (ends on its day) | bed, wake, quality 1–5, awakenings ✚ | F, from wake/bed taps | hours vs own need, regularity (SRI), mid-sleep, debt · hours range, bedtime ≤ |
| nap ✚ | ∫ | — | T | minutes per day |
| soreness ✚ | I | areas, 1–5 | Q | feeds recovery |

## Mind

| Kind | Shape | Fields | Entry | Metrics · targets |
|---|---|---|---|---|
| check-in | I | mood, energy, stress 1–5, moment (morning / evening) | Q | z-score vs 28 days; weekly means |
| journal | I | text, tags, links to entries | F | days written; words; tags · habit |
| gratitude / wins ✚ | I | up to 3 lines | Q | streak |
| meditation / breathing ✚ | ∫ | minutes, technique | T | minutes per week · habit |

## Work, learning, time

| Kind | Shape | Fields | Entry | Metrics · targets |
|---|---|---|---|---|
| activity block | ∫ | category (work, study, commute, chores, leisure, social, family, screen), project ref, focus 1–5 | T, F, from the day template | hours per category per day / week; planned vs actual · ranges |
| focus session ✚ | ∫ (pomodoro) | project, interruptions | T | focus hours per week |
| reading ✚ | ∫ or I | book ref, pages / minutes | Q, T | pages per week; books finished · reach N by date |
| study / practice ✚ | ∫ | subject ref, minutes, topic | T | minutes per week; streak |
| task ✚ | I (due) | project, done, effort | Q | done per week; overdue |
| screen time ✚ | ∫ per day | minutes by category | import, F | minutes per day · at most |
| social ✚ | I/∫ | people refs, kind (call, meet), quality 1–5 | Q | contacts per week |

## Money and home (specialisations: money, pantry)

| Kind | Shape | Fields | Entry | Metrics · targets |
|---|---|---|---|---|
| movement | I | signed cents, account ✚, category, shop, method, tags, lines | F, receipt scan, import | spent per category per month, pace, balance per account · budget at most |
| purchase | I | product, packages, price, best-before ✚, location ✚ | from a receipt line, F | price per g per food, stock |
| stock count | I | product/food, quantity | Q | stock, days left |
| chore ✚ | I | catalog chore (every N days) | Q from its routine | overdue, streak |
| plant / pet care ✚ | I | item ref, action | Q | every N days (habit) |

## Environment (imported, read-only)

| Kind | Shape | Fields | Entry | Used by |
|---|---|---|---|---|
| place | ∫ | city (home, from Settings) or GPS when allowed, altitude | Settings, phone | every environment kind |
| weather | hourly | temperature, apparent temperature, humidity, UV, precipitation | Open-Meteo (free, no key) | hydration (E10), sleep (night temperature), training, correlations |
| air | hourly | PM2.5, ozone, pollen (Europe) | Open-Meteo air quality | correlations, training outdoors |
| daylight | day | sunrise, sunset, hours of light | computed from place | mood, sleep timing, correlations |

## Habits and goals (no own kinds: they are built from the others)

- **A habit** = a routine template (one block, any kind) + a recurrence.
  Its planned entries are ticked done or skipped; metrics streak,
  completion %, regularity. Examples: water 2 l, stretching 3×/week,
  read 20 pages, no screens after 23:00 (a kind with "at most" on a
  metric), creatine daily.
- **A goal** = a metric + window + target (+ date): lose to 73 kg by
  March, 2 books a month, 8 h of study a week, save €300 a month,
  10,000 steps a day on weekdays.

## What a user-made kind looks like

"Guitar practice": interval, fields `piece` (text), `focus` (1–5);
metrics minutes per week; target ≥ 120 min a week; a routine 4× a week
at 19:00 → it shows on the timeline as a planned block, ticked by its
timer, charted on its tracker page, reviewed next to sleep and mood. No
migration, no new screen.
