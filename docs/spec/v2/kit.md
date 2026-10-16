# The kit: one set of parts for every screen

Decided 2026-10-15. The developer approved the simplified nutrient panel
and asked for it to follow the V-01 graphic choices, then for the whole
app to be made uniform this way.

**Principle.** A screen is a composition of a few components and one
stylesheet. No screen draws its own entry box, score or nutrient bar.
Adding a family, a subcategory or a scoring model is a registry entry;
it is never new screen code. `packages/kit` in v2 mirrors this file one
to one, and so do the design boards.

## 1. The registry (data, one place)
- **Families** (food, train, sleep, body, drink, money, mind, habit, and
  the non-entry ones: day, week, goal, catalog, settings):
  - identity hue;
  - icon: never named by a page; the `Glyph` resolver derives it from
    the data (icons.md: places › domains › kinds › items, marks, tags);
  - silhouette;
  - motion: where the drawing goes when the times are shown, and when
    the box opens.
- **Subcategories** bend the family's silhouette and may swap the
  drawing (breakfast, lunch, snack, dinner; strength, cardio; wake,
  bed; weight, measure; water, coffee; study; steps).
- **Scoring models** (engines.md E7): parts, weights and ranges, locked
  limits, sources.
- **Nutrient kinds** (kinds.md) and their fixed shades.

## 2. The stylesheet (`kit.css`)
- The shape scale and levels (shapes.md): space, corners, type, touch,
  bars; the buttons, choices, tabs and field states. Pages pick a level,
  never a size.
- Family tokens: `--fam`, set by one class (`fam-food`, …).
- The silhouettes, the drawing layer and its motion variables.
- The skyline, tracks and segments.
- One timing token for every open and close: `--t-box` ≈ 0.5 s, on the
  box's curve. Nothing in the kit animates on its own clock.

