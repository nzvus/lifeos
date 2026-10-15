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
- **Families** (food, train, sleep, body, drink, money, mind, habit):
  - identity hue;
  - icon and the richer "open" drawing;
  - silhouette;
  - motion: where the drawing goes when the times are shown, and when
    the box opens.
- **Subcategories** bend the family's silhouette and may swap the
  drawing (breakfast, lunch, snack, dinner; strength, cardio; wake,
  bed; weight, measurements; water, coffee).
- **Scoring models** (engines.md E7): parts, weights and ranges, locked
  limits, sources.
- **Nutrient kinds** (kinds.md) and their fixed shades.

## 2. The stylesheet (`kit.css`)
- Family tokens: `--fam`, set by one class (`fam-food`, …).
- The silhouettes, the drawing layer and its motion variables.
- The skyline, tracks and segments.
- One timing token for every open and close: `--t-box` ≈ 0.5 s, on the
  box's curve. Nothing in the kit animates on its own clock.

## 3. The components
| Component | Props | Used for |
|---|---|---|
| **Box** | entry (family, subcategory, title, value, link), score parts, mode `compact · times · open`, planned | every entry anywhere: the day, lists, plan blocks, a weighing, a session header, a meal header |
| **Skyline** | model, scores, size `bg · mini · row · big` | behind a Box; a weighing's mini; a Review row; V-16 |
| **Nutrients** | sources × kinds, targets, level `L0-box · L0-ribbon · L1 · L2`, host family | inside a food Box (L0-box), list rows (L0-ribbon), day header and composer (L1), the window (L2) |
| **Rail** | time, family, mode | the time rail of every timeline |

A Box chooses what goes inside it from its family: Nutrients L0 for
food, the muscle strip for training, the need bar for water. Pages pass
data, never colours or sizes.

## 4. Nutrients, conformed to V-01
- **L0-box:** inside the host Box, left of its skyline.
- **L1 and L2 open like a Box:**
  - the host's silhouette on top, with its drawing on the left and its
    score skyline behind the header;
  - each macro row opens on the same `--t-box` transition;
  - the kinds and the foods slide in with the row, not after it.
- **The macro icons behave like drawings:** small when closed; when the
  row opens they grow and swap to the kind legend.
- **Tapping a food highlights it in every row**, the way a tapped entry
  highlights on the day.

## 5. Screens → components
| Screen | Box | Skyline | Nutrients | Rail |
|---|---|---|---|---|
| V-01 Today | every entry | bg | L0-box, L1 day header | yes |
| V-02 Add | suggestions (compact) | bg | L0-ribbon | — |
| V-03 Entry | live preview of the entry being made | bg | L0-box | — |
| V-04 Composer | the meal header (open) | bg | L1, L2 on tap | — |
| V-05 Gym | session header, each exercise | bg, mini | — | yes (sets) |
| V-06 Tracker | each weighing | mini | — | yes |
| V-08 Plan | each block (planned) | — | targets as L1 | yes |
| V-09 Goals | each goal | mini (pace) | — | — |
| V-10 Review | week rows | row | L1 week | — |
| V-16 Scores | the subject | big | — | — |

## 6. Order of work on the boards
1. `kit.css` with Box, Skyline and Nutrients as components; V-01 rebuilt
   on them.
2. V-04 Composer and V-02 Add.
3. V-05 Gym, V-06 Tracker, V-10 Review and V-16 Scores.
4. V-03 Entry, V-08 Plan and V-09 Goals.

The old `Nutrients` board is removed when the last page stops using it.
