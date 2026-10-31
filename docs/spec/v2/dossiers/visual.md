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

**Built 30 Oct (canvas «lifeos v2 — revisione», version 13, row «Atlante»):** the board
`Atlante` (A1 colours and faces, A2 shapes and Glyph, A3 numbers and judgements, A4 time, A6
actions and states, each piece the real kit component with its register row; light and dark
rendered, shapes audit 0, no new content findings) and, beside it, the kit's own boards brought from
the old canvas Q2fD1q…: Icons, Shapes, Content, NutrientPanel, Patterns and the 13 components
(Box, Skyline, Nutrients, Field, Chart, PageHeader, DateNav, NavBar, Glyph, ValueRow, ActionRow,
Toast, MoreSheet). A7 already exists there: the board «v1 e v2 a confronto» (Compare, 29 Oct).
**A1 themes (canvas v14, board «Temi»):** the five v1 themes × light/dark over the same kit pieces,
tokens translated by `boards-tools/themes_build.py` (colours and title face). Two findings for step
3: without v1's frame slots (T2: `--panel-*`, `--tile-*`, `--heading-*`) the five themes look
alike on the v2 kit — the ground and the ink change, the boxes do not; v1's radii (10, 14, 18 px)
are off v2's scale (shapes.md), so a theme must choose among the scale's steps.
**A5 weather (canvas v15, board «Meteo»):** the real WeatherCard photographed from v2 (light,
dark, closed, open). **A6 Find (canvas v16):** the Trova board and the Find component brought over.
**A3 v1 pieces** (ConcentricRings, MacroStrip, NovaBar, ChartFrame) wait for v1 running after
1 Nov: v1 reads Neon, whose transfer quota is nearly spent (memory neon-transfer-budget).
Still to draw: A1 density; A3 v1's ConcentricRings,
MacroStrip, NovaBar, ChartFrame; A5 the weather card; A6 List + Find, summary page, empty states.

Then step 2 (criteria) and step 3 (judgement),
and prepare the big choices together in one round (themes and palette, panel shape CONTRA-01,
the bar and the charts, the score, the week, the weather, silhouettes and backdrops CONTRA-03,
icons) — those are the developer's.

**Corrected 30 Oct (ledger UI-74, the developer: «se vedi v2 è diversa… non dovevamo ripensarle?
… uso quello scuro io e basta»):** the starting point is **v2 as the app draws it now**, board «v2
com’è, in scuro» (canvas v18: Oggi, an open box, ⊕, Palestra, Libreria, Andamento, Sonno, Piano, a
new food; photographed in dark at 390 px). The «Atlante» of mid-October components stays as a
memory of the pieces, not as the reference. Everything is drawn and judged in dark first; the
themes (A1, choice 1) wait.

## 2. Criteria, decided before judging (decided by the agent, 30 Oct, from the plan's list)
Each element of the atlas is judged on these, with its proof; a «no» on a measured threshold is a
«rethink», never a matter of taste.

| Criterion | Threshold or test | Source | Measured by |
|---|---|---|---|
| Visibility | text ≥ 4.5:1, large text and non-text marks (bar fills, ticks, focus) ≥ 3:1, on every theme × light/dark | WCAG 2.2 SC 1.4.3, 1.4.11 | the contrast test ported from v1 `theme.test.ts` (T4) |
| Comprehensibility | read without explanation: every number carries its words and unit (content.md); a stranger answers «what does it mean?» in 3 s | NN/g, visual hierarchy and «5-second test»; register V1 | content audit; the 3-second test on the developer's day |
| Usability | targets ≥ 44 × 44 px; steps per daily task counted (interaction.md §8); the action in view | Apple HIG (44 pt), Material 3 (48 dp), WCAG 2.2 SC 2.5.8 (24 px minimum) | `scripts/ui-check.mjs` |
| Priority | decisions first (P4), one hierarchy per page: one primary action, one largest number | P4, P5; NN/g, visual hierarchy | ui-check (one primary per page) |
| Beauty and coherence | one form per role, rhythm from the scale (shapes.md), decoration only when it carries meaning, motion with a purpose and reduced motion respected | Tufte, data-ink ratio; register V3; WCAG 2.2 SC 2.3.3 | shapes audit 0; the register's rows |
| Functional coherence | the form matches the datum and its function (a gesture to make, a state to check, a trend to read, a judgement); the same datum at the same level has one form everywhere; every element cites its §0c row | Few, preattentive attributes (length and position before colour and area); §0c rules | coherence.js; the board's row citations |
| Cost | built from kit components and checked by script; no one-off drawing | P9 | the boards' audits, the app's lint |

