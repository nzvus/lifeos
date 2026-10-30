# Dossier — the visual study, whole (phase 2 redone, before the screens)

Status: **in progress 2026-10-30**. Plan `~/.claude/plans/ok-ovviamente-spero-che-wise-papert.md`
(approved, mode «Misto»: details decided by the agent and marked so; big choices go to the
developer as 2–3 options built from real components, all in one round). Ledger: UI-03 (his picks
in the `choices` db, read 30 Oct), DATA-09 (L0–L4), DATA-14, DATA-20, PROD-34, UI-60 (map D,
ADR-0059: Oggi + Corpo · Cibo · Mente · Soldi, tabs Diario · Piano · Elenco · Andamento).

Steps: **0c data matrix (this section, done)** → 1 atlas of the whole visual heritage, rendered →
2 criteria → 3 judgement keep / rethink / drop → 4 the renewed kit → 5 the screens.

## 0c. Data: from the gesture to the chart
The developer, 22 and 30 Oct: «utilizzo granulare e pervasivo dei dati, raffinamento delle
informazioni come convergenza da più fonti… quali dati raccogliere, dove vengono usati, gerarchie
di aggregazione e raffinamento… coerenza con la funzionalità, nel piccolo e in tutta l'app».

One row per datum. **In**: how it is collected, effort, precision, sources and how they converge
(E9). **Analysis**: engine and formula with its source (engines.md, the dossiers). **Use**: what
reads it, by level (L1 per fact → L2 state → L3 plans/targets → L4 judgements). **Out**: where it is
seen and at which level, in map D (area · tab; «Oggi» = the day over all areas).

| Datum (L0) | In | Analysis | Use | Out |
|---|---|---|---|---|
| **Meal** (lines, servings, role, time, status) | composer: foods or a saved meal, one tap «Di nuovo»; planned → «Fatto» at the tick; role from the time (auto) or typed; snapshot of each line (FOOD-26) | line nutrients × servings (L1); meal score v2 (FOOD-01: density, limits locked, value, fit, carbs/fat quality, satiety); relations to training/sleep (E1, PROD-14) | day totals → targets and ranges (E5, FOOD-02) → day score; slot fit; pantry use (HOME-01); cost (HOME-02); E4 intake | Oggi · Diario: row with kcal + score, L0 chips of foods; day box bars (one bar per nutrient, zones in the bar, UI-32); Cibo · Andamento: adherence, quality |
| **Intake** (coffee, creatine, supplements) | one tap from «Al volo» / ⊕ (FOOD-03, -05), dose fixed per item | caffeine(t) decay, creatine saturation (L1) | nutrients and ranges; gym context (DATA-21); caffeine → sleep pair (E8) | Oggi: small mark with its dose on the rail; Cibo · Elenco; Legami |
| **Water** | +250 / +500 on its row; ⊕ | E10: EFSA need + sweat by session, temperature (E11), food share 20 % | water score (expected now, after training, spread) | Oggi: water row with bar and buttons; Cibo · Andamento |
| **Session, sets** (reps, load, RIR, start/end, rest) | gym mode: auto or manual, RIR last set, readiness 1–5 (TRAIN-03) | e1RM(RIR), reps vs expected (TRAIN-04), work time, rest; E4a burn per set (BODY-04) | exercise trend (L2) → next target; session score; sets per muscle per week; expenditure; water; weigh-in reliability | Gym; Oggi row «Push · 63 min · 27 serie · ≈ 250–380 kcal»; Corpo · Andamento: trends, e1RM charts, week vs band |
| **Activity** (walk, run, ride: duration, distance, route, effort) | own sheet, «Fatta» or timer (TRAIN-01) | ACSM energy, pace (L1) | expenditure, steps convergence (BODY-01), water | Oggi row with burn range; route spans on the rail; Corpo |
| **Steps, time on feet** | phone total typed once a day (replaces, never adds); else trips ÷ stride + baseline | convergence of sources, > 30 % disagreement said (BODY-01) | NEAT in E4, day burn | Oggi steps row with its burn; Corpo · Andamento |
| **Sleep pieces** (bed, wake, quality) | «Sonno» sheet, one piece per save, the night said under the times (sleep.md) | periods (gap ≤ 2 h), asleep, WASO, naps; score: duration (24 h), regularity, continuity, feel (E7 v2) | weigh-in reliability (short night), water wake, recovery (BODY-08, F), Legami | Oggi: one box per night «6 h 42 · sveglio 50 min»; Corpo · Andamento · Sonno: bars, broken nights, naps |
| **Weigh-in** (+ fasted, toilet, after training) | sheet, context pre-ticked before 11:00, implausible asks | reliability (L1); E4 Kalman W ± σ, expenditure E ± σ (BODY-03) | targets (L3: kcal = E − deficit), goal ETA, BMI/WHtR/FFMI | Oggi: weigh-in row with score; goal line; Corpo · Andamento · Peso: trend with dots by reliability |
| **Measurements** (waist, limbs L/R, body fat) | sheet, rarely | WHtR, FFMI (L1); Katch-McArdle if fat known | E4 prior, body goal | Corpo · Andamento |
| **Check-in** (energy, mood, stress, moment) | five taps each, tap again clears (KEEP-11) | 28-day baseline z (L2) | sleep «feel»; recovery (F); Legami pairs | Oggi chip; Mente · Andamento; Legami |
| **Habits** (from any kind, «N times a week», excused) | tick on Oggi / planned habit entries (PLAN-01) | streak with excuses, regularity 1 − CV (E2) | habit/goal judgements | Oggi; Mente · Piano/Andamento |
| **The person's kinds** (up to 6 fields) | ⊕ of their area; tracker page | E2 metrics by field type | goals; Legami pairs (F: user pairs) | their area's Diario and Andamento (PROD-06) |
| **Money movement** (amount, category, shop, method) | sheet; F: receipts, bank import (DATA-11, HOME-05) | month spent/income, pace vs last month, categories | budget; food spending | Soldi · Diario/Andamento (KEEP-20) |
| **Purchase / pantry** (product, price, best-before) | purchase or receipt line; counts | stock = purchased − eaten ± counts; days left from 28-day use (HOME-01, -10) | shopping list; meal cost, price per g | Cibo · Elenco (dispensa); reminders on Oggi |
| **Weather, air** (imported hourly) | Open-Meteo by city (BODY-06) | — (context) | water heat margin; outdoor training; Legami (F) | Oggi weather card (B opening to A, UI-03) |
| **Goals, templates, cycles** (decisions) | goal form asks target and date, derives pace (ask-human-inputs); Piano | E3 planning, E5 targets (PLAN-10) | day targets, planned entries, next session | each area's Piano; Oggi · Piano; goal line on Oggi |

