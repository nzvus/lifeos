# The target, as tables — foods and meals first (approved 15 Nov, §47)

Step 3 of proposal §44. A draft by Claude, 15 Nov 2026: nothing here is decided until he says so
(rule 1). He reviews tables, not screens. §1 is fact, read from the code and two photos of 12 Nov
(`cibo_elenco_390`, `cibo_cibo_…_390`); §2–§4 are the proposal; §5 is what he must settle.
Not opened for this draft: the composer and the duplicates page as photos (code only), the kit's
`Composer` piece, the gym, every other type.

## 1. Today — the same thing, drawn again in each place

### A cibo is drawn 9 ways
| # | where | drawn by | shows | opens |
|---|---|---|---|---|
| 1 | Cibo · Elenco, Oggi · Elenco search | `Library.tsx` → `Box` row | icon · name · the sort's number · skyline + voto · «1 prodotto» | its page |
| 2 | Dispensa | `shelves.tsx` → `Box` row | name · scorte | its page at «In casa» |
| 3 | its page, the values | `ObjectPage` rows + `InPlace` | 9 label rows, one per line | edit in place |
| 4 | its page, voto and «Così appare» | `OpenBox` + a `<details>` with `Nutrients` | voto per 100 kcal; 100 g as a meal | in place |
| 5 | its page, «Marche» | `food-extra.tsx` → `Box` row | brand · €/kg · uses · formats as words | **nothing** |
| 6 | «Usato in», a pasto's «I cibi» | hand-made `k-line` rows | name · amount | a link, or nothing |
| 7 | the composer's search | `FoodSearch` → `Find` row | name · brand · kcal/100 | adds it |
| 8 | the composer's line | `Composer.tsx` card + `LinePicks` `<select>` | stepper · «Marca» · bar · «Togli» | — |
| 9 | an open meal on the day | `Nutrients` food chip | «200 g · 306 kcal» | lights its share |

Create: `FoodForm` (3 inputs by hand) and `BarcodeBox` (2 inputs, 5 buttons by hand).
**No screen links to a marca's or a formato's own page**: a brand can be made («+ Marca»), never
opened, changed, archived or merged from the app, though the registry gives it every verb.

### A pasto (saved) and a meal on the day are drawn 6 ways
| # | where | drawn by | shows | opens |
|---|---|---|---|---|
| 1 | Cibo · Elenco «Pasti salvati» | `Library.tsx` → `Box` row | name · the sort's number · «stima» | its page |
| 2 | the pasto's page | `recipe-extra.tsx`, hand-made `k-line` rows | totals as plain rows, its cibi as plain rows, Famiglia | «Registra», «Cambia i cibi» |
| 3 | the composer, 6 routes | `Composer.tsx` (730 lines) | lines, search, «come sarà» (`Nutrients`), the day with it | Salva |
| 4 | the day (Oggi) | `EntryRow.tsx` → `Box` | silhouette · skyline + voto · four bars; open: criteria, × servings, food chips, `Nutrients`, cost | in place; «›» = the composer |
| 5 | ⊕ | `aggiungi/page.tsx` → `Box` row | name · «5 giorni su 28 a quest'ora» | logs it |
| 6 | the composer's «Pasti» tab | `Find` row / `k-pick` + `Box` | kcal · protein · «adatto 80» | adds it |

The richest drawing (4: voto with its criteria, every nutrient, cost) exists only on the day.
The pasto's own page (2) has none of it: no voto, no bars, no micros, no cost.

### Taps to change one thing from the Elenco
| he wants to | today | pages crossed |
|---|---|---|
| change a food's amount in a saved meal | Elenco → pasto → «Cambia i cibi» → composer → Salva → pasto → Elenco | 3, and back |
| see a saved meal's voto or micros | not possible from the Elenco (log it first, read it on the day) | — |
| change a brand's price or values | not possible (no page is linked) | — |
| see which brands and sizes a food has | Elenco → cibo → scroll past 9 rows and 2 boxes | 2 |

### A quantity, a time or a date is typed 5 ways (map §1: 17 components)
`Field` stepper (9) · `Field` time (6) · `Stepper` (1) · `InPlace` (2) · `<input inputMode>` by hand (1).

## 2. Target — one type, one of each

One rule for every catalog type: **the row, the box and the page are the same piece at three
levels** (VIS-40, VIS-70), so a thing looks and acts the same wherever it is met.

| level | what it is | where it is used |
|---|---|---|
| 0 · row | `Box` closed: icon · name · one value · score chip | every list, search result, ⊕ row, «Usato in», a meal's cibi, Marche, Dispensa |
| 1 · open in place | the same `Box` open: its doors, one at a time; values edited by a tap (`InPlace`) | the same lists: a tap opens it where it is, no page change |
| 2 · page | the same open box alone on a page, plus «Altro» (parti da, variante, unisci, archivia) | only by «Apri» from level 1, a link, or an address |

