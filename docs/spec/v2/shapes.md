# v2 — Shapes: seven levels, one scale

Decided 2026-10-16. The developer asked for the icon study to be done
also for the shapes of tabs, windows, sub-windows, pages, boxes, buttons
and bars, with the same method. The boards had 25 corner radii, 20
paddings and 16 font sizes, about 300 inline styles in the pages, and
five kinds of button with no rule on when to use which. This file
refines the kit (kit.md §2) inside ADR-0054; no new ADR.

**Principle.** A page picks a level, never a radius, a padding or a font
size. Each level has one shape, the measures come from one scale each,
and a control has one role you can see from its shape: a tab never looks
like a button.

## 1. Levels

| Level | What it is | Shape |
|---|---|---|
| L0 Page | a place's page, `paper` background, backdrop | no frame; 16 px side gutter |
| L1 Sheet | rises from below: an entry, a day's sheet, filters | top corners 20, bottom 0; the one surface with a shadow; grabber; dims the page |
| L1′ Sub-page | a full-screen editor: composer, ingredient, cycle | like L0, with "‹ parent" in the header; no frame |
| L2 Section | a group of things on a page | no frame: a title (19) with its 2 px rule and accent; may fold (`k-fold`) |
| L3 Card | the card Box, a summary, a scorecard | corners 16; 1 px outline; the domain silhouette; padding 12 / 16 |
| L4 Row | the dense Box, list rows, stats | corners 12; the same silhouette; padding 8 / 12 |
| L5 Control | fields, buttons, segmented, search | corners 8; height 44 (36 inside a row) |
| L6 Mark | pills, tags, badges, status dots | round (pills, dots) or 4 (badges) |

**Concentric corners.** A surface inside another has
corner = outer corner − padding, never under 4. A row in a card with
4 px padding gets 12; a control in a sheet with 12 px padding gets 8;
a segmented option (8, padding 4) gets 4. Corners run parallel and never
fight.

## 2. Tokens (`kit.css :root`)

| Scale | Values | Tokens |
|---|---|---|
| Space | 4 · 8 · 12 · 16 · 24 · 32 | `--sp-1` … `--sp-6`; every gap and padding |
| Corners | 4 · 8 · 12 · 16 · 20 · round | `--r-mark`, `--r-control`, `--r-row`, `--r-card`, `--r-sheet`, `--r-pill` |
| Type | display 30/34 · 24/28 · 19/24 · 16/20; body 16/22 · 14/20 · 12/16; hero 40/42 | `--fs-d1…d4`, `--fs-b1…b3`, `--fs-hero` (+ `--lh-*`) |
| Rules | hairline 1 · medium 1 · strong 2; focus ring 2 | `--rule-*` (design system), `--ring` |
| Elevation | 0 everywhere; 1 for the sheet and menus | `--shadow-1`; no shadow on cards |
| Touch | 44; 36 only inside a row | `--touch`, `--touch-dense` |
| Bars | track 6 · segments 8 · tick 2 | `--track`, `--segs`, `--tick` |
| Motion | everything that opens | `--t-box` (kit.md §2) |

- Body 14 is the meta line (`k-meta`, `k-body` in ink); 12 is help,
  marks and axes. Nothing is smaller than 12.
- Optical offsets set by an alignment rule are not spacing: the first
  line beside a badge (icons.md §5) and the indent under it.
- The v1 tokens (`src/design/theme.css`) keep their names; v2's
  `packages/kit` adds this scale, and `--radius-control` goes from 6 to 8.

## 3. Domain silhouettes

A closed set in the registry, like the icons: a page passes the domain
and the subcategory, never the outline. Only L3 and L4 carry one, and
each speaks with three corners of the scale: **full** (`--r`: 16 on a
card, 12 on a row), **tight** (4) and **wide** (20 on a card, 16 on a row).