### Gaps the matrix shows (what is collected and not used, or used and not seen)
1. **Sleep quality and continuity** reach the score but no pair in Legami: the defaults pair
   hours only (BODY-10 wants late energy and caffeine → sleep).
2. **Readiness 1–5** (gym start) feeds nothing yet beyond the session row; DATA-21 wants it with
   sleep, check-in and intake as the session's context.
3. **Intake timing** (caffeine at bedtime) is computed (L1) but shown nowhere near sleep.
4. **Weather** is shown and used for water only; not stored as entries, so no correlation (BODY-06 F).
5. **Awakenings** typed on a one-piece night (kinds.md ✚) are not collected yet: continuity is
   null for those nights by design (sleep.md §5).
6. **Steps vs trips** disagreement is computed but its line is not on Oggi's steps row.
7. **Purchases' prices** feed meal cost but the meal box shows no cost (v1 did: KEEP-12).
Each gap becomes a ledger line when its domain's slice is planned, not before.

### Rules for the visual study (from the matrix)
- An element is judged on **the datum and the level** it shows: the same datum at the same level
  has one form everywhere (one nutrient bar, UI-32; one score chip; one burn range).
- Detail opens **one level at a time**: L0 row → L1 (box opened) → L2 (Andamento) — never two
  levels in one view.
- Nothing is shown unless it serves a **decision or a check**; every element on a board cites its
  row here.

## 1. Atlas: the whole visual heritage, rendered (no judgement yet)
The inventory is the design register's rows (S, C, D, T, N), v1's five themes and its `src/ui`
components, the old canvas's boards; nothing is new here. What step 1 adds is **every element
drawn with the real kit**, on the canvas «lifeos v2 — revisione» (method: memory v2-boards-kit;
data from the developer's export; audits at 0; light, dark and Notte). Boards and what they hold
(decided by the agent, 30 Oct; the matrix row each serves in brackets):

| Board | Elements (register rows) | Sources | Serves |
|---|---|---|---|
| A1 Foundations | tokens and scale S1, colour per meaning S2, faces S3, `F` formats S10, motion S17; the five themes T1 × light/dark (Label, Quaderno, Sport, Minimal, Notte), density T5 | `packages/kit/src/kit.css`, `tokens.css`; v1 `src/design/themes/*.css`, `theme.css` | every row |
| A2 Shapes and drawings | silhouettes S4, planned hatch S5, the drawing in the box S6 and its skyline on open S19, Glyph S9 (food groups, dishes, movements, corner mark, backdrop) | kit.css `.k-shape`, `Glyph.tsx`, icons.md | meal, session, sleep, weigh-in, money |
| A3 Numbers and judgements | Nutrients L0–L2 S11, zones in the bar S12/UI-32, score chip S13 and the skyline (D2), Chart S16; from v1: ConcentricRings, MacroStrip, NovaBar, ChartFrame S20 | `Nutrients.tsx`, `Chart.tsx`, v1 `src/ui` | meal, day, water, sleep, weigh-in |
| A4 Time | the rail 20 → 64 px S7 (CONTRA-02: vertical vs horizontal times), week strip S14 with the day bars D3, DateNav, RangeNav | `DateNav.tsx`, `RangeNav.tsx`, ADR-0050 | every timed row; the week |
| A5 Context | weather card S15 with D4 (B opening to A), sleep night box (sleep.md §6) | `WeatherCard`, Open-Meteo data | weather, sleep |
| A6 Actions and states | Box C1, buttons S8, ValueRow C3, ActionRow C4, List + Find C5, toast C6, page pattern C7, MoreSheet C8, summary page C9, verbs C10, empty/banner/skeleton S18 | kit, interaction.md, content.md | every object page |
| A7 The same screen, v1 and v2 | Oggi, a meal, the gym, a food page: v1's render beside v2's, same data (register V1–V7) | v1 and v2 local, preview account | the «why v1 was understood» rows |

Next session: build A1–A7 (one canvas version), then step 2 (criteria) and step 3 (judgement),
and prepare the big choices together in one round (themes and palette, panel shape CONTRA-01,
the bar and the charts, the score, the week, the weather, silhouettes and backdrops CONTRA-03,
icons) — those are the developer's.
