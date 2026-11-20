# Bars study — one base element for every bar (§71)

His words, 19 Nov: «ripensiamo a tutti i tipi di visualizzatori a barre dei nutrienti, limiti, voti
e tutto quello che potrebbe poi richiederlo? facciamo uno studio per unificare tutto e inserire
tutte le funzionalità e visualizzazioni che vengono richieste in un elemento base comune».
Draft by Claude, 19 Nov; his pick decides. Photos: `LIFEOS/review/2026-11-19/bars-study/`
(`contact.png`, one crop per kind; `inventory.json`, the crawl).

## 1. What exists (every case checked)

How: a crawl of 34 pages at 360 px with every box, door, level, row and condensed line opened
(`crawl.mjs`), plus a code search for every percentage width (`+ "%"`) outside tests. The crawl
did not reach the weather levels, the week's levels, the goals and the data quality: those come
from the code (marked «code»). Counts are instances seen on those pages, not in the whole app.

| # | Kind | Where | Seen | Built by |
|---|---|---|---|---|
| B1 | Macro row: name, amount / target, full bar split by kinds, planned hatched, target tick, zones ruler with amounts, tip by zone, word | «Il giorno» L1, meal open, composer, a voce, a food's page | 143 rows | `Nutrients` (`k-track`, `Fascia`) |
| B2 | A macro's kinds and «da dove»: small bars with name and grams, some judged | inside B1 open | 279 | `Nutrients` (`k-krow`, `k-src`) |
| B3 | kcal bar: ramp through the zones, target tick, zones ruler | «Il giorno» L1, meal, composer | 44 | `Nutrients` |
| B4 | Limits (free sugars, saturated, salt): small judged bars, planned, the week's mean tick | «Il giorno» L1 rest, composer | 9 | `Nutrients` (`k-nlims`) |
| B5 | Micros: today a macro row in the group's colour (he: «era meglio prima») | «Limiti e micro» | — | `Nutrients` |
| B6 | L0: a meal's four thin bars with grams | meal open, Elenco pasto, pasto page | — | `NutrientsL0` |
| B7 | Energy ribbon: a closed meal's / day's line, macro shares of kcal | closed meals, «Il giorno» L0, sessions (muscles) | 38 | `Box` (`k-ribbon`) |
| B8 | Need bar: water drunk vs expected | Acqua | 37 | `WaterRow` via `Box` strip |
| B9 | Skyline chip: columns as wide as weight, as tall as score | every judged head, rows | 115 + 25 | `Box` (`k-sky`, `k-vsky`) |
| B10 | Voto open: one bar of 100 points by criterion, zones, tip, planned | «Voto» door | 16 | `Criteria` |
| B11 | A score's ruler (0–100 with 40 · 70) | «Come valutiamo», kinds judged | 2 | `FasciaBar` |
| B12 | Model skyline, big | «Come valutiamo» | 2 | page code (`come-valutiamo/page.tsx`) |
| B13 | Weight range of a criterion (min–max, his value) | «Come valutiamo» sliders | 36 | `WeightsForm` (feature code) |
| B14 | Timer progress | gym timer | 3 | `Timer` |
| B15 | Week strip: a thin bar per area per day (L1), 24-hour column (L2) | top of Oggi | 2+ | `DateNav` |
| B16 | Weather: the day's temperature range with now, the air scale | weather L1–L2 (code) | — | `WeatherCard` (feature code) |
| B17 | Goals: the week «2 su 4», pace (code) | Obiettivi | — | page code |
| B18 | Data quality «21/30» (code) | Come valutiamo · Qualità | — | page code |

Out of scope: `Chart` (a trend in time, PAT-53) — it shares only colours and zones.

## 2. Every feature any bar uses (the union)

| Feature | Used by today | Rule |
|---|---|---|
| Fill to a value on a scale (room past the target ×1.3) | B1–B8, B14 | VIS-50 |
| Identity colour (macro, group, criterion, area, muscle) | B1, B2, B5–B7, B10, B15 | VIS-50, his 19 Nov |
| Parts stacked in one bar (kinds, foods, criteria by weight) | B1, B6, B7, B10 | VIS-50 |
| Parts side by side as columns (width = weight, height = score) | B9, B12 | VIS-43 |
| Planned: hatched part after the eaten, «→ total» | B1, B3, B4, B10 | VIS-22, FD-34 |
| Not reached: hatched rest | B10 | his C |
| Target tick | B1, B3, B5 | VIS-50 |
| Zones ruler under it, amounts where a zone changes, «da evitare» hatched | B1–B5, B10, B11 | VIS-52, FD-30/31 |
| Tip in its zone's colour | B1, B3–B5, B10 | VIS-52 |
| Ramp through the zones' colours | B3 | his 17 Nov |
| Week mean tick | B4 | FD-33 |
| Highlight one part everywhere (a tapped food) | B1, B2 | VIS-50 L2 |
| Words: name, amount / target (unit once), judged word | B1–B5 | VIS-11 |
| Words on the bar (name left, number right) | — (his idea A for the voto) | — |
| A mark besides colour (● ◐ ○) | B10, judged rows | VIS-20/21 |
| Range of allowed values (min–max) and a point in it | B13, B16 | — |
| Now marker on a range | B16 | VIS-75 |
| Levels: thin (L0) → row (L1) → kinds and sources (L2) | B1/B6, «Il giorno» | VIS-70 |
| Long list condensed (rows for what matters, the rest named on one line) | B5, B10 | PAT-40 |
| Shrink at ≤ 360, never hide | all | VIS-43, memory |

## 3. The base element

One piece, called `Meter` in the code (no UI word: he never reads it), drawn from data. Every bar
above is `Meter` with a set of layers; a new feature is a layer, and every bar that wants it gets
it at once.

- **Data:** `parts` (each: value, identity colour, planned?, a key to highlight), `scale` (a
  maximum, or «auto»: room past the target), `target?`, `zones?` (FD-30 levels and amounts),
  `mean?`, `range?` (min–max for B13/B16), `now?`, `label` (name, amount, target, unit, word).
- **Form:** `bar` (horizontal, parts stacked) or `columns` (parts side by side, width = weight,
  height = value: the skyline).