## 3. Judgement: keep · rethink · drop (first pass, 30 Oct)
Details are the agent's (marked so); a **choice** is the developer's and goes into the one round of
options (§3.1). Proof = what the atlas boards show against §2.

| Row | Element | Verdict | Proof and reason |
|---|---|---|---|
| S1, S10, S17 | scale, `F` formats, one motion time | keep (agent) | shapes audit 0 on every atlas board; content audit adds nothing |
| S2 | one colour per meaning | keep (agent); contrast per theme still to prove | T4's test not yet ported: visibility unmeasured on Quaderno, Sport, Minimal, Notte |
| S3, S9 | Barlow; Glyph | keep (agent) | A1, A2: icons lead every row (UI rule «icons over words») |
| S4, S6 | silhouettes; the drawing in the box | keep the shapes (agent); **backdrops = choice** (CONTRA-03) | A2: the shape says the domain at a glance (functional coherence) |
| S5 | planned = hatched | keep (agent) | A2 «Pranzo previsto»: readable in light and dark |
| S7 | the time rail | **choice** (CONTRA-02) | your vertical thin coloured column vs v1's horizontal times |
| S8, C3, C4, C6, C8 | buttons, ValueRow, ActionRow, Toast, MoreSheet | keep (agent) | A6: one form per verb (C10), ≥ 44 px |
| S11, S12 | Nutrients L0–L2; zones in the bar | keep (your pick 25 Oct); L2's foods as chips still to finish (agent) | A3: the same bar at L0, L1, L2 (N8) |
| S13, D2 | the score: chip and skyline | **choice** | your «c è la migliore, ma fanno comunque schifo graficamente» |
| S14, D3 | the week strip | **choice** | your «troppo spazio… poco comprensibile… c ma più sottili e in trasparenza, senza la barra orizzontale» |
| S15, D4 | weather card | colours from tokens (agent); **graphics and animation = choice** after research | A5: fixed hex in the temperature band and the air scale |
| S16 | Chart | keep, one frame (agent) | A3: trend with band and goal, bars against a band |
| S18 | empty, toast, skeleton | keep; skeleton to use (agent) | — |
| T1–T3 | the five themes | **choice: themes and palette** | A1 «Temi»: without v1's frame slots (T2) the five themes look alike; radii off the scale |
| CONTRA-01 | section/panel shape | **choice** | shapes.md «no frame, title with rule» vs v1's framed panel vs register V3 |
| icons.md | icon set and style | **choice** (with the themes) | — |
| S20 | v1's rings, MacroStrip, NovaBar, ChartFrame | pending (rendered after 1 Nov) | — |

### 3.1 The one round of choices (to prepare, all together, from real components and your day)
1. Themes and palette — **deferred** (he uses dark only). 2. Panel and section shape
(CONTRA-01). 3. The rail and the times (CONTRA-02). 4. The score (D2). 5. The week (D3). 6. Weather
graphics and animation (D4, after a short research on weather visuals). 7. Silhouettes and
backdrops (CONTRA-03). 8. Icons. Each: 2–3 options side by side and a recommendation.

Progress (superseded the same day by UI-74: these are variants, not a rethink; to redo in dark from v2 as it is): **choice 5 (the week) drafted on the canvas, v17, board «Scelta 5 · La settimana»**: A as
today (one thin line), B your idea whole (eight thin transparent bars a day), C one bar per area
(Cibo, Corpo, Sonno); real days 23–29 Oct computed from the export by
`boards-tools/week_data.py` (line values are per 100 g: value × quantity ÷ 100, as
`core/food/totals.ts`), board written by `week_board.py`. Recommendation: C on Oggi, B's profile
in Andamento. The other seven choices: next.