## 3. The components
| Component | Props | Used for |
|---|---|---|
| **Box** | entry (family, subcategory, title, value, meta line, link, actions, an inline Field), score parts, density `card · row`, mode `compact · times`, open, planned, faded, rail | every item anywhere: day entries, list rows, plan blocks, weighings, sets, exercises, goals, foods, settings rows, data-quality flags |
| **Skyline** | parts, size `bg · mini · row · big` | behind a card Box; trailing a row Box; V-16 |
| **Nutrients** | foods × kinds or totals, targets, limits, micro groups, level `L0-box · L0-ribbon · L1 · L2` | food Box (L0-box), rows (L0-ribbon), day/week Box (L1), composer and catalog item (L2) |
| **PageHeader** | title, context; `back` (a sub-page: "‹ parent"), `action` | every page; top level shows the gear → Settings |
| **WeekStrip** | days with score bar or template tag | inside DateNav |
| **DateNav** | mode `day · week · month · range`, the date, day scores and templates | Oggi (day), Piano (week/month), Andamento (range): swipe, week ‹ ›, the month on the title, "Oggi" when away |
| **Field** | type `stepper · scale · choice · text · timer · slider`, label, unit, base, allowed range, help, error | every input: entry sheet, gym, composer lines, goals, filters and ranges |
| **Chart** | type `trend · bars`, data | the tracker page (trend with band and goal), Review (sleep against 7–9 h) |
| **NavBar** | active place | the bottom bar of the four top-level places; ⊕ in the middle |
| **Find** | collection `of`, items (the library's records as they are), context (slot, time, plan), total | every list and every search: ⊕, Libreria, Cibi, Pasti, Esercizi, Dispensa, Soldi, the composer, Modelli, Oggi's filters (find.md) |

Sections, stats, sheets, search fields and buttons are `kit.css` classes
(`k-section`, `k-stats`, `k-sheet`, `k-search`, `k-btn`, `k-choice`,
`k-tabs`), not components; shapes.md says which to use when. A dense section folds (`k-fold`, a `<details>` whose summary
says what it holds) and starts closed: an ingredient's macro kinds,
micros and sources.

The time rail is part of Box (`rail` on or off), so the registry that
gives a row its colour and icon stays in one place. A Box chooses what
goes inside it from its family: Nutrients L0 for
food, the muscle strip for training, the need bar for water. Pages pass
data, never colours or sizes.

An item may name its own icon from the registry (`icon`), and it wins
over the family's drawing wherever the item shows: an exercise has one,
by default from its movement (press, pulldown, squat, curl…) with the
equipment as a corner mark (`icon: 'pulldown/mcable'`), and the user can
pick another. Foods, meals and recipes, the pantry and receipts each have
their own drawing (carrot, bowl, jar, receipt). A Box of something made of parts lists their
icons in order (`icons`) instead of its own badge: a session shows its
exercises, a cycle its sessions. A session is a block model made of exercises; a cycle puts
sessions into days. "Routine" is not a word of the app.

## 4. Nutrients, conformed to V-01
- **L0-box:** inside the host Box, left of its skyline.
- **L1 and L2 open like a Box:**
  - the host's silhouette on top, with its drawing on the left and its
    score skyline behind the header;
  - each macro row opens on the same `--t-box` transition;
  - the kinds and the foods slide in with the row, not after it.
- **The macro icons behave like drawings:** small when closed; when the
  row opens they grow and tilt, on the same transition.
- **Tapping a food highlights it in every row**, the way a tapped entry
  highlights on the day.

## 5. Screens → components
| Screen | Built from |
|---|---|
| V-01 Today | PageHeader, WeekStrip, the day as a Box (L1, micros), timeline of card Boxes with the rail, NavBar |
| V-02 Add | sheet: search, a `choice` Field (now/planned/earlier), the kinds as row Boxes, "usual at this hour" and "recent" as row Boxes with "+" |
| V-03 Entry | sheet: the live card Box preview, Fields generated from the kind, relation pills |
| V-04 Composer | PageHeader, ingredient row Boxes with a stepper Field (recipe base shown when changed), the meal card Box open with Nutrients L2, suggestion rows, servings Field |
| V-05 Gym | PageHeader, session card Box, timer Field, sets and next exercises as row Boxes, steppers (per dumbbell, total shown), RIR scale |
| V-06 Trackers | grouped row Boxes with the week's mini skyline, Goals, new tracker, NavBar |
| V-06 Tracker page | PageHeader, card Box, stats, range Field, Chart trend, weighings as row Boxes with their own score |
| V-07 Catalog | PageHeader, search, sort and group Fields, the open item as a card Box with Nutrients L2 per 100 g, foods as row Boxes with the food score |
| V-08 Plan | PageHeader, WeekStrip with templates, cycle row, the template as row Boxes in "times" mode, habits, NavBar |
| V-09 Goals | PageHeader, goals as row Boxes with progress strip and pace skyline, the new-goal Fields and the derived pace |
| V-06 Andamento, Il periodo | PageHeader, range Field, the week as a Box (L1), scores as row Boxes, Chart bars, correlations and data quality as row Boxes, NavBar |
| V-14 Settings | PageHeader, sections of row Boxes (account, body, day, trackers, data A/B/C, trash), theme Field |
| V-16 Scores | PageHeader, model Field, subject Box, Skyline big, bounded weight sliders, context |

## 6. One data source
- The boards read one `DATA` block generated from the developer's export
  plus a file of marked example values: no page types its own numbers.
- The v2 app does the same through the engines.
- The weekday, the week and the 7-day averages are computed, never typed.
  Typing them made the boards show 15 October 2026 as a Wednesday; it was
  a Thursday.
- Pages pass raw values; one formatter (`F`) writes numbers, units,
  dates and judgements (content.md).

## 7. Compact by rule
- One line per row where possible; secondary details only when opened.
- No card inside a card; 16 px gutters; 44 px targets.
- A choice that can grow (more than four options, or a list the person
  extends: day types, groups, categories) is a drop-down, never a row of
  chips that breaks the layout.
- Numbers, units, dates and words as content.md says, through `F`.
- Every page fits its frame; the boards are checked for overflow, broken
  links and overlapping frames before each publish.