- **Size:** `hair` (2–4 px, no words: ribbons, skyline in a head, the week), `thin` (6–8 px, words
  on the line above: today's macro row), `label` (16–20 px, the words on the bar: his idea A).
- **Layers, each on or off:** fill (solid · kinds · ramp), planned hatch, not-reached hatch,
  target tick, zones ruler (with or without amounts), tip by zone, mean tick, highlight, mark.
- **Levels:** a `Meter` row may open into its parts as `Meter`s (L1 → L2) and condense its list
  (PAT-40).

How each kind maps:

| Kind | Form · size | Layers |
|---|---|---|
| B1 macro row | bar · thin | kinds, planned, target, zones + amounts, tip, highlight |
| B2 kinds, sources | bar · thin (small) | identity shade, zones where judged |
| B3 kcal | bar · thin | ramp, planned, target, zones + amounts, tip |
| B4 limits | bar · thin (small) | planned, zones + amounts, tip, mean |
| B5 micros | bar · thin or label (his pick) | group shade, target, zones, tip |
| B6 L0 | bar · hair + grams | kinds |
| B7 ribbon | bar · hair | parts as shares |
| B8 water need | bar · thin | target (expected now), zones |
| B9 skyline chip | columns · hair | zones as colour, the 70 line |
| B10 voto | bar · thin, parts by weight | identity, not-reached hatch, zones per part, tip, planned |
| B11 score ruler | bar · thin | zones 40 · 70, tip |
| B12 model skyline | columns · large | as B9 |
| B13 weight range | bar · thin | range, a point |
| B14 timer | bar · hair | fill |
| B15 week | bar · hair per area; columns for 24 h | identity per area |
| B16 weather | bar · thin | range, now, zones (air) |
| B17–B18 | bar · thin | fill, target |

## 4. Options (his pick)

- **(a) One `Meter`, every bar moves to it — recommended.** One piece, one gallery section with
  every kind at 390/360/320, a lint rule that fails a bar drawn anywhere else (PAT-90). Each kind
  moves in its own commit with before/after photos; nothing changes look unless he asks. Cost:
  the largest refactor (Nutrients, Box, Criteria, Fascia, DateNav, two feature files).
- **(b) Two pieces sharing the layers:** `Meter` (bars) and `Columns` (skylines). Simpler each,
  but two places to add a feature, which is what he asked to end.
- **(c) A shared layer library only** (CSS and helpers for ticks, zones, hatch, tip), the pieces
  stay. The least work, the least unity: each piece still decides its own spacing.

## 5. Asked of him

1. The option (a · b · c).
2. Which sizes: `thin` with words above (today), `label` with words on the bar (his idea A), or
   both by place (rows with many items `label`, single values `thin`).
3. For the micros, which «prima» was better: the group-shade rows with the old small ruler (before
   the macro rows), or M1 «sulla barra».

Then: build `Meter` in the gallery with every kind as data, photographs, his look, then move.

## 6. His answers (19 Nov)

«yc»: (a) one `Meter`. Sizes: no words on the bar («la rende troppo grossa»), and words beside or
above cost space («se glie lo togli in lunghezza è sempre brutto, se lo metti sopra dipende da
quanto spazio togli»); he asks for other forms too, not only bars. Proposals V1 (thin words above,
zones as the bar's background), V2 (tiles), V3 (rings) in the gallery `#forme`.

## 7. His words of 20 Nov, what the research says, and the construct

His words (proposal §73): metrics are aggregates feeding summary values that must be shown too
(as in the macros and the voto); a construct for common categories (the micros' groups); single
rings too scattered, single lines too much a list; plan and aggregates must show; ranges imply a
judgement; Andamento will reuse it for denser, more specific aggregates, inferable from the drawing.

What the research says (searched 20 Nov):

- **Bullet graph** (Few's spec): a linear scale, the measure as a bar, a target tick, two to five
  qualitative ranges as the bar's background; the ranges *are* the judgement (state and how far
  into it); one hue in steps, not traffic lights; a compact footprint, better than radial
  gauges.
- **Icicle (partition) chart**: the whole spans the row, its parts split the row under it on the
  same scale, depth top to bottom; rectangular, so precise comparison is easier than a sunburst;
  good for 2–5 levels. The parts visibly add up to their total.
- **Stacked bars alone** read shares badly (each part starts somewhere else); parts should be
  readable on their own and comparable to the whole.
- **Bar-in-bar and IBCS notation**: actual solid, plan outlined, forecast hatched — our VIS-22.
- **Word-sized graphics** (Tufte): data-intense, design-simple, stacked with one fixed scale for
  parallel comparison; the same marks then serve a series in time.
- **MacroFactor**: each micro against floor, target and ceiling at once (our AR · PRI · UL,
  FD-40). **Cronometer** is faulted for 82 bars at once: grouping and drill-down matter.

The construct it points to — a **measure tree**, drawn by one piece:

- A node: its value, its plan, its range (floor · target · ceiling → the zones), its identity
  colour, its children, and whether the children **add up** to it.
- A node is a **bullet**: the zones as its background in steps of one hue, the actual solid, the
  plan outlined after it, the target tick, the mark (● ◐ ○) at its end. The judgement is where it
  ends among the zones — the same everywhere.
- Children that **add up** (kcal → macros → kinds; voto → criteria) are an **icicle tier** under
  their parent, on the parent's scale: each as wide as its share, filled as far as it got, so the
  total is seen as the sum of its parts.
- Children that **do not add up** (a group of micros) are a **strip of equal cells** under their
  parent, each cell its judgement (filled, half, empty, hatched when planned): every item in view
  in one line, the group's summary on the parent bar; a tap opens a cell's own bullet.
- **Levels**: 0 the node alone (a hair line), 1 with its children's tier, 2 with the next tier.
- **Andamento**: the same node over days is a row of cells or a word-sized line on the same zones
  as background; aggregates over a period are the same tree with the period's values.

Next: a prototype on his data — kcal → macros → kinds, the voto → criteria, the micros by group,
and one row of seven days — in the gallery, photographed; his look before `Meter` is built.

Sources: Few, *Bullet Graph Design Specification* (Perceptual Edge); icicle charts
(visualizing.org, D3 `partition`); the EU Data Visualisation Guide on stacked bars; Tufte,
*Beautiful Evidence* and his sparkline notes; IBCS notation via Inforiver's docs; MacroFactor's
help on floor, target and ceiling; reviews of Cronometer's 82 targets.

## 8. Levels per type of information — the content first (draft for his corrections)

His words, 20 Nov: «dovresti rivedere tutto anche applicando diversi gradi di espandibilità. per
ogni tipo di informazione». Content only: what each level shows, never how it looks (the style
comes after, from references he picks). A tap goes to the next level, remembered per piece
(VIS-70). L0 = a glance (closed, one line); L1 = the summary with its parts; L2 = each part's
detail; L3 = in time and why («Perché?», Andamento). Everything that exists today has a place
(PRD-19 «tutto a un tocco»); nothing new is invented.

| Type | L0 | L1 | L2 | L3 |
|---|---|---|---|---|
| Energia (the day's kcal) | eaten + planned against the target, judged | + where it came from: the four macros as kcal | + each macro's kinds; the foods that gave most | the week's days; dispendio ± and the goal's pace; «Perché?» of the target |
| A macro (P · C · G · F) | grams / target, judged | + its kinds (quality, sources) | + the foods per kind; the range's amounts | its days; FD-31 edges with sources |
| Limits (free sugars · saturated · salt) | three marks, judged on the 7-day mean | each: day and mean against the ceiling | the foods that gave most | its days; the ceiling's source (FD-33) |
| Micros | «n su m a posto», judged | the groups (vitamins · minerals · other), each «n su m» | each micro against AR · PRI · UL (floor · target · ceiling) | its days; the source per edge (FD-40) |
| A voto (meal · water · sleep · session · day · weigh-in) | number + word | its criteria, what each got of its weight | each criterion's own measure; what does not count and why | its votes over time; «Come valutiamo» |
| Acqua | litres / need now, judged | + the drinks of the day; after training | the need's parts (base, training, heat) | its days |
| Integratori (creatina, caffeina) | taken today; stock % | dose vs plan; stock days left | the doses' times | its days; FD-62 for caffeine at bedtime |
| Sonno | hours / need, judged | + regularity, continuity, how he felt | the night's pieces and times awake | its nights |
| Peso | trend kg, pace vs goal | the weigh-ins of the period | water vs fat (the line without water), uncertainty | the chart with the goal |
| Passi | steps, kcal | the day's parts | — | its days |
| Sessione (gym) | minutes, voto | the exercises, sets, volume per muscle | each set (load, reps, RIR, rest) | each exercise's records and trend (TR-21/23) |
| Costo | € of the day, «n senza prezzo» | per meal | per food and brand | the month (Soldi) |
| Obiettivi | on pace or not | each goal's pace and «da qui: …» | its weekly bar «2 su 4» | its history |

Open questions for him, on this table:
1. Rows to add or drop; anything misplaced (a part that should be one level up or down).
2. Whether L3 opens in place or goes to Andamento.

## 9. The encoding grammar — what decides what (draft, his 20 Nov)

His rules: fewer levels, the highest density, yet simple and beautiful; and written trade-offs,
since we will come back here often. Sources: Bertin's visual variables (*Semiology of Graphics*),
Cleveland & McGill's ranking of how precisely a channel is read, Few's bullet graph, Tufte's
data-ink.

**The channels** (what can carry information), most precise first for amounts:

| Channel | Reads well | Used here for |
|---|---|---|
| Position on a common scale | amounts, comparison | the value against target and zones |
| Length | amounts | the fill |
| Angle, slope | change | trends (Andamento) only |
| Area, size | rough amounts, importance | the level: bigger = the summary |
| Colour lightness (value) | order, intensity | a part's rank inside its family (kinds) |
| Colour hue | identity, categories | what it is (protein, vitamins, a criterion) |
| Shape | categories | the judgement mark ● ◐ ○; the type's silhouette |
| Texture, pattern | categories, state | planned (hatch), not reached, «da evitare» |
| Outline vs fill | state | planned vs done (VIS-22) |
| Orientation | categories | — (kept free) |
| Transparency, blur | uncertainty | estimates, «non so», low coverage |
| Arrangement: enclosure, nesting, alignment | hierarchy, grouping | parts under their total; a group in one box |
| Order | rank | the costliest first, worst first |
| Motion | change of state | opening a level only (VIS-90) |
| Text: number, word | exact value, meaning | one number and one word per measure |

**One channel per idea, everywhere** (as one word per idea):

- What it is → hue (never used for judgement).
- How much → length/position on a scale shared within the page.
- How it is judged → where it ends among the zones + the mark shape (colour of the mark only
  doubles it).
- Planned → texture (hatch) and outline; done → solid.
- Uncertain → transparency, and «≈».
- Part of a whole → placed under/inside its whole on the same scale.
- Rank → order.

**The trade-offs, decided by rules:**

1. **Two levels at most** for a measure: L0 (closed) and L1 (open). A third only for a list that
   grows (foods, sets), and then it is the condensed line (PAT-40), not a level.
2. **L0 carries the judgement and the number**, always; the parts only if they fit in one line
   at 360 px.
3. **L1 carries everything else**, at the highest density that keeps one value per row readable
   at 360 px; nothing hides behind a third tap.
4. **A channel always before text, never losing information** (his 20 Nov: «è sempre preferibile
   usare quelle dimensioni che il testo, senza perdere informatività»): a property gets words only
   when no channel can carry it; what a channel carries is never also written, unless it is the
   one exact number. Every value stays reachable exactly (its label for screen readers, its
   «Perché?»).
5. **Size follows the level**, not the importance of the moment.
6. **A rule is measured** (the layout guard): gaps, the 360 px fit, one number per measure.
7. **A number gets its scale from a channel, not from more text** (his 20 Nov: «l'informazione
   massima è data dai numeri… vanno affiancati da altri dimensioni, più facilmente da altri numeri
   o unità di misura. noi però non vogliamo troppo testo»): the one number stands beside a bar
   whose length, target tick and zones say «of how much» and «how good»; the target as a number,
   the edges' amounts and the source come on demand (open level, «Perché?»). A unit is written
   once per group (its header) when every value shares it, never after each value. A channel
   chosen for a property is the one that shows its scale best: position or length for amounts,
   a mark for a state, order for rank.

## 10. Style samples, round 2 (20 Nov, Claude; rejected, proposal §80)

Pieno · calmo · denso were one structure (bullet + tier) in three skins, and all three were
rejected; so round 2 changes the **main channel**, not the skin. Same blocks for all three: the
day's energy by macro, a day still going (eaten + planned, an example, PRD-22), vitamins, minerals,
a meal's voto by criterion. Kit `MeasureForm`, gallery `/kit#stili`, photos
`LIFEOS/review/2026-11-20/stili2/` (390 · 360 · 320, no overflow).

| Form | A block is | Total | Parts | Target | Judgement |
|---|---|---|---|---|---|
| **colonne** | one small column chart | a stacked column (done, then planned hatched); a group judged item by item: a stack of their marks | a column each, on its own zones (one hue in steps) | one line across, at the same height for all | where the column ends + the mark on its top |
| **quadretti** | the same, counted in steps of 20 % | stacked squares, coloured by part | 10 squares each (5 for points) | a line between two squares | the mark above the column |
| **rosa** | one polar shape | a ring in the middle, full circle = target, a second thin lap past it | a wedge each, its radius the amount | a circle | where the wedge ends + a mark there |

Kept in all three: hue = what it is; length on a scale = how much; hatch = planned; one number per
block in its header, the unit once (rule 7); the exact values in the label for screen readers
(rule 4). Decided by Claude (cheap to change): a part with no target of its own is drawn against
the middle of its «good» zone; amounts run to twice the target; minerals named by their symbol
(Ca, Na, Fe…) so a column's name fits; a block with more than five parts takes the full width.
Asked of him: which form, or which piece of each (for example the columns' total with the rosa's
ring), before `Meter` is built.

Next: the same block (the day's energy, its macros, the micros, a voto) rendered in a few
styles in the gallery, photographed, for him to pick by eye.

## 11. Many dimensions, the way databases show them (draft, his 20 Nov, proposal §80)

What he remembered is OLAP (the «data cube» of business intelligence). A **measure** (kcal, grams,
mg, points, litres) is looked at along **dimensions**, each a **hierarchy** of levels. One view
shows few dimensions at once; the others are fixed or summed. The operations move between views:

| Operation | What it does | In lifeos |
|---|---|---|
| Drill-down | one level more detail on a dimension | Energia → Proteine → qualità alta → the foods that gave it |
| Roll-up (drill-up) | one level less, summing | foods → kinds → macro → the day's kcal; day → week → month (Andamento) |
| Slice | fix one member of a dimension | only Cena; only what was planned; only 9 Nov |
| Dice | keep a subset on several dimensions | the macros of pranzo and cena, this week |
| Pivot | swap which dimension is on the axis | the day's kcal by macro ↔ the same kcal by meal ↔ by part of the day |
| Drill-through | down to the raw rows | the voci (each meal, each food line) behind a number |

The dimensions we have: **nutrient** (Energia → macro → kind; micros → group → micro), **time**
(day → part of day → voce; day → week → month), **source** (voce → food → brand), **state**
(planned · done). The target and the ranges are not a dimension: they are the **reference** each
value is read against.

What it changes in §9 (Claude's reading of his words, for his OK):

- Rule 1 changes: as many levels as the dimension's hierarchy has; each tap is a drill-down, a
  path at the top («Energia › Proteine») rolls back up (Shneiderman's mantra: overview first, zoom
  and filter, details on demand).
- New rule 8, **comprehensibility first**: each view is a chart form everyone already reads (a bar
  chart, a line), one dimension on its axis; the scale is written on the axis (0, the target, the
  ranges' edges with their amounts); the ranges named on the drawing, not only coloured; the unit
  on the axis. Rule 4 (channels before text) never removes the scale.
- Each view can be pivoted (by macro · by meal · by part of the day) and sliced (planned · done),
  instead of drawing every dimension at once.

## 12. The best of the real tools, combined (20 Nov, proposal §82)

Pictures: `LIFEOS/review/2026-11-20/tool-reali/`. What each tool does best, and what we take:

| Tool | Best at | We take |
|---|---|---|
| Few's bullet graph | one value against its target and ranges, a numbered scale under it | the bar on its ranges, the target tick, **the scale written** (0 · 1.000 · 2.000 · 3.000 kcal) |
| MacroFactor | levels by tap: a card per nutrient → today · week · month → the days; floor · target · ceiling as numbers; «All contributors» | the card at level 0; **the edges written as numbers** on open; the foods with grams and % (drill-through) |
| Power BI | every level an ordinary bar chart with an axis and the value on each bar; tap a bar to go down, back to go up | **one known form at every level**; a path «Energia › Proteine» to go back up |
| OLAP | slice, dice, pivot | **pivot**: the same kcal by macro · by meal · by part of the day; slice: fatto · previsto |

The rules this adds to §9 (rule 8, comprehensibility first):

1. Every bar has a written scale in its unit; the unit is on the axis, never after each value.
2. The ranges are drawn behind the bar **and named** («pessimo · ok · ottimo»), with the amounts at
   their edges.
3. The target is a tick with its number.
4. Each level is a bar chart; a tap on a bar goes one level down; a path at the top goes back.
5. A pivot changes which dimension is on the chart; the chart stays the same (flat). Its motion
   may turn like a cube face (his «rotazione», §81).

The Energia path on his 9 Nov (the numbers of his day as the app shows them):

| Level | Shows | Scale |
|---|---|---|
| 0 | Energia: 3.478 kcal against 2.105, its ranges | 0 – 3.500 kcal |
| 1 | the four macros, each against its own target and ranges | grams, one scale per macro |
| 2 | Proteine: its kinds (alta 96,2 · media 51,9 · bassa 13,3 · senza stima 19,1 g) and where it came from (latte scremato 82 g, fiocchi d'avena 20,3, …) | grams |
| pivot | the 3.478 kcal by meal (202 · 774 · 445 · 1.677 · 380) or by part of the day | kcal |

Three proposals, all on these numbers, all following rules 1–5 (gallery `#drill`):

- **A · Schede** (MacroFactor + Few): each level a stack of cards, each card one bullet with its
  scale and its range names; open = the edges as numbers and the contributors.
- **B · Grafico a livelli** (Power BI + Few): each level one bar chart with one shared axis, the
  ranges behind each bar in grey steps, named once in a legend; the path on top.
- **C · Gira il cubo** (B + pivot): B's level 0 with a switch «per macro · per pasto · per
  momento», the chart turning like a cube face between them.

Built 20 Nov (kit `Drill.tsx`: `DrillCard`, `DrillChart`, `DrillPath`, `DrillLegend`,
`DrillFace`; photos `LIFEOS/review/2026-11-20/drill/`). Decided by Claude, cheap to change: when
two edge numbers would touch, the axis keeps the target's; B's level 0 puts every row on «% of its
target» so one axis serves kcal and grams (the grams are written beside the bar). Round 2
(`MeasureForms`) removed. Note: the gallery's fat edges (35 · 82 · 100 g) come from the older sample
and call 97,5 g «ok», while the app said «pessimo» on 14 Nov; the domain rule decides, not this
drawing.
Rejected 20 Nov (proposal §83); `Drill.tsx` removed.

## 13. Shapes: a polygon and a solid (20 Nov, proposal §83)

His rules this round: nothing written that a channel shows; never text · bar · text on a line;
small controls; something more interesting than bars. Two pieces, on his 9 Nov, no words:

- **Polygon** (`Radar`): Energia and the four macros as five axes, each as a share of its own
  target. The dashed regular pentagon is the target; the white shape is his day; the green band
  is where each «ottimo» range lies; a dot in each macro's colour at its vertex; the macro icon at
  each axis end. Rings at 50 · 150 · 200 % give the scale. The day reads as a shape: on 9 Nov it
  is a big pentagon, past the target on every axis.
- **Solid** (`Solid`): his five meals × the four macros as columns, each as tall as its kcal (the
  grams of each meal box × 4 · 4 · 9 · 2). A drag turns it; three dots snap to front (by meal),
  side (by macro), above (the top of each column shaded by its height, a heat map). Turning it is
  the pivot of §11.

Honest limits (Cleveland & McGill, §9): in the front and side views the tallest column hides the
ones behind it, and perspective makes heights hard to compare; the solid is for seeing the shape
of a day, not for reading a number. Decided by Claude: the polygon shows only the green band
(green and yellow together turned muddy); the radius is linear in the share, capped at 200 %.

## 14. Families of representations: each a purpose and a moment (20 Nov, proposal §84)

His words: the polygon suits the central thing, not many things; families of representations have
different purposes and moments. A draft of the families (one per purpose; each used only in its
moment), for his corrections:

| Family | Purpose | Moment | Today / proposed |
|---|---|---|---|
| **Overview** (the polygon) | the shape of many measures at once, each against its target | once per screen, at the top: «Il giorno», a period in Andamento | `Radar`, proposed |
| **One measure** (the original bar with its zones ruler, VIS-50/52) | how much, of how much, how good | a row inside a Box, level 1 | `Nutrients` rows, his favourite |
| **Parts of a whole** (stacked kinds) | what a total is made of | opening one measure | the macro's kinds, the voto's criteria |
| **Many of a kind** (cells) | a group of items each judged (micros) | level 1, condensed (PAT-40) | `Condensed` |
| **Over time** (columns or a line on the zones) | change, trend | Andamento, level 3 | `Chart` |
| **A verdict** (the skyline chip) | one voto, at a glance | a closed Box | `Judge` (VIS-43) |

The polygon (`Radar`), reworked on his 20 Nov words: full width; eight axes (Energia, the four
macros, the three limits); the ranges blend behind each axis from colour to colour, no words; the
scale written once (50 · 100 · 150 · 200 % of each target); each axis end its icon and one number;
a plan as a dashed outline. The solid (`Solid`) removed («tridimensionale per ora no»).
Rejected 20 Nov («il poligono è orribile», proposal §85); `Radar` removed.

## 15. The bar takes the shape of its ranges: the ridge (20 Nov, proposal §87)

His words: nothing special in the real apps, «tu puoi fare di meglio». Claude's own idea, on the
bar he likes (VIS-50/52): the bar is no longer a flat rectangle but a **hill shaped by its
ranges**: tallest where the value is best («ottimo»), half where «ok», thin where «pessimo»,
smoothed so the slopes are gradual (his «più graduali e sfumati»), its colour blending along it.
His amount fills the hill from the left in its identity colour (split by its kinds, as protein's
qualità); a plan is hatched after it.

What each channel carries, once (§9 rule 4): **shape** = the ranges and the target (the peak; no
tick, no words); **length** = his amount; **hue** = what it is; **position of the end on the
slope** = the judgement; **numbers** = his amount (one, top left, in the hill's empty low corner)
and the scale (the range edges under the hill, the unit once). Limits («less is better») are hills
that start high and slope down; «at least» ones rise and stay up.

Stacked, the hills form a **ridgeline**: every scale runs to twice its target, so every peak sits
on one dashed vertical line; how far each fill passes that line is the day at a glance. The same
piece can be one measure in a Box (one hill) or the day (all of them): one family for both.

Decided by Claude, cheap to change: heights per level (ottimo 1, ok ½, pessimo ⅙, da evitare
≈ 0); the scale ends at 2 × the target (a value past it shows an arrow at the right end).

## 16. One visual system: the ingredients, their channels, the context (20 Nov, proposal §88)

His questions: what does this change cover (history, prediction, statistics, what else); recap
every ingredient; for each, the channel that shows it best — «performance» meaning above all that
the scale and the ranges are understood; and the context a value is shown in. Draft for his
corrections; no drawing before his word.

### 16.1 What the change covers
Every place a number is drawn: **the day** (Oggi: a voce, «Il giorno», the timeline), **a session
live** (the gym: each exercise against its past, the session's voto as it fills), **an object**
(a food, an exercise, a ciclo: its own values and its use), **Andamento** (aggregates over time,
by period, by area), and **prediction** (the day still going, the session's end, a goal's ETA,
the weight's trend). Plus what he asked «cosa altro?»: **comparison** (this vs last time, this
period vs the last), **statistics** (mean, spread, best, streak, coverage), and later
**correlations** (MOD-55, after 3 months).

### 16.2 The ingredients (the data cube, §11)
- **Measures** (what is counted): amounts (kcal, g, mg, kg, min, ml, steps, €), work (load ×
  reps, e1RM, TR-21), a voto (0–100, MOD-43), a rate (kg/week, sets/week), a share (% of a whole).
- **References** (what a measure is read against): the **target**; the **fascia** — minimo ·
  buono · massimo (MOD-41), our ranges; the **goal** (at least · at most · range · by a date,
  MOD-42); **his past self** in the same context (MOD-50, TR-20: same exercise, position, load;
  same meal at the same hour); the **window's mean** (the 7-day mean of the limits, FD-33); the
  **record** (TR-23).
- **Dimensions** (what we slice and drill by): **what** (type → object → part → kind: Energia →
  macro → kind → food; session → exercise → set; voto → criterion); **when** (now → part of the
  day → day → week → month; in a session: set → exercise → session); **where from** (voce → food
  → brand); **state** (previsto · fatto · saltato, VIS-22); **context** (pre/post workout, the night
  before: MOD-60).
- **Derived**: **progress** (vs his past self), **trend** (the slope over weeks, TR-24),
  **prediction** (eaten + planned «→», FD-34; the session's expected end; ETA of a goal),
  **uncertainty** (±, «stima», coverage below threshold = «non so», MOD-41), **statistics**
  (mean, spread, best, streak), **judgement** (where it ends among the fascia; the voto).
- **Operations** (OLAP adapted, §11): **drill** down a «what» or «when» by a tap; **roll up**
  in time (day → week → month); **slice** by state or context (only planned, only pre-workout);
  **pivot** the same total by another dimension (by macro ↔ by meal ↔ by part of the day);
  **compare** two members (this session vs the last; this week vs the last).

### 16.3 The best channel for each (Bertin; Cleveland & McGill; his rules 4 and 7)
One channel per idea, everywhere; a number only for the one exact value; the scale always
readable.

| Ingredient | Channel | How its scale is understood | Never |
|---|---|---|---|
| amount | **length** from a common zero | the reference drawn on the same scale | angle, area |
| target | the **peak** of the shape (§15) or a tick | it *is* the scale's landmark | a written «obiettivo» |
| fascia (ranges) | the **shape** (height) + **colour blending** along the scale | the edges' numbers under it, once | range words beside the colour |
| judgement | **where it ends** among the ranges | — (read off the shape) | a word that repeats the colour |
| identity (which nutrient, which criterion) | **hue** | the icon once | hue for judgement |
| parts of a whole | the length **split** in shades of the hue | the parts add up to the whole | separate rows for parts |
| planned · predicted | **hatch** after the done part; a prediction as a **dashed** continuation that widens with its uncertainty | on the same scale | a separate bar |
| uncertainty | **transparency** or a **band's width** | the band is the ± | hiding the value |
| his past self (progress) | a **ghost mark** of last time on the same scale; the gap's **direction** | the same scale as now | a % (TR-22, MOD-50) |
| record | a **notch** at the best ever | on the same scale | — |
| trend over time | **slope** of a line over the ranges as a background band | the band is the fascia | 3D, angle-only gauges |
| count (sets, voci) | **discrete units** (dots, cells) | they can be counted | a number when ≤ 7 |
| time of day | **vertical position** on the rail (VIS-60) | the hours on the rail | — |
| rank, priority | **order** | top first | — |
| level of detail | **size** (L0 small → L1 larger) | — | size for importance |

### 16.4 The context: what a value shows first depends on where it is shown (his 10:22)
Every value has two frames: its **own** (constant: a meal's macros, a food per 100 g, an
exercise's record) and the frame of **where it is shown** (dynamic: what it does to today, to
this session, to this period). **The place picks the frame shown first; the other is one tap
away; and the dynamic one is drawn on top of the constant one**, so he sees how today changes it:

| Where | First (dynamic) | On request (constant) | Drawn as |
|---|---|---|---|
| the day's timeline (a meal) | its share of the day: the slice it adds to each of the day's hills, the day's judgement after it | the meal's own values and its own voto | the meal's part lit inside the day's shape |
| the gym, live (an exercise) | this set against last time and the record; the session's voto filling set by set; the expected end | the exercise's facts and its long trend | the ghost of last time on the same scale; the session's voto as a growing fill |
| an object's page (a food, an exercise) | its own values | how it is used in his days («usato in»), its share of his weeks | own first, use under it |
| Andamento (a period) | the aggregate against the goal, its trend and prediction | each day, each voce (drill) | the period's shape over the days' band |

This is one rule for every type (PRD-03): the registry says, for each type, its constant values
and the frames it can be put in (day, session, period); a page says which frame it is.

### 16.5 For his corrections
1. Anything missing or wrong in 16.1–16.2 (his «cosa altro?»).
2. The channel table: any row he would draw another way.
3. The context rule (16.4): the frame per place.
Then: one family at a time, drawn in the real app on his data (the ridge, §15, is the proposal for
«amount against its ranges»).

### 16.6 Built first (20 Nov, his «yc, then draw», proposal §89)
Oggi on his 9 Nov, in the real app (branch `visual-system`), photos
`LIFEOS/review/2026-11-20/crinale-oggi/`: **«Il giorno» open** shows the ridge (energy, macros,
limits) above his original bars, unchanged (VIS-50/52 kept); **a meal open** on the timeline shows
the day's ridge with this meal's share first in its colour and the rest of the day grey after it
(the context rule, §16.4); the meal's own four bars stay behind its «Nutrienti» door. Kit
`ridgeOf(day, meal?)`; the day reaches the boxes through `DayFrame` (features/day). Decided by
Claude: a share a meal does not carry (its limits) is drawn all grey, never as the meal's.
Rejected 20 Nov («comunque non mi piace», proposal §90): the ridge removed from Oggi, the gallery
and the kit. Kept from it: a meal carries its limits (free sugars, saturated fat, salt) against
the day's targets (`mealL0`), shown in its «Nutrienti» door.

## 17. The abstraction: a measure, in a frame, at a level (20 Nov, proposal §92)

His words: «io ti avevo chiesto di astrarre». One model; every number drawn in the app is an
instance of it; no page and no type draws its own chart (PRD-03, MOD-01). Draft for his OK; no UI
before it.

### 17.1 The model
**What is drawn = a measure × a frame × a level.**

- **Measure** — declared once in the registry (MOD-40): its **value**, its **unit**, its
  **reading** (one of four: an *amount* against references; a *score* 0–100, MOD-43; a *count*;
  a *time*), and:
  - its **references**: target, fascia → levels (MOD-41), goal (MOD-42), **past self** in the same
    context (MOD-50), the window's mean, the record;
  - its **composition**: *parts* that add up to it (a macro's kinds, a voto's criteria, a day's
    meals, a session's sets) or *members* judged one by one (a group of micros);
  - its **state**: done · planned · skipped (VIS-22), and its **certainty** (estimate, coverage →
    «non so», MOD-41).
- **Frame** — the whole it is measured against, chosen by the **page**, never by the type:
  **own** (the object alone: a food per 100 g, a meal by itself), **day**, **session**,
  **period** (a week, a month). The frame gives the **scale** (the frame's target), the **lit
  share** (this item's part of the frame's total), and **which past self** it is compared with.
- **Level** — how much is shown: **0** a glance (one line), **1** open (references written, the
  composition with its legend), **2** a list that grows (foods, sets), condensed (PAT-40).

**The one rule:** `view = family(reading, frame) at level`. Families (§14): an *amount* → a bar on
the frame's scale; a *score* → the skyline chip (VIS-43); *parts* → the bar split, only from level
1 and with its legend; *members* → cells, condensed; *over a period* → the trend chart; *past self*
→ a ghost mark on the same bar. A page only says its frame; a type only declares its measures.

### 17.2 Checked on four types
| Type | Measures (reading) | Frame: own | Frame: day / session | Frame: period |
|---|---|---|---|---|
| **Food** (a meal) | kcal, macros, limits (amount); micros (members); voto (score) | the meal by itself (object page, «Nutrienti» door) | its share of the day: the day's scale, its part lit | the mean against the target, the trend |
| **Gym** (a set → exercise → session) | load × reps, e1RM (amount); sets (count); session voto (score); duration (time) | the exercise's facts and record | **session**: each set against its past self (ghost) and the record; the session voto filling set by set | the exercise's trend (TR-24); sets per muscle per week vs 10–20 (TR-25) |
| **Sleep** (a night) | hours vs need (amount); regularity (amount); voto (score) | the night by itself | its share of the day's 24 h on the rail | the week's mean and regularity, the trend |
| **Water** (a drink → the day) | ml (amount) against the need now | the drink | the day's water, this drink lit | the mean per day |

Nothing in the table needs code of its own: each cell is the rule applied.

### 17.3 What the model decides (answers to his questions)
- **The split bars in a meal** (his «perché sono frazionate?»): they are the macro's kinds (parts).
  The model shows parts **only from level 1, with their legend**; at level 0 a bar is one colour.
- **Context** (§16.4) is the frame: the timeline's frame is the day, the gym's is the session,
  Andamento's is the period, an object's page is own.
- **The same measure looks the same everywhere** (same bar, same colours, same references); only
  the frame's scale and the lit share change.

### 17.4 Not yet decided (his)
The foundations he named (spacing, sizes, cards, padding, colour lightness and saturation) are the
next step after this model: measured on the app, one scale each.

## 18. The visualization engine (20 Nov, proposal §93)

His words: «è un motore di visualizzazione di dati»; every class of thing, not four examples;
«cosa altro?» first; everything added later passes through it. §17's measure × frame × level is
the engine's core; this section gives it its inputs, its rules and its guard. Draft: the classes,
the hierarchy and the patterns are his to set (§18.6) before anything is built.

### 18.1 Cosa altro? — every class of thing, from the registry (20 voce types + his trackers)
Grouped by **what a thing is**, not by type; each class covers today's types and the future ones.

| Class | What it is | Today | Tomorrow (examples) |
|---|---|---|---|
| **Assunzione** (intake) | something taken in, with an amount | meal, intake (coffee, creatine), water, batch | alcohol, a medicine, any supplement |
| **Attività** (activity) | something done over a span, with effort or output | session (and its exercises), trip (walk, run, bike), steps, activity (by category), reading, chore | sport, work, study, meditation, any movement |
| **Stato** (state) | a span he is *in* | sleep, nap | fasting, illness, travel |
| **Misura** (measurement) | a reading at an instant | weigh-in, body measurements, check-in (how he feels) | heart rate, blood pressure, glucose, temperature |
| **Scambio** (exchange) | money or stock moving | money movement, purchase, stock count | budget, subscriptions |
| **Nota** (note) | words | journal | voice notes |
| **Contesto** (context, not his) | the world around | weather | daylight, a calendar event |
| **Tracker** (his own) | any of the above, made by him | «Nuovo tracker» (a family, instant or span, ≤ 6 fields) | anything |

Plus what is **made from** these: the day, the session, the week, a period (aggregates); a goal
(MOD-42); a voto (MOD-43); the plan (previsto).

### 18.2 What the engine reads (inputs)
1. **Data**, from the registry (MOD-01), the same for built-ins and his trackers: the class, the
   shape (instant · span), the fields. Each field type has a **reading** the engine knows how to
   draw, so a new tracker is drawn with no new code:
   | Field type | Reading | Aggregates over a frame |
   |---|---|---|
   | number, integer (with a unit) | amount | sum · mean · last · max |
   | duration · a span's length | time | sum · mean |
   | scale (1–5) | rating | mean · distribution |
   | boolean | done / not done | count · streak · share of days |
   | choice | category | count per category · share |
   | text | presence | count |
   | lines (a meal's foods, a session's exercises) | composition | the parts of a total |
   | a computed voto | score 0–100 | mean · worst · trend |
2. **References**: target, fascia (MOD-41), goal (MOD-42), past self in the same context (MOD-50),
   the window's mean, the record — each optional; the engine draws only what exists (PRD-22).
3. **The request** from the page: the **frame** (own · day · session · period), the
   **dimension** to group by (what · when · where from · state · context — OLAP, §11), the
   **level** (0 · 1 · 2), and an **operation** (drill · roll up · slice · pivot · compare).

### 18.3 The rules (the grammar)
- The **family** follows the reading and the frame (§17.1): amount → bar on the frame's scale;
  time/span → a stretch on the time rail; rating → a mark on its scale; done/not done → cells
  (a streak); category → a split bar of shares; score → the skyline chip; composition → the
  total split, from level 1, with its legend; over a period → the trend chart; past self → a ghost
  mark.
- The **channels** (§16.3): one channel per idea; colour for identity, never for judgement twice.
- **Comprehensibility** (rule 8): the scale, the target and the range edges readable on the
  drawing; nothing written that a channel already shows; no text · bar · text on one line.
- **Foundations**: every view uses the kit's tokens for spacing, size, padding and colour
  (lightness and saturation measured, §17.4).
- **Honesty**: estimates marked, «non so» below coverage (MOD-41), assumed values never judged
  (MOD-12).

### 18.4 What it gives (output)
A **view description**, not a drawing: which kit piece, its data, its scale and references, its
level. Only kit pieces draw (PRD-18, PAT-53). The page puts the view where it belongs.

### 18.5 The guard: everything added passes through it
Once §18.6 is settled: (a) a registry test fails a type or tracker that does not declare its
class and its measures (reading, aggregate, references); (b) the lint of PAT-90 fails a page that
draws a number outside the engine; (c) a new kit piece is a new family of the engine, never a
one-page drawing. Until then, Claude adds nothing visual that bypasses this design.

### 18.6 His to set (patterns, hierarchies)
1. **The classes** of 18.1: right, missing, merged? (Sleep as a *state*; how he feels as a
   *measurement*.)
2. **The hierarchy**: class › type › object › part (e.g. Attività › session › exercise › set;
   Assunzione › meal › food › kind). The same depth everywhere?
3. **The frames**: own · day · session · period — is «session» the general «span of an activity»?
4. **The families**: one per reading (18.3) — any reading he wants drawn otherwise.
5. **The name**: «motore di visualizzazione» in product.md §3, or another word.


## 19. Forms beyond the bar, yes/no, words in the bar, no dots (20 Nov, proposal §96)

His words: «non mi piacciono per nulla i pallini · molte scritte potrebbero essere nelle barre
stesse · alcuni tracker potrebbero essere dei binari … la creatina … la caffeina è diverso ·
obiettivi con semplici "completato" e "non completato" · uno studio su altre forme di grafici».
What slice 2 did wrong: it reused MeasureTree as it was and did not apply §16.3 (the end dot and
the dot under each column repeat what the tip's colour already says). Draft for his corrections.

### 19.1 Yes / no (a reading for any class, not only a boolean field)
What only has two states carries one fact: **done or not**. It comes from the **measure**, not from
the field's type (MOD-57 today reads only a boolean field as «done»):
| What | Why yes/no | Not yes/no |
|---|---|---|
| a fixed dose (creatina 5 g, a medicine, a vitamin) | the amount never changes: only «presa / non presa» informs | caffeina: mg vary, a limit (≤ 400 mg) → an amount |
| a habit, a task, a check-in done | done today or not | — |
| a goal «fatto / non fatto» (yes, it exists: «2 su 4» in Obiettivi) | each day done or not; over a week a count against n | a goal on an amount (kg, g) |
| a boolean field of his trackers («farmaco: sì») | — | — |
Proposed rule: the registry may declare a measure's reading; the field type gives the default; an
intake whose dose is fixed reads as *done* (undo: the default only). Drawn: **day** → the voce's own
shape, previsto · fatto · saltato (VIS-22), no bar; **week** → seven cells, filled · outlined ·
struck, the streak as their count; **month** → a calendar grid of the same cells; **goal** → n cells,
the done ones filled («2 su 4» without the words).

### 19.2 The forms, by the question they answer (Cleveland & McGill: position and length are read
best, angle and area worst; Few, Tufte, Bertin, Munzner)
| Reading · question | Today | Other forms | Best when | Avoid |
|---|---|---|---|---|
| amount · how much of the target | bullet bar | **unit chart** (a square per unit: 8 glasses of 250 ml); **sparkline** in the row | the unit is countable (water, sets ≤ 20) | a gauge or ring (angle) |
| amount · over days | columns | **line on the fascia band**; **horizon chart** (many measures in little height); **calendar heat map** (a month, each day tinted by its zone) | a month or more; many measures at once | 3D, area |
| parts of a whole | split bar | **waffle** 10 × 10 (shares); **icicle / treemap** (kcal → macro → kind → food, drilled); **flow** (foods → macros: where each gram came from) | a deep «what»; «da dove» | a pie (angle) |
| members judged alone (micros) | cells | **one common axis** in % of each target, a short line each (a strip); a **heat grid** member × day | comparing 20 members at once | a dot per member |
| time · a span | the rail | **span chart**: one row per night, bed → wake on a 24 h axis (regularity in one look); a **24 h clock** (time of day is a circle: the one place an angle is right) | sleep, fasting, a session's length | — |
| rating 1–5 | — | a **5-step bar** (segments); over days a **heat strip**; the **distribution** (how many days at each step) | how he feels, effort | a mean with decimals |
| category | — | a **100 % bar** of shares; over days a strip coloured by category | the kind of activity, of meal | a legend far from the bar |
| score 0–100 | chip | over time a **line on the 40 · 70 band**; the criteria as a split bar | — | — |
| compare (past self, two periods) | — | a **ghost** of last time on the same bar; a **slope chart** (this week ↔ last, one line per measure) | the gym, Andamento | a % (TR-22) |
| spread, uncertainty | ± in words | a **band** around the line; a **strip** of the days' values (spread in one look) | weight, sleep regularity | hiding the value |

### 19.3 Words in the bar
The name inside the bar at its start, the value inside at its end, when the bar is long and its
fill gives contrast; otherwise the value just after the end, on the same line. One line per measure
instead of a title line above it; never «text · bar · text» (his rule, memory bars-content).
Checked at 320 px; the colours' lightness measured for contrast (the foundations, §17.4).

### 19.4 The dots
Today: the end dot of MeasureTree, the dot under each day's column, the cells, and VIS-21's mark
in the chip (filled · half · ring). Proposed: none on bars and columns (the judgement is where the
bar ends among its ranges and the tip's colour, §16.3); the chip's mark is VIS-21 and his to keep
or drop (his question, 19.5).

### 19.5 For his corrections
1. The dots: gone from bars and columns only, or also from the chip (VIS-21 changes)?
2. 19.1: a fixed-dose intake reads as yes/no, a goal can be yes/no — right?
3. 19.2: which forms to build next in the gallery on the engine (one family at a time).

## 20. One synthesis: everything he asked of the visual system (20 Nov, proposal §98)

His words: «devi pensare e pensare e pensare meglio a come poter combinare tutte le informazioni e
le richieste che ti ho fatto». No code until he corrects this section. Read for it: this file
§1–§19, proposal §64–§97, the design memories (bars-content-before-style, abstract-not-specific,
rich-not-minimal, heat-strip-design), `.claude/rules/design.md`.

### 20.1 Why twelve rounds failed (Claude's diagnosis)
1. **Each round answered his latest message and dropped the earlier ones.** Slice 2 brought the
   dots back against §16.3; the ridge broke «a bar stays a bar»; the drill cards wrote range words
   against «never write what a channel shows».
2. **Each drawing decided content, form and style at once**; he rejects the whole when one is wrong.
3. **The content per level (§8) never got his OK**, yet forms were drawn on it.
4. **Specific answers to a general question** (a meal, water) when he asked for the engine.
So the order from here: one list of requirements (20.2) → his word on the conflicts (20.3) → the
system (20.4) → the content table → the foundations measured → one family on his data.

### 20.2 His requirements, merged (one line each; the later word wins, the older is marked)
**Purpose**
- R1 One engine for every class of thing, his future trackers too; nothing added bypasses it (§18).
- R2 Abstract, not specific: the model first, checked on three classes or more.
- R3 Rich, not minimal: density by levels, never by cutting (13 Nov).
- R4 Aggregates feed summaries and both are shown (the macros → the day; criteria → the voto) (§7).
- R5 The plan and the aggregates show; a range implies a judgement (§7).
- R6 Andamento reuses the same construct for denser aggregates (§7).

**Reading**
- R7 Comprehensibility first: forms everyone already reads; the scale and the range edges readable
  on the drawing (20 Nov, round 2).
- R8 A channel before text, never losing information (§9 rule 4).
- R9 One number per measure; its scale from a channel; the unit once (§9 rule 7).
- R10 Never write what a channel shows (range words beside range colours) (20 Nov). *Supersedes §12
  rule 2 («the ranges named»).*
- R11 Never text · bar · text on one line (§67).
- R12 No dots (20 Nov, §96). *Supersedes the ● ◐ ○ end mark of §7; VIS-21's chip mark kept (§97).*
- R13 Many words could sit in the bars themselves (20 Nov, §96). *Conflicts with §6, 19 Nov: «no
  words on the bar, la rende troppo grossa».* → C1.
- R14 The base he likes: the original macro bars, one nutrient bar everywhere, kinds in fixed
  shades, the zones ruler under it, the tip in its zone (VIS-50, VIS-52; 25 Oct, 20 Nov).
- R15 Split segments only with their names; at a glance a bar is one colour (§17.3, his «perché
  sono frazionate?»).

**Structure**
- R16 Levels of expansion for every type of information, remembered per piece (§8, VIS-70).
- R17 OLAP, «migliorate e adattate al nostro contesto»: drill, roll up, slice, pivot (§11).
- R18 The place picks the frame: dynamic first, constant one tap away (§16.4).
- R19 Yes / no for anything: a fixed dose, a habit, a goal «completato» (§96, built §97).

**Form**
- R20 More interesting than plain bars (20 Nov) — yet rejected: the polygon («orribile»), 3D («per
  ora no»), the ridge (too tall, not a bar), the drill cards, three style rounds. → C5.
- R21 Compact: a bar stays a bar, straight, not tall (the ridge, 20 Nov).
- R22 Not rejected, kept for later: colours blending along the ranges; a meal drawn as its share
  of the day with the rest grey (reverted only because it answered the wrong question, §92).

**Foundations**
- R23 Dimensions are handled badly: cards, padding, colour lightness and saturation; measured, one
  scale each, never by eye (§92).
- R24 Controls small, labels fully readable (20 Nov).
- R25 At ≤ 360 px (his phone) shrink, never hide (VIS-43, 15 Nov).

**Process**
- R26 Building shows what to rethink: small visible slices (§94).
- R27 Spec before code; no wasted rounds (§98).

### 20.3 The conflicts, each with the reading Claude proposes (his to settle)
- *Settled by him, §99:* C1 is a compromise judged case by case («parlo di compromessi»), not a
  rule — the failure was the drawing; C2 as many levels as the data has, «non necessariamente solo
  due». See §21.
- **C1 Words in the bar (R13 vs §6).** The two meet if the bar *with* its words is shorter than
  today's row. Measured in `kit.css`, above the ruler (the ruler stays in both): the macro row
  (`.k-mrow`) is a text line of 14 px or more + an 8 px gap + a 6 px bar (`--track`) = 28 px or
  more; MeasureTree is 14 + 3 + 10 = 27 px; a 16 px bar holding the name at its start and the number
  at its end = 16 px. Fatter bar, row ≥ 11 px thinner. Where the fill is too short for the name, the name sits in the empty track (still
  inside the bar's outline). Proposed: words in the bar for every measure row; a hair bar (no words)
  only inside a closed Box's head.
- **C2 How many levels (§9 rule 1 «two» vs §11 «as many as the hierarchy» vs VIS-70 «three»).**
  Proposed: as many as the hierarchy has (drill), but **a view never shows more than two at once**:
  the node and its parts' tier; a tap on a part makes it the node, a path rolls back up.
- **C3 Range names (§12 rule 2 vs R10).** Proposed: the edges' **amounts** are the scale and are
  written (at level 1, under the bar); the range **names** are never written (lightness steps and
  where the bar ends say them); the name lives in «Perché?».
- **C4 Judgement without dots, still never colour alone (VIS-20).** Proposed: the zones are steps
  of lightness behind the bar, so where it ends is read without hue; the tip's colour only doubles
  it. VIS-20 holds; VIS-52's ruler stays.
- **C5 «More interesting» vs comprehensible and compact.** Proposed: the interest comes from what
  the forms *do together*, not from new shapes — drill and pivot in place (R17), the dynamic frame
  over the constant one (a meal lit inside its day, R18, R22), the plan growing into the day, the
  ghost of last time, motion between levels (VIS-90). The shapes stay ones everyone reads (§19.2).

### 20.4 The system (all of it, in one place)
1. **What is drawn** = a measure × a frame × a level (§17); the measure's class and reading come
   from the registry (§18, MOD-56/57), and any measure may read as yes / no (§19.1).
2. **One family per reading**, a form everyone reads (R7), compact (R21):
   | Reading | Level 0 (a line) | Level 1 (open) | Over a period |
   |---|---|---|---|
   | amount | the bar with its words (C1), one colour (R15) | + its parts' tier, named; the edges' amounts (C3) | columns on the zone bands ≤ 14 days; a month as a calendar tinted by zone; longer, a line on the band |
   | parts of a whole | the total's bar | the tier on the total's scale, each named | the same, per day |
   | members (micros) | «n su m», the group's bar | a strip of cells, one per member, condensed (PAT-40) | a grid member × day |
   | time, a span | its stretch on the rail (VIS-60) | bed → wake against need | one row per night on a 24 h axis |
   | rating 1–5 | a 5-step bar | + the note | a strip by day; the distribution |
   | yes / no | the voce's shape (VIS-22) | — | 7 cells · calendar · a goal's n cells (built) |
   | category | a 100 % bar | its shares named | a strip coloured by category |
   | score | the chip (VIS-43, VIS-21) | the criteria's tier on 0–100 | a line on the 40 · 70 band |
   | compare | the ghost of last time on the same bar | the gap, its direction | a slope this ↔ last |
3. **The channels are fixed** (§16.3), checked on every photo as a list: hue = what; length on a
   shared scale = how much; where it ends among lightness steps = how good; hatch = planned; solid
   = done; struck = skipped; transparency and «≈» = uncertain; under its whole = part of; order =
   rank. No dots (R12); nothing written twice (R10); never text · bar · text (R11).
4. **Text budget per view:** the name and one number (in the bar, C1), the unit once per group;
   at level 1 the edges' amounts; everything else in «Perché?».
5. **Levels and OLAP** (C2): tap = drill (the part becomes the node), path = roll up, the period
   switch = roll up in time, «fatto · previsto» = slice, «per macro · per pasto · per momento» =
   pivot on the same chart (R17).
6. **Frames per place** (§16.4): the timeline = the day (a voce lit inside it); the gym = the
   session (each set against its ghost); an object's page = own; Andamento = the period.
7. **Foundations** (R23): one scale each for bar heights, gaps, padding, type and colour lightness
   / saturation, measured on the app and written as tokens before any family is drawn.
8. **The guard** (R1, §18.5): a page draws no number outside the engine.

### 20.5 What is already built and fits
The model and the request (slices 1–2), yes / no (§97), no dots on bars (§97). Kept as they are:
`MeasureView` dispatching to kit pieces. Not fitting yet: MeasureTree writes the name and number
above the bar (C1), and its period columns show no edges' amounts.

### 20.6 Next, one stop each
1. He settles C1–C5 (a word each).
2. Claude merges §8 into 20.4's table: for every type of §8, its readings and what each level
   holds — content only; his OK.
3. The foundations measured (R23) and written as tokens; his OK.
4. One family — *amount*, the base he likes — at every level and frame on his data, in the real
   app, photographed; then the others, one at a time.
Once 20 is agreed, §1–§19 are history: the agreed parts become VIS- and PAT- rows in the delta.

## 21. Instruments by purpose, each as dense as the macro bar (20 Nov, proposal §99–§100)

His words: «la cosa fondamentale è condensare il più possibile informazione, senza perdere in
comprensibilità e bellezza»; and «il tuo problema è che ogni volta è come se usassi solo una metrica
singola… quando potresti usarne tante contemporaneamente». This replaces §20.4's table (one reading
→ one family): a view is an **instrument chosen by the question it answers**, filled with **every
channel the data has**. No code until he corrects it.

### 21.0 The first rule and how it is checked
**Condense as much information as possible, without losing comprehensibility or beauty.** Three
tests, run on every photo, so the rule is measured and not argued:
- **Density:** the facts one instrument carries, per pixel of height (the macro bar today: 9 facts
  in one row, §21.1).
- **Comprehensibility:** list the questions the instrument answers; each is answered by **one
  glance at one channel**, without reading a word (the number is the one exact value). Two
  channels on one fact only as VIS-20's redundancy (never colour alone).
- **Beauty:** only the foundations' tokens (sizes, gaps, lightness, saturation, measured: §20.4.7);
  one hue per identity, its shades for its kinds; edges aligned; motion only between levels.

### 21.1 The reference: the macro bar, taken apart (his reading, §99)
| Channel | Fact |
|---|---|
| hue | which macro |
| shade (lightness) of the hue | its kind or quality (alta · media · bassa) |
| length on the scale | how much |
| hatch after the fill | the plan |
| tick | the target |
| the ruler under it: each stretch's length, thickness and colour | the ranges and which is best |
| amounts at the ruler's edges | the scale of the ranges |
| colour of the tip | the judgement |
| the numbers above | the exact value and the scale |
**Free channels left on the same bar**, each a fact it could still carry without losing the others:
thickness (its weight in the day), transparency (certainty, an estimate), position of the fill's
pieces along the bar (when: the day's moments, his «momenti»), a fading tail after the fill (how
long an effect lasts, his «durate degli assorbimenti»), a ghost mark (last time), a notch (the
record), a mean tick (the week's mean, already on the limits). They can be added one at a time,
each tested by 21.0.

### 21.2 Channels that stack and channels that fight
Stack (read apart, Bertin's «selective»; Garner's separable dimensions): position or length + hue;
length + texture (hatch); length + shade inside one hue; position + shape (VIS-22's states);
length + a mark on the same scale (tick, ghost, notch). Fight (read as one, integral): width +
height (read as area); two hues for two categories on one mark; size + shape; saturation +
lightness used for two facts. Rule: a new fact takes a free **separable** channel, or a new
instrument.

### 21.3 The instruments (one per question; «e cosa altro?»)
| Question | Instrument | Channels it carries at once | Where in lifeos |
|---|---|---|---|
| **Reach**: how far towards a target | the bar (21.1) | the nine of 21.1 + its free ones | macros, kcal, limits, water, sets, steps |
| **Prediction**: where will it end | the **fan**: solid done → hatched plan → a forecast that fades and widens | done, plan, forecast, uncertainty (width), the goal as a line, the day it is reached, the ranges behind | the day still going (FD-34), weight → its goal date, a session's expected end, stores emptying |
| **Trend**: where is it going | a **line over the range band** | slope (direction), the band (ranges), transparency (noise), the real readings as marks, the same period last time as a ghost line, the goal | weight, the voto over weeks, an exercise's e1RM (TR-24) |
| **Yes / no**: did I do it | **cells and calendar** (built, §97) | VIS-22 shape (fatto · previsto · saltato), hue (what), the streak, a goal's n cells, shade = when in the day | creatine, habits, a goal «n volte» |
| **Rhythm**: when, and how long | the **time rail** (VIS-60), or a 24 h circle | vertical position (time), length (duration), thickness (amount), shade (kind), a fading tail (effect over time), hue (what) | meals, caffeine fading to bedtime (FD-62), sleep, a session, absorption |
| **Stock**: a level that fills and empties | the **tank** | level now, what came in and went out (marks on its side), when it empties (a dashed fall), its ranges | creatine stores, water balance, energy balance, pantry, money |
| **Comparison** with himself | the **ghost**, on any instrument above | last time, the record, the gap and its direction | the gym (TR-20/23), this week ↔ last |
| **Composition**: what it is made of | **parts on the whole's scale** | shade (kind), size (share), one part lit inside the whole | a macro's kinds, a meal inside its day (R22), the voto's criteria |
| **Source**: where from, where to | **ordered rows**, or a **flow** | order (rank), length (amount), a link from source to whole | «da dove», the costliest part, money |
| **Spread**: how regular | a **band** or a **strip of days** | width (how irregular), the outliers, the mean | sleep times, weight's water noise |
| **Verdict**: one word for all of it | the **skyline chip** (VIS-43) | built from the instruments above with fewer channels: width = weight, height = score | every judged Box |

### 21.4 Instruments combine
As the voto combines its criteria, instruments aggregate into one view on a shared axis, each
dropping channels it no longer needs: the day = «reach» bars sitting on the «rhythm» rail (each
voce where and when it happened, its thickness its share, its tail its effect); a period = «trend»
lines stacked on one time axis with the yes / no cells under them; a session = its sets as
«reach» bars with the ghost of last time, on the session's rail.

### 21.5 What it changes in the engine (MOD-56)
A measure declares the **questions** it answers (reach · prediction · trend · yes / no · rhythm ·
stock · compare · composition · source · spread · verdict), not only its reading; the page's frame
and level pick the question; the engine picks the instrument and fills **every channel the data
has** (21.0's tests decide when one more channel costs comprehension). Slices 1–3a stay: readings,
frames, levels and yes / no are inputs to this.

### 21.6 Next, one stop each
1. His word on this section.
2. Each instrument specified on his data: its questions, its channels, its free room, its levels —
   content only (merging §8).
3. The foundations measured (21.0, beauty).
4. The bar rebuilt as the reference with its free channels added one at a time (moments, the
   tail, the ghost), each shown and tested by 21.0; then the fan, the rail, the tank.