### 3.2 Weather visuals: what the short research says (30 Oct, for choice 6)
- One style for every condition (sun, rain, fog share stroke, palette and motion); conventional
  pictures, not abstract ones; fog and haze need more than shading to be told apart on a phone
  (icon-set guides; weak sources, convention).
- The air scale is the European Air Quality Index: six categories from «good» to «extremely
  poor», bands revised in 2024 to the WHO 2021 guidelines, the worst pollutant sets the level
  ([EEA FAQ](https://www.eea.europa.eu/en/about/contact-us/faqs/what-do-the-air-quality-index-values-mean),
  [ETC HE 2024/17](https://www.eionet.europa.eu/etcs/etc-he/products/etc-he-products/etc-he-reports/etc-he-report-2024-17-eeas-revision-of-the-european-air-quality-index-bands)).
  Decided by the agent: its colours are the EEA's own table (a standard the person may know from
  maps), as six data tokens with their contrast tested, not the kit's good/warn/bad.
- Still to look at for the options: how established weather apps draw the day's temperature range
  and the hourly curve (the current card already does both).

### 3.3 The round of choices, rethought (30 Oct, plan `procedi-imperative-peach.md`)
Built as a development-only page of the v2 app, `/studio/<scelta>` (`apps/v2/src/app/(app)/studio`,
`features/studio/*`; 404 in production, tested), with the real kit on the developer's real days
(his v2 export of 29 Oct loaded into the local preview account by
`apps/v2/scripts/load-v2-export.ts`), photographed in dark at 390 px and measured (text contrast
≥ 4.5:1 on computed styles, no sideways scroll, no console error). Canvas v19, board «Le scelte,
ripensate». Seven choices, ledger UI-75 … UI-81: the score, the week, the times, the panel,
silhouettes and backdrops, the weather, the icons — each with today's v2, three new ways and a
recommendation. Themes deferred (UI-74). **Waiting for the developer's picks**; the picked ones
move into the kit, the others and the study pages are deleted.

### 3.4 His picks (30 Oct, comments on canvas v19) and round 2
Ledger UI-75 … UI-81, CONTRA-01 … 03. The developer commented each card; then «io vado, continua
senza di me»: the rest below is **decided by the agent** where it says so.

**Decided and built in the kit (commit «the round of 30 Oct in the kit»):**
- **Icons (UI-81)**, his «mi fido del tuo consiglio»: bare in rows, a *filled* tile only where the
  row is a button (a Box row with its link: ⊕, Libreria, Piano). Decided by the agent: four own
  drawings for the meal roles in the line of the silhouettes (UI-20) — colazione cup on its saucer,
  pranzo plate from above with cutlery, cena deep plate with the moon, spuntino biscuit with a bite
  (`meal-*` in icons.json `custom`); Tabler's salad, soup and cookie were already dishes or food
  groups, one drawing one meaning. The resolver now prefers the subcategory over the kind (a lunch
  is a meal, drawn as a lunch). Audit of the set: no other duplicate between domains and kinds;
  intakes logged as meals in v1 (CREATINA, CAFFÈ) still draw the fork — that is data (R6), not icons.
- **Levels of expansion (UI-80)**, a kit pattern (`useLevel`, `packages/kit/src/levels.ts`): levels
  0…n, one tap to the next, after the last back to 0, three dots say the level; the level is kept per
  piece in the browser (decided by the agent: localStorage, no schema; a server preference later if
  he wants it on every device). Weather is the first user: 0 one line, 1 the card, 2 hours, air, sun;
  hex colours replaced by tokens (S15).
- **Panel (UI-78, option 3)**: a page's sections and the day's own panel sit on a surface tinted
  7 % by their area, no frame, no rule, no tick; folds read like sections; 12 px between the day's
  boxes. It applies to every page's sections (`.k-page>.k-section`), not to the boxes inside them.
- **Silhouettes and drawings (UI-79)**: decided by the agent — a silhouette changes corners, rims or
  a corner bite, never the padding or a side, so icon and text line up in every row: the body tag's
  point and eyelet, training's side notches, the cardio arrow, the receipt's zigzag, the bubble's
  tail and the capsule's wide padding are gone; plate rims, cup corners, snack and moon bites stay.
  The icon stands before every title (in the times mode the rail carries it). The drawing behind
  moves to the free bottom-right corner, only in boxes with lines under the head, and turns in once
  on load; open, it grows as before (S6). The page's big drawing stays at the top and scrolls away.

**Round 2, waiting for his pick** (`/studio/voto`, `/studio/settimana`, `/studio/orari`, dev only):
- **Score (UI-75)**: one combination — the skyline without frame, each column in its band's colour
  (2), the number with its word; under the head one line: the action when known (3), else the part
  that cost most (1); open, the skyline the box's width on its 40/70 bands, each column named.
- **Week (UI-76)**: v2's strip without ‹ › and without the «Oggi» button: the strip swipes a week,
  the title opens the month, today keeps a ring, «↩ oggi» is a word in the title's line only when
  away (KEEP-01 functions kept); levels like the weather: days · thin bars · bars and each day's 24
  hours under its column (option 1, smaller: 96 px, guides at 6/12/18, now in red).
- **Times (UI-77)**: the rail stays with its animation; parts of the day are full-width headers from
  the person's meal-role bounds (mattina, mezzogiorno, pomeriggio, sera, notte) that cut the rail;
  «Fine giornata» closes it and the things without a time sit below, aligned, with no rail; ≥ 2 h
  with nothing is a thin dashed grey bar with «+ <the meal missing at that hour>» or «+ aggiungi»
  (the composer with role, time and state); parts not yet begun are not drawn unless something is
  planned in them; an empty passed part says «niente».

**Round 3 (his comments on canvas v22, 30 Oct 17:01–17:04; canvas v25):** score closed accepted, open
redone as one row per criterion with the nutrients' ruler (S12); week in two ways to compare —
A each day one column that grows into its 24 hours, B his 25 Oct idea, thin bars behind each day's
number; times: separators are drawn sky bands (the sun at the part's height on the day's arc, the
moon at night, rising once on load), untimed things full width aligned with the bands; weather line
padding equal to the card; the water row's overflow fixed in Box (UI-84).

**Evening of 30 Oct (his «i cambiamenti mi stanno bene… acqua è troppo grosso… non vedo i dispendi
calorici… sicuro di aver pensato a tutto? il piano che diceva?», UI-85; canvas v29):**
- Water row: actions beside the strip, pills under it (as tall as before); nothing past a box at 390,
  360, 320 px (`scripts/ui-check.mjs` now counts it and takes `--width`).
- The kcal of sessions and steps were on Oggi; the studies drew rows without them. Now one function
  (`features/day/priced.ts`) prices the day for Oggi and the studies. A run logged after the fact in a
  one-minute session read «Allenamento · 1 min · 1 serie» at ≈ 440–620 kcal: the burn was right, the
  row wrong — now «Corsa · 49 min».
- The plans re-read: the air scale is back to the EEA's six colours (§3.2, I had replaced them with
  the kit's); the icon audit promised and not done is done (§ icons.md, a test guards it); the
  › link is a 44 px target (under-44 targets 303 → 81); text kept off the drawing's corner and the
  drawing gone from dense rows; weather levels animate in (UI-28); a skeleton per section (S18);
  S11 was already done (register fixed); Main links the boards.
- Still open: the water is ~470 px down Oggi because «Il giorno» comes first (P4, the screens phase);
  more left edges from the icon before every title (asked); the old score chip off the scale until
  UI-75 is picked; S20 v1 pieces after 1 Nov; step 4 (renewed kit board) and 5 (screens) after his
  picks on score open, week A/B and times.

**Decided by the agent and built (30 Oct, his «le scelte falle tu, combina le funzionalità e i design
migliori»; UI-75/76/77 D):**
- Score — kit `Box`: closed the unframed skyline by band + number + word, one line under the head
  (`score.action` when the app knows it: sleep says the minutes missing to 7 h; else the costliest
  part); open one ruler per criterion.
- Week — kit `DateNav` with `levelKey`: no arrows or «Oggi» button (swipe a week, the title opens
  the month, «↩ oggi», today's ring); levels 0 days · 1 bars behind the number (B) · 2 each day's
  column of 24 hours (A, `features/day/rhythm.ts`); Piano's week the same, without arrows.
- Times — kit `DayPart` / `EmptyTime` in `Timeline` (`parts`, `gap`): sky bands from the meal-role
  bounds, consecutive empty passed parts merged into one band, «Fine giornata» on a past day, gaps
  ≥ 2 h offering the missing meal (composer with role, time, state) or ⊕.
- The `/studio` pages and `features/studio` are deleted.
- Open: on today the water sits lower (≈ 680 px: the bands and the day box's level switch); the
  page order is the screens phase.


## 4. The renewed kit (step 4, 31 Oct; ledger UI-88)
The developer, 31 Oct: «procedi con il piano», then «non ti fermare, io vado»: the kit's approval
and step 5 are **decided by the agent**; the board is there for him to comment.

**How it was looked at.** Every kit piece photographed alone (element crops, dark, it-IT, 390 px,
then 360 and 320) from the real pages on his 29 Oct and, for what no page shows, from the
development-only gallery `/kit` (`apps/v2/src/app/(app)/kit`, 404 in production; example values
declared as such, the weight chart is his). Board «Il kit rinnovato» on the revision canvas (v34),
37 figures, each with its register rows. Tools: `boards-tools/kitshot.mjs`, `sheet.py`,
`kit_board.py` (+ `kit_blobs.json`); `scripts/ui-check.mjs --list`.

**Found and fixed (the photos caught them, tests and page shots had not):**
1. L0 bars said «187,5» with no unit → «188 g», whole grams (the glance level), column 44 px.
2. In a dense row without link the bare icon sat above its title → the icon gets the tile's 32 px box.
3. «per arrivare a 7 h» split «7 / h» → the unit through `F` (non-breaking).
4. The night read «6,6 h» on Oggi and «6 h 30» in its sheet → `F.hm` everywhere.
5. Things without a time drew the button tile (dense rows) → the same card as timed entries (UI-81).
6. Andamento's domains read «62 così così 62» → the chip says the number once.
7. Andamento's days cut to «Giove…» (nothing at 320) → `F.DayShort` «Gio 29», also in Piano.
8. Andamento's links broke inside «Come valutiamo ›» and were 43 px → wrap by whole link, 44 px.
9. At ≤ 360 px the score's skyline pushed titles to nothing → number and word stay, the skyline
   shows when the box opens; a title never shrinks under 4 em; week and month cells 44 px at 360.

**Decided (closed):** S1 scale, S2 colours by meaning with T4's test (text 4.5:1 on paper, sheet and
every 7 % area tint, light and dark; an area's own colour 3:1, it paints only large titles and
icons), S3 type, S8 controls with G8's paddings, S9 icons (UI-81/82), S11–S12 Nutrients, S5
planned, S16 Chart (callers thin the x labels: «""» skips one), S18 states, the score (UI-75), the
week (UI-76), times (UI-77), panel (UI-78), silhouettes (UI-79), weather levels (UI-80).

**Exceptions, argued:** at 320 px seven calendar columns cannot be 44 px wide (288 px usable):
cells stay ≥ 36 × 46, above WCAG 2.5.8's 24 px; filter chips and the water's +250/+500 stay 36 px
(`--touch-dense`, rows of several); the rail is 20 px wide and as tall as its row. Under 44 px:
10 targets at 390 (was 11).

**Still open:** themes and density (T1–T3, T5: he uses dark only, UI-74); S20 v1 pieces after
1 Nov; breakfast and coffee share colour and a similar cup (a drawing to redo with the meal icons);
the native time field follows the phone's locale (not the app's).

## 5. The screens (step 5): order, decided by the agent (31 Oct)
Kit first, then one screen at a time, each photographed piece by piece at 390/360/320:
1. Map D in the kit: area template (title + profile, four tabs Diario · Piano · Elenco · Andamento,
   ⊕ bottom right), NavBar with five places Corpo · Cibo · Oggi · Mente · Soldi, redirects from the
   old addresses (ADR-0059, architecture.md §10).
2. Oggi: the water reachable above «Il giorno» (P4; 635 px down today), «Il giorno» compact first.
3. ⊕ and the meal (G9), Palestra as Corpo · Diario (G10), an object's page (G11), Elenco with Find,
   Piano, Andamento (link row → tabs), Profilo.
4. The 8 pages without a `.k-primary`: ⊕ is their primary on map D; ui-check counts it.
