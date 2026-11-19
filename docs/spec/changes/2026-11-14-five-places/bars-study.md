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

