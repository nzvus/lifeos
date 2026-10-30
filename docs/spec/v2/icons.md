# v2 — Icons: one system, four levels

Decided 2026-10-16. The developer asked for icons that are bound once to
every category and type, hierarchical and modular, with own icons for
foods and meals as for exercises, the category drawn large behind each
page, and rules for how an icon sits next to text. It refines the kit
(kit.md §1) inside ADR-0054; no new ADR.

**Principle.** A page never names an icon. It passes data (domain, kind,
food group, dish, movement, equipment, state) and one resolver picks the
drawing, so the same thing always has the same icon everywhere.

## 1. Sources

- **Tabler Icons 3.19.0** (MIT, © Paweł Kuna): 24 grid, 2 px stroke,
  round caps. It covers places, domains, kinds, foods, dishes and tags.
- **Drawn for lifeos** only where Tabler has nothing: the strength
  movements, legumes, tubers, sauces, and the corner marks. They follow
  Tabler's rules (24 grid, 2 px padding, 2 px stroke, round joins).
- One source file holds the whole table: `icons.json` in the boards
  tools, built into the `Glyph` registry. `packages/kit` mirrors it.

## 2. The four levels and the resolver

| Level | What | Examples |
|---|---|---|
| Place | the five places + Settings | Oggi (sun), Piano (calendar-week), ⊕ (circle-plus), Andamento (trending-up), Libreria (books) |
| Domain | the family: hue + glyph, also the page's backdrop | Cibo, Bere, Allenamento, Sonno, Corpo, Mente, Soldi, Dispensa, Abitudini, Obiettivi, Tempo, Libreria, Impostazioni, Ambiente, Lavoro |
| Kind | a type inside a domain (a subcategory wins over its kind: a lunch is drawn as a lunch) | Cibo: meal (colazione, pranzo, spuntino, cena have own drawings, 30 Oct UI-81), ingredient, product, recipe · Allenamento: session, exercise, cycle · Soldi: movement, receipt, budget · Dispensa: stock, shopping, batch |
| Item | derived from the item's data | an exercise from its movement; an ingredient from its food group; a meal from its dish |

The resolver tries, in order:
0. a control's role (`ui`: back, more, search, close, add, sort, edit,
   delete, time, settings, done, scan, photo, filter, swap, move, copy,
   link, lock, theme) or a nutrient (`nutrient`: kcal, protein, carbs,
   fat, fiber, sugars, sat, salt, micro, in its macro's hue), or a
   section header (`section`: identity, values per 100 g, products and
   formats, macro kinds, micros, sources, preview, used in), which
   replaces the header's colour bar so sections differ at a glance;
1. the user's own choice (`icon`);
2. a tag, when the thing is one (`tag`);
3. the item's data: movement (`pattern`), dish (`dish`), food group (`group`, and `fine` for a finer drawing);
4. the kind (`kind`, or the subcategory);
5. the domain (`fam`);
6. the place.

The hue is always the domain's. The subcategories of food (breakfast,
lunch, snack, dinner) change the hue, never the drawing.

## 3. Items

- **Ingredient:** one of 18 groups, the 16 FoodEx2 level-1 groups of
  kinds.md plus herbs and spices, and sauces and condiments:

  | Group | Glyph | Finer glyphs |
  |---|---|---|
  | meat | meat | |
  | fish | fish | |
  | eggs | egg | |
  | dairy | milk | cheese, yogurt |
  | legumes | legume* | |
  | soy | seeding | |
  | whole cereals | grain | |
  | refined cereals | bread | |
  | tubers | potato* | |
  | vegetables | carrot | mushroom, pepper, salad |
  | fruit | apple | lemon, cherry (berries), melon |
  | nuts and seeds | nut | |
  | oils | droplet-half | |
  | sweets | candy | cookie, ice-cream |
  | drinks | cup | coffee, bottle, water glass |
  | supplements | pill | flask (powders) |
  | herbs | leaf | salt (spices) |
  | sauces | sauce* | |

  (* = drawn for lifeos)

  v1 has no group. The import review assigns one to each ingredient from
  its name and description, and asks about the uncertain ones.
- **Meal or recipe:** first the dish it is: ice cream, porridge,
  sandwich, first course, salad, soup, pizza (by name, editable).
  Otherwise the group of its main ingredient: the most protein, else the
  most energy ("Merluzzo al sugo" → fish).