| Domain | Silhouette |
|---|---|
| food · lunch | plate: full, with a double inner rim |
| food · breakfast | cup: tight on top, wide below |
| food · snack | a bite out of the top-right corner |
| food · dinner | deep plate: full, three rims |
| train | dumbbell: full, notches on both sides |
| train · cardio | an arrow forward |
| sleep · wake | moon: wide with a bite · dawn: wide on top, tight below |
| body | a tag with its eyelet |
| money | a receipt, zigzag top and bottom |
| mind | speech bubble: full, one tight corner, a tail |
| habit | capsule: wide on every corner |
| drink | drop: wide, one tight corner |
| day · week | calendar sheet: full, a 4 px band on top (ink · herb) |
| goal | leaf: full and tight alternating |
| catalog | archive card: full, double frame |
| settings | full, no sign |

The hue is the domain's (icons.md §2). Planned items keep the outline
at 45 % and add the hatch; status is the shape, never an icon.

## 4. Controls: one role each

**Buttons, by importance** (`k-btn` + role):
- `primary`: filled, herb; at most one per screen, at the bottom (the
  sheet's foot, an editor's save), on the right of a secondary;
- `secondary`: outlined in ink;
- `link`: text in herb, in a section title, ending "›";
- `act`: round, 36 high, inside a row ("+", "↕", "Fatto");
- `icon`: 44 × 44, always with an aria label; only for icons everyone
  reads (settings, back, more).

Every button has the same states: default, pressed (1 px down, 10 %
ink), focus (2 px ring in `--focus`, 2 px out), disabled (40 %),
busy (`aria-busy`: the label gives way to a spinner, the size stays).

**Choices and tabs**, four shapes for four roles:
- **segmented** (`k-choice`, Field `choice`): up to 4 exclusive
  options with short labels. One frame on `paper`, the chosen option
  raised on `sheet` with an ink ring. More than 4 options, or labels
  that would not fit a phone (over 14 characters, or 34 in all),
  become a drop-down;
- **filter chips** (`k-chip` in `k-chips`): several at once; separate
  pills, filled with ink when on;
- **page tabs** (`k-tabs`, `k-tab`): DateNav's modes and the sub-pages
  of a place. Text only, with the 2 px tick under the current one;
- **NavBar**: only the places, always at the bottom; ⊕ is the only
  filled circle.

**Bars, by meaning:**
- **track** (`k-bar`): one quantity against its target. 6 high,
  round, a 2 px tick at the target;
- **segments** (`k-track`, `k-ribbon`): the parts of a whole (macros,
  muscles). 8 high, round, 1 px gaps, the target tick;
- **skyline**: the parts of a score (kit.md §3); corners 4 on a row,
  12 when big;
- **time rail**: only on Oggi; 4 wide, round, in the domain's hue;
- **NavBar** (above).

## 5. Fields

- Types: text, stepper, scale, select, search, timer, slider (kit.md §3).
- The label sits 4 above, the help 4 below (12/16); every control is 44
  high, steppers and selects included.
- **Error:** the frame and the help turn tomato; the message replaces
  the help and is announced.
- **Edited by you:** a herb dot after the label, and the base value with
  "↺" to go back (a recipe's grams, a template's target).

## 6. Do and don't

- Corners that fight: 16 inside 16. Inside 16 with padding 8 goes 8.
- Two primaries on one screen. The second is secondary.
- A tab drawn as a filled button. Tabs are text with the tick; a filled
  frame is an action.
- A bar drawn by hand (10 high, corners 2, no tick). Use the track or
  the segments.
- A page passing `font-size`, `padding`, `border-radius` or a colour in
  `style`. Only layout (widths, grid columns, positions) and data-driven
  values ({{…}}) are inline.

## 7. In the kit and on the boards

- `kit.css` holds the scale and the classes: `k-sheet`, Box (`k-box`
  sets `--r` per density), `k-btn` with its roles, `k-choice`,
  `k-chips`, `k-tabs`, `k-bar`, `k-track`, `k-field` with `error` and
  `edited`. The old `k-primary`, `k-secondary`, `k-act` and
  `k-icon-btn` stay as aliases until the rollout replaces them.
- The "Forme" board (next to "Icone") shows the levels nested at phone
  width, the silhouettes, every button in every state, the choices, bars,
  fields, the scales and the do/don't pairs.
- **Audit** (`boards-tools/shapes_audit.mjs`): renders every board and
  lists each corner, padding, gap and font size off the scale, and each
  inline style in a page that is not layout or data. It fails above a
  threshold that drops to zero by the end of the rollout.