| type | row value | doors when open | children shown nested (MOD-21) | form | verbs |
|---|---|---|---|---|---|
| cibo | kcal/100 or the sort's number | Voto (criteria rulers) · Nutrienti (`Nutrients`, 100 g) · Etichetta (the 9 values, `InPlace`) · Marche · In casa · Usato in | its marche, each with its formati | one `ObjectForm` from the registry + the barcode as a `Field` | crea · parti da · unisci · archivia |
| marca (prodotto) | €/kg | Etichetta (only what differs from the cibo) · Formati · Prezzi | its formati | the same form, «di» its cibo | crea · unisci · archivia |
| formato | size · € | Prezzi (MOD-22: each one seen) | — | generated | crea · archivia |
| pasto (saved) | kcal · voto | Voto · Nutrienti · Cibi (each a cibo row with its amount as the value, changed in place) · Costo · Varianti | its varianti, each saying only what differs | `Composer` (the one editor of lines) | crea · parti da · variante · unisci · archivia · registra |
| meal on the day (voce) | kcal · voto | the same four doors as a pasto, plus quanto · quando (PAT-31) | — | the same `Composer` | fatto · salta · sposta · salva come pasto · elimina |

So a pasto in the Elenco and a meal in Oggi are **one box**: the day adds only when, how much
and its status (VIS-22). This is his example of 15 Nov («i pasti vengono visualizzati sia in oggi
che in elenco… è naturale pensare che tutto questo debba essere uniformato»).

### One way to type each thing
| what is typed | the one control | never |
|---|---|---|
| an amount while composing or in a form | `Field` stepper, 44 high, unit inside (VIS-86) | a bare `Stepper`, an `<input>` |
| a value he reads and sometimes corrects | `InPlace` (tap, leave saves, «Salvato · Annulla», PAT-13) | a form page for one value |
| a time, a date | `Field` time / date | — |
| a choice from a list he extends (marca, formato) | `Field` `grows` drop-down (his 15 Nov) | `<select>`, chips |

## 3. What each place composes
| place | composes | does not own |
|---|---|---|
| Cibo · Elenco | `Find` + sort + one `List` of rows per type (cibi, pasti, dispensa), each row opening in place | no drawing of a cibo or pasto of its own |
| Oggi (the day) | the time rail + the same boxes with quando and status | no meal box of its own |
| ⊕ | `Capture`: the same rows, one tap logs | — |
| the composer | `Find` + lines, each line a cibo row whose value is the amount | no ingredient card of its own |
| the object page | the box at level 2 + «Altro» | no sections written per type |

## 4. Backlog — today minus target (each item removes more than it adds)
| # | convergence | replaces | by | deletes (about) |
|---|---|---|---|---|
| B1 | a pasto's page and Elenco row show the day's meal box | `recipe-extra.tsx` hand rows (125 lines) | the box `EntryRow` already draws, moved out of `features/day` | 1 renderer, the plain totals |
| B2 | a row opens in place in the Elenco | page hop for reading | `Box` open, as on the day | 2 of the 3 pages in the table above |
| B3 | Marche and formati nested under their cibo, each a row that opens | the Marche row that opens nothing | the same row at level 0/1 | — (adds the missing link and edit) |
| B4 | «Usato in» and a pasto's cibi are rows | 2 hand-made `k-line` lists | `List` of rows | 2 hand lists |
| B5 | the composer's line is the cibo row | the composer's own card + `LinePicks` `<select>` | row + `Field` stepper + `Field` `grows` | 1 card, 1 select |
| B6 | cibo and marca created by the generated form | `FoodForm` (209 lines, 3 inputs by hand) | `ObjectForm` + the barcode field | 1 form |
| B7 | one typed-amount control | `Stepper` in `WaterRow`, the `<input>` in `BarcodeBox` | `Field` stepper | 2 variants |
| B8 | the guard | — | a check that fails when a type gains a second renderer or editor; `map --check` in CI | — |

Order proposed: B1 → B2 → B4 → B3 → B5 → B6 → B7, B8 with B1. Each is one PR, shown as photos of
the real screen before merging (design.md rule 1). Line counts above are of today's files; what
each PR really deletes is measured in the PR.

## 5. Settled: his «ap yc» of 15 Nov took (a) on all five (proposal §47)
1. **Row = box = page at three levels** for every catalog type (§2). (a) yes, as written
   *(recommended: it is his «riusare le schede che si usano in oggi»)* · (b) keep a separate
   page layout, share only the pieces inside it · (c) something else.
2. **Opening in place in the Elenco** instead of going to the page. (a) a tap opens in place,
   «Apri» goes to the page *(recommended: removes the page hops)* · (b) a tap still goes to the
   page, which becomes the box.
3. **Marche and formati**: (a) nested under their cibo, opened in place, no list of their own
   *(recommended)* · (b) also a «Marche» shelf in the Elenco.
4. **The label's 9 values** of a cibo: (a) behind one door «Etichetta», closed at first
   *(recommended: the page now opens on 9 rows before anything judged)* · (b) stay first.
5. **The order** of §4, and whether exercises and schede follow the same table next
   *(recommended: yes, after B1–B2 are approved on foods and meals)*.