- **Exercise:** its movement; 36 of them, from horizontal press to
  elliptical (`icons.json` movements).
- **Product:** its ingredient's drawing.
- **Session, cycle:** no own drawing in a row. They show their parts in
  a line (below).

## 4. Modifiers

- **Corner mark** (bottom-right, at most one) says how the item is made:
  - equipment for an exercise: barbell, dumbbells, cable, machine, bar;
  - state for a food: frozen, protein-enriched, canned or jarred.
- **Tags** sit in pills, at 12 px:
  - relations: extends, composed, cycle, bound to, recurrence, from the base, only here;
  - provenance: source, estimate, to confirm, edited;
  - other: done, time, protein, energy.
- **Parts in a line:** a row made of parts shows the parts' icons in
  order: a session its exercises, a cycle its steps, a meal its
  ingredients. 28 px tiles, 4 px apart, "+N" past 8. Labelled for
  screen readers ("Contiene: …").
  - The row keeps its own badge only when the badge says something the
    parts don't (a meal's dish).
- **On Find's bar, icons instead of words** (the developer, 2026-10-16):
  the sort chip shows its key's icon (a nutrient, money, time) and the
  direction; the filters chip its icon and the count of active filters;
  a quick chip the value's icon (food group, movement) and its count.
  The words stay in the open panels and in each chip's label for screen
  readers; a value with no icon keeps its word.
- **Status is not an icon:** planned, done and skipped are the box's
  shape (dashed, solid, struck).

## 5. Sizes, strokes, and the text beside them

| Size | Drawing | Tile | Stroke | Used for |
|---|---|---|---|---|
| xs | 12 | — | 2.2 | pills |
| s | 16 | 28 | 2 | parts in a line, rail, section titles |
| m | 18 | 32 | 2 | row badges |
| l | 28 | 48 | 1.75 | page headers, cards |
| xl | 64 | 96 | 1.25 | a card's background drawing, empty states |
| bg | 320 | — | 1 | the page backdrop |

- **On the first line:** a badge aligns with the first line of the
  title, not with the whole block. With a 32 px tile and a 20 px line,
  the title starts 6 px down. A two-line title never leaves the icon
  floating between the lines.
- **Gaps:**
  - 8 px badge → title;
  - 8 px header glyph → title (the space scale, shapes.md §2);
  - 4 px between parts and inside pills.
- **Sub-line:** the meta line under a badged title indents 40 px (tile + gap).
- **Mark:** a 14 px circle in the sheet colour with a 1 px ring, 4 px
  outside the tile's corner.
- **Labels:**
  - a glyph never stands alone: it has visible text or an aria label;
  - decorative ones are hidden from screen readers;
  - no icon in front of a number: the unit is enough.

## 6. Header and backdrop

- **Header:** the page's kind or domain glyph, at size l, before the
  title, in the domain's hue (24 px on sub-pages).
- **Backdrop:**
  - the page's domain glyph at 320 px, stroke 1, 6 % opacity, top-right
    and partly cropped;
  - it stays still while the content scrolls (a sticky layer, no pointer
    events);
  - in the app, when a section of another domain reaches the top (Oggi:
    meals, training, sleep…), it cross-fades to that domain with the
    kit's timing; with reduced motion it switches without animation.

## 7. In the kit

- `Glyph` holds the registry and the resolver. Props: `of` (the data),
  `size`, `tile`, `decorative`.
- Box (badge, rail, card drawings, pills, parts), PageHeader (back,
  settings), NavBar (the places, ⊕), Nutrients (macros, limits, micros),
  Scores, Settings and the backdrop all render Glyph. No board draws an
  icon of its own.
- Adding a domain, kind, food group, dish, movement, control or
  nutrient is a line in `icons.json`; it is never page code.

## Dark, 30 Oct (ledger UI-81, UI-79)
- In a row the icon is bare, in its domain's colour, before the title; a tile is **filled** (the
  domain's colour, the drawing in the sheet's colour) and only where the row is a button.
- The four meal roles have own drawings (`meal-breakfast`, `meal-lunch`, `meal-dinner`,
  `meal-snack` in icons.json `custom`), in the line of the silhouettes; one drawing, one meaning.
- The drawing behind a box sits in its free bottom-right corner, never under words (visual.md §3.4).

